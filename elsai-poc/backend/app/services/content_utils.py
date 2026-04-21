"""Helpers partagés pour l'édition blog / pages / CTA."""

from __future__ import annotations

import json
import random
import re
import unicodedata

from sqlalchemy.orm import Session as DBSession

from ..models import BlogPost, CTABlock, PostCTA

_SLUG_RE = re.compile(r"[^a-z0-9]+")


def slugify(value: str) -> str:
    """Slugify FR-friendly : retire accents + non-alphanumérique."""
    if not value:
        return ""
    normalized = unicodedata.normalize("NFKD", value)
    ascii_str = normalized.encode("ascii", "ignore").decode("ascii").lower()
    slug = _SLUG_RE.sub("-", ascii_str).strip("-")
    return slug[:200] or "untitled"


def snapshot_post(post: BlogPost, db: DBSession | None = None) -> dict:
    """Snapshot complet d'un BlogPost (sérialisable JSON)."""
    data = {
        "id": post.id,
        "slug": post.slug,
        "title": post.title,
        "description": post.description,
        "hero_eyebrow": post.hero_eyebrow,
        "content_mdx": post.content_mdx,
        "tags_json": post.tags_json,
        "reading_minutes": post.reading_minutes,
        "audience": post.audience,
        "kind": getattr(post, "kind", "article") or "article",
        "target_keyword": post.target_keyword,
        "search_intent": post.search_intent,
        "cluster_id": post.cluster_id,
        "readability_score": post.readability_score,
        "readability_level": post.readability_level,
        "author_id": post.author_id,
        "author_display": post.author_display,
        "status": post.status,
        "published_at": post.published_at.isoformat() if post.published_at else None,
        "scheduled_for": post.scheduled_for.isoformat() if post.scheduled_for else None,
        "seo_title": post.seo_title,
        "seo_description": post.seo_description,
        "og_image_url": post.og_image_url,
        "schema_type": post.schema_type,
        "schema_extra_json": post.schema_extra_json,
    }
    if db is not None:
        ctas = (
            db.query(PostCTA)
            .filter(PostCTA.post_id == post.id)
            .order_by(PostCTA.sort_order)
            .all()
        )
        data["ctas"] = [
            {"cta_key": c.cta_key, "position": c.position, "sort_order": c.sort_order}
            for c in ctas
        ]
    return data


def resolve_cta_variant(db: DBSession, key: str) -> CTABlock | None:
    """Tirage pondéré parmi les variantes actives d'un CTA key (pattern PromptVersion)."""
    rows = (
        db.query(CTABlock)
        .filter(CTABlock.key == key, CTABlock.active.is_(True), CTABlock.weight > 0)
        .all()
    )
    if not rows:
        return None
    if len(rows) == 1:
        return rows[0]
    return random.choices(rows, weights=[r.weight for r in rows], k=1)[0]


def parse_tags(tags_json: str | None) -> list[str]:
    try:
        parsed = json.loads(tags_json or "[]")
        return [str(t) for t in parsed] if isinstance(parsed, list) else []
    except (ValueError, TypeError):
        return []
