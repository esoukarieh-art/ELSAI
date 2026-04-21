"""API publique de lecture contenu (blog, pages, clusters, CTA)."""

from __future__ import annotations

import json
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session as DBSession

from ..config import settings
from ..database import get_db
from ..models import BlogPost, ContentCluster, PageContent, PostCTA, SlugRedirect
from ..services.content_utils import parse_tags, resolve_cta_variant

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/public", tags=["public-content"])

_CACHE_CONTROL = "public, max-age=60, s-maxage=300"


def _set_cache(response: Response) -> None:
    response.headers["Cache-Control"] = _CACHE_CONTROL


# --- Schemas ------------------------------------------------------------------


class PublicCTA(BaseModel):
    cta_key: str
    position: str
    sort_order: int


class PublicPostSummary(BaseModel):
    slug: str
    title: str
    description: str
    hero_eyebrow: str | None = None
    audience: str
    tags: list[str] = []
    reading_minutes: int = 0
    published_at: datetime | None = None
    updated_at: datetime | None = None
    cluster_id: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    og_image_url: str | None = None
    author_display: str | None = None


class PublicPostDetail(PublicPostSummary):
    content_mdx: str = ""
    schema_type: str = "Article"
    schema_extra_json: str = "{}"
    ctas: list[PublicCTA] = []


class PublicPageDetail(BaseModel):
    key: str
    title: str
    audience: str
    blocks: list[dict]
    seo_title: str | None = None
    seo_description: str | None = None
    og_image_url: str | None = None
    schema_type: str | None = None


class PublicClusterDetail(BaseModel):
    slug: str
    name: str
    description: str | None = None
    audience: str
    pillar_post_id: str | None = None
    posts: list[PublicPostSummary] = []


class CTAResolved(BaseModel):
    key: str
    component: str
    variant: str
    audience: str
    label: str
    props: dict


# --- Helpers ------------------------------------------------------------------


def _to_summary(post: BlogPost) -> PublicPostSummary:
    return PublicPostSummary(
        slug=post.slug,
        title=post.title,
        description=post.description,
        hero_eyebrow=post.hero_eyebrow,
        audience=post.audience,
        tags=parse_tags(post.tags_json),
        reading_minutes=post.reading_minutes,
        published_at=post.published_at,
        updated_at=post.updated_at,
        cluster_id=post.cluster_id,
        seo_title=post.seo_title,
        seo_description=post.seo_description,
        og_image_url=post.og_image_url,
        author_display=post.author_display,
    )


# --- Endpoints ----------------------------------------------------------------


@router.get("/posts", response_model=list[PublicPostSummary])
def list_posts(
    response: Response,
    audience: str | None = None,
    track: str | None = None,
    tag: str | None = None,
    cluster_slug: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: DBSession = Depends(get_db),
) -> list[PublicPostSummary]:
    _set_cache(response)
    query = db.query(BlogPost).filter(BlogPost.status == "published")
    effective_audience = audience or track
    if effective_audience:
        query = query.filter(BlogPost.audience.in_([effective_audience, "all"]))
    if cluster_slug:
        cluster = db.query(ContentCluster).filter(ContentCluster.slug == cluster_slug).first()
        if not cluster:
            return []
        query = query.filter(BlogPost.cluster_id == cluster.id)
    if tag:
        query = query.filter(BlogPost.tags_json.ilike(f"%{tag}%"))
    rows = query.order_by(desc(BlogPost.published_at)).offset(offset).limit(limit).all()
    return [_to_summary(r) for r in rows]


@router.get("/posts/{slug}")
def get_post(slug: str, response: Response, db: DBSession = Depends(get_db)):
    post = (
        db.query(BlogPost)
        .filter(BlogPost.slug == slug, BlogPost.status == "published")
        .first()
    )
    if not post:
        redirect = (
            db.query(SlugRedirect)
            .filter(SlugRedirect.entity_type == "blog_post", SlugRedirect.old_slug == slug)
            .order_by(desc(SlugRedirect.created_at))
            .first()
        )
        if redirect:
            return RedirectResponse(
                url=f"/api/public/posts/{redirect.new_slug}", status_code=301
            )
        raise HTTPException(404, "Article introuvable")

    _set_cache(response)
    ctas = (
        db.query(PostCTA)
        .filter(PostCTA.post_id == post.id)
        .order_by(PostCTA.sort_order)
        .all()
    )
    return PublicPostDetail(
        **_to_summary(post).model_dump(),
        content_mdx=post.content_mdx,
        schema_type=post.schema_type,
        schema_extra_json=post.schema_extra_json,
        ctas=[
            PublicCTA(cta_key=c.cta_key, position=c.position, sort_order=c.sort_order)
            for c in ctas
        ],
    )


@router.get("/pages/{key}", response_model=PublicPageDetail)
def get_page(
    key: str,
    response: Response,
    preview: int = 0,
    token: str | None = None,
    db: DBSession = Depends(get_db),
) -> PublicPageDetail:
    page = db.query(PageContent).filter(PageContent.page_key == key).first()
    if not page:
        raise HTTPException(404, "Page introuvable")

    preview_ok = bool(
        preview
        and token
        and settings.admin_preview_token
        and token == settings.admin_preview_token
    )

    if preview_ok:
        response.headers["Cache-Control"] = "no-store"
        raw = page.draft_blocks_json or page.blocks_json
    else:
        if page.status != "published":
            raise HTTPException(404, "Page introuvable")
        _set_cache(response)
        raw = page.blocks_json

    try:
        blocks = json.loads(raw or "[]")
        if not isinstance(blocks, list):
            blocks = []
    except ValueError:
        blocks = []
    return PublicPageDetail(
        key=page.page_key,
        title=page.title,
        audience=page.audience,
        blocks=blocks,
        seo_title=page.seo_title,
        seo_description=page.seo_description,
        og_image_url=page.og_image_url,
        schema_type=page.schema_type,
    )


@router.get("/clusters/{slug}", response_model=PublicClusterDetail)
def get_cluster(slug: str, response: Response, db: DBSession = Depends(get_db)) -> PublicClusterDetail:
    cluster = db.query(ContentCluster).filter(ContentCluster.slug == slug).first()
    if not cluster:
        raise HTTPException(404, "Cluster introuvable")
    _set_cache(response)
    posts = (
        db.query(BlogPost)
        .filter(BlogPost.cluster_id == cluster.id, BlogPost.status == "published")
        .order_by(desc(BlogPost.published_at))
        .all()
    )
    return PublicClusterDetail(
        slug=cluster.slug,
        name=cluster.name,
        description=cluster.description,
        audience=cluster.audience,
        pillar_post_id=cluster.pillar_post_id,
        posts=[_to_summary(p) for p in posts],
    )


@router.get("/ctas/{key}", response_model=CTAResolved)
def get_cta(key: str, response: Response, db: DBSession = Depends(get_db)) -> CTAResolved:
    cta = resolve_cta_variant(db, key)
    if not cta:
        raise HTTPException(404, "CTA indisponible")
    # Pas de cache (tirage A/B par requête)
    response.headers["Cache-Control"] = "no-store"
    try:
        props = json.loads(cta.props_json or "{}")
        if not isinstance(props, dict):
            props = {}
    except ValueError:
        props = {}
    return CTAResolved(
        key=cta.key,
        component=cta.component,
        variant=cta.variant,
        audience=cta.audience,
        label=cta.label,
        props=props,
    )
