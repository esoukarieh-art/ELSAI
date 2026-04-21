"""Admin API analytics (P0.10).

Agrège les données Plausible (vues, scroll_75, pwa_start) avec les events
internes ContentEvent (CTA impressions, CTA clicks, newsletter subscribes).
Aucun PII : on ne manipule que des slugs, des clés CTA et des compteurs.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

from ..admin_auth import get_admin
from ..database import get_db
from ..models import BlogPost, ContentEvent, CTABlock
from ..services.plausible import extract_rows, is_configured, query_plausible

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/admin/analytics",
    tags=["admin-analytics"],
    dependencies=[Depends(get_admin)],
)


# --- Helpers ------------------------------------------------------------------


def _period_to_days(period: str) -> int:
    if period == "7d":
        return 7
    if period == "90d":
        return 90
    return 30


def _since(period: str) -> datetime:
    return datetime.now(UTC) - timedelta(days=_period_to_days(period))


def _plausible_post_views(period: str) -> dict[str, int]:
    """Retourne {post_slug: pageviews} pour le pathname /blog/<slug>."""
    if not is_configured():
        return {}
    result = query_plausible(
        metrics=["pageviews", "visitors"],
        filters=[["contains", "event:page", ["/blog/"]]],
        dimensions=["event:page"],
        period=period,
    )
    out: dict[str, int] = {}
    for row in extract_rows(result):
        dims = row.get("dimensions") or []
        metrics = row.get("metrics") or []
        if not dims or not metrics:
            continue
        path = str(dims[0])
        if "/blog/" not in path:
            continue
        slug = path.split("/blog/", 1)[1].strip("/").split("?")[0].split("#")[0]
        if not slug:
            continue
        try:
            out[slug] = out.get(slug, 0) + int(metrics[0])
        except (ValueError, TypeError):
            continue
    return out


def _plausible_goal_count(goal: str, period: str) -> int:
    if not is_configured():
        return 0
    result = query_plausible(
        metrics=["events"],
        filters=[["is", "event:goal", [goal]]],
        period=period,
    )
    rows = extract_rows(result)
    if not rows:
        return 0
    metrics = rows[0].get("metrics") or []
    try:
        return int(metrics[0]) if metrics else 0
    except (ValueError, TypeError):
        return 0


# --- Schemas ------------------------------------------------------------------


class PostAnalyticsRow(BaseModel):
    post_id: str
    slug: str
    title: str
    audience: str
    status: str
    views: int  # Plausible pageviews (0 si non configuré)
    cta_impressions: int
    cta_clicks: int
    cta_ctr: float  # 0..1
    scroll_75: int
    newsletter_subscribes: int


class PostsResponse(BaseModel):
    period: str
    plausible_configured: bool
    posts: list[PostAnalyticsRow]


class PostDetailResponse(BaseModel):
    period: str
    plausible_configured: bool
    post: PostAnalyticsRow | None
    ctas: list["CTAVariantRow"]


class CTAVariantRow(BaseModel):
    block_key: str
    variant: str
    audience: str
    impressions: int
    clicks: int
    ctr: float


class CTAsResponse(BaseModel):
    period: str
    plausible_configured: bool
    rows: list[CTAVariantRow]


class FunnelStep(BaseModel):
    key: str
    label: str
    count: int


class FunnelResponse(BaseModel):
    period: str
    plausible_configured: bool
    steps: list[FunnelStep]


PostDetailResponse.model_rebuild()


# --- ContentEvent aggregations ------------------------------------------------


def _content_event_counts_by_slug(
    db: DBSession, period: str
) -> dict[str, dict[str, int]]:
    since = _since(period)
    rows = (
        db.query(
            ContentEvent.post_slug,
            ContentEvent.event_type,
            func.count(ContentEvent.id),
        )
        .filter(ContentEvent.created_at >= since)
        .group_by(ContentEvent.post_slug, ContentEvent.event_type)
        .all()
    )
    out: dict[str, dict[str, int]] = {}
    for slug, event_type, count in rows:
        out.setdefault(slug, {})[event_type] = int(count)
    return out


def _build_row(
    post: BlogPost,
    views_by_slug: dict[str, int],
    ce_by_slug: dict[str, dict[str, int]],
) -> PostAnalyticsRow:
    ce = ce_by_slug.get(post.slug, {})
    # Impressions CTA = events "view" internes tagués avec variant "key:variant"
    # (voir CTATrackingClient). On compte les "view" comme impressions CTA
    # seulement quand variant existe (sinon c'est une page view générique).
    impressions = ce.get("view", 0)
    clicks = ce.get("cta_click", 0)
    ctr = (clicks / impressions) if impressions else 0.0
    return PostAnalyticsRow(
        post_id=post.id,
        slug=post.slug,
        title=post.title,
        audience=post.audience,
        status=post.status,
        views=views_by_slug.get(post.slug, 0),
        cta_impressions=impressions,
        cta_clicks=clicks,
        cta_ctr=round(ctr, 4),
        scroll_75=ce.get("scroll_75", 0),
        newsletter_subscribes=ce.get("newsletter_subscribe", 0),
    )


# --- Endpoints ----------------------------------------------------------------


@router.get("/posts", response_model=PostsResponse)
def posts_analytics(
    period: str = Query(default="30d"),
    audience: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    db: DBSession = Depends(get_db),
) -> PostsResponse:
    q = db.query(BlogPost).filter(BlogPost.status == "published")
    if audience:
        q = q.filter(BlogPost.audience == audience)
    posts = q.all()

    views = _plausible_post_views(period)
    ce = _content_event_counts_by_slug(db, period)

    rows = [_build_row(p, views, ce) for p in posts]
    rows.sort(key=lambda r: (r.views, r.cta_clicks), reverse=True)
    return PostsResponse(
        period=period,
        plausible_configured=is_configured(),
        posts=rows[:limit],
    )


@router.get("/posts/{slug}", response_model=PostDetailResponse)
def post_detail(
    slug: str,
    period: str = Query(default="30d"),
    db: DBSession = Depends(get_db),
) -> PostDetailResponse:
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    views = _plausible_post_views(period) if post else {}
    ce = _content_event_counts_by_slug(db, period)

    row = _build_row(post, views, ce) if post else None

    # CTA per variant restreint aux events de ce slug.
    since = _since(period)
    variant_rows = (
        db.query(
            ContentEvent.variant,
            ContentEvent.event_type,
            func.count(ContentEvent.id),
        )
        .filter(
            ContentEvent.post_slug == slug,
            ContentEvent.created_at >= since,
            ContentEvent.variant.isnot(None),
        )
        .group_by(ContentEvent.variant, ContentEvent.event_type)
        .all()
    )
    agg: dict[str, dict[str, int]] = {}
    for variant, event_type, count in variant_rows:
        agg.setdefault(variant, {})[event_type] = int(count)

    cta_audience: dict[str, str] = {
        f"{b.key}:{b.variant}": b.audience for b in db.query(CTABlock).all()
    }

    ctas: list[CTAVariantRow] = []
    for variant_key, counts in agg.items():
        if ":" not in variant_key:
            continue
        block_key, variant = variant_key.split(":", 1)
        impressions = counts.get("view", 0)
        clicks = counts.get("cta_click", 0)
        ctas.append(
            CTAVariantRow(
                block_key=block_key,
                variant=variant,
                audience=cta_audience.get(variant_key, "all"),
                impressions=impressions,
                clicks=clicks,
                ctr=round(clicks / impressions, 4) if impressions else 0.0,
            )
        )
    ctas.sort(key=lambda c: c.impressions, reverse=True)

    return PostDetailResponse(
        period=period,
        plausible_configured=is_configured(),
        post=row,
        ctas=ctas,
    )


@router.get("/ctas", response_model=CTAsResponse)
def ctas_analytics(
    period: str = Query(default="30d"),
    db: DBSession = Depends(get_db),
) -> CTAsResponse:
    since = _since(period)
    rows = (
        db.query(
            ContentEvent.variant,
            ContentEvent.event_type,
            func.count(ContentEvent.id),
        )
        .filter(
            ContentEvent.created_at >= since,
            ContentEvent.variant.isnot(None),
        )
        .group_by(ContentEvent.variant, ContentEvent.event_type)
        .all()
    )
    agg: dict[str, dict[str, int]] = {}
    for variant, event_type, count in rows:
        agg.setdefault(variant, {})[event_type] = int(count)

    blocks = db.query(CTABlock).all()
    audience_map = {f"{b.key}:{b.variant}": b.audience for b in blocks}

    out: list[CTAVariantRow] = []
    for variant_key, counts in agg.items():
        if ":" not in variant_key:
            continue
        block_key, variant = variant_key.split(":", 1)
        impressions = counts.get("view", 0)
        clicks = counts.get("cta_click", 0)
        out.append(
            CTAVariantRow(
                block_key=block_key,
                variant=variant,
                audience=audience_map.get(variant_key, "all"),
                impressions=impressions,
                clicks=clicks,
                ctr=round(clicks / impressions, 4) if impressions else 0.0,
            )
        )

    # Ajout des variantes connues sans events (pour affichage exhaustif).
    known = {(r.block_key, r.variant) for r in out}
    for b in blocks:
        if (b.key, b.variant) not in known:
            out.append(
                CTAVariantRow(
                    block_key=b.key,
                    variant=b.variant,
                    audience=b.audience,
                    impressions=0,
                    clicks=0,
                    ctr=0.0,
                )
            )

    out.sort(key=lambda c: (c.block_key, -c.impressions))
    return CTAsResponse(period=period, plausible_configured=is_configured(), rows=out)


@router.get("/funnel/pwa-start", response_model=FunnelResponse)
def funnel_pwa_start(
    period: str = Query(default="30d"),
    db: DBSession = Depends(get_db),
) -> FunnelResponse:
    since = _since(period)

    # Étape 1 : vues article (Plausible préférentiel, fallback = events internes "view" sans variant)
    views_total = 0
    if is_configured():
        views_total = sum(_plausible_post_views(period).values())
    if views_total == 0:
        views_total = (
            db.query(func.count(ContentEvent.id))
            .filter(
                ContentEvent.created_at >= since,
                ContentEvent.event_type == "view",
                ContentEvent.variant.is_(None),
            )
            .scalar()
            or 0
        )

    # Étape 2 : clics CTA chat (on agrège tous les cta_click : les blocs "chat"
    # sont prépondérants mais on ne discrimine pas sans props Plausible).
    cta_clicks = (
        db.query(func.count(ContentEvent.id))
        .filter(
            ContentEvent.created_at >= since,
            ContentEvent.event_type == "cta_click",
        )
        .scalar()
        or 0
    )

    # Étape 3 : /start (goal Plausible "pwa_start" si configuré).
    pwa_start = _plausible_goal_count("pwa_start", period) if is_configured() else 0

    return FunnelResponse(
        period=period,
        plausible_configured=is_configured(),
        steps=[
            FunnelStep(key="view", label="Vues article", count=int(views_total)),
            FunnelStep(key="cta_click", label="Clic CTA", count=int(cta_clicks)),
            FunnelStep(key="pwa_start", label="Session /start", count=int(pwa_start)),
        ],
    )
