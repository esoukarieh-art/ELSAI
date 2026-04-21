"""Admin API pour le blog éditorial ELSAI (P0.3).

Endpoints sous /api/admin/blog : CRUD posts, publish/schedule, révisions,
rollback, attache CTA, check slug. Audit log sur chaque mutation.
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc
from sqlalchemy.orm import Session as DBSession

import httpx

from ..admin_auth import (
    CONTENT_ROLES,
    PUBLISH_ROLES,
    AdminIdentity,
    get_admin,
    require_role,
)
from ..config import settings
from ..database import get_db
from ..models import (
    AuditLog,
    BlogPost,
    ContentRevision,
    CTABlock,
    PostCTA,
    SlugRedirect,
)
from ..services.content_utils import parse_tags, slugify, snapshot_post

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/admin/blog",
    tags=["admin-blog"],
    dependencies=[Depends(get_admin)],
)


# --- Schemas ------------------------------------------------------------------


class PostCTAItem(BaseModel):
    cta_key: str
    position: str = "inline"
    sort_order: int = 0


class BlogPostSummary(BaseModel):
    id: str
    slug: str
    title: str
    description: str
    audience: str
    status: str
    author_id: str | None = None
    author_display: str | None = None
    cluster_id: str | None = None
    tags: list[str] = []
    reading_minutes: int = 0
    readability_level: str | None = None
    published_at: datetime | None = None
    scheduled_for: datetime | None = None
    updated_at: datetime
    seo_title: str | None = None
    seo_description: str | None = None


class BlogPostDetail(BlogPostSummary):
    hero_eyebrow: str | None = None
    content_mdx: str = ""
    target_keyword: str | None = None
    search_intent: str | None = None
    readability_score: int | None = None
    og_image_url: str | None = None
    schema_type: str = "Article"
    schema_extra_json: str = "{}"
    ctas: list[PostCTAItem] = []


class BlogPostCreate(BaseModel):
    title: str = Field(..., max_length=300)
    slug: str | None = None
    description: str = Field(default="", max_length=2000)
    hero_eyebrow: str | None = Field(default=None, max_length=120)
    content_mdx: str = ""
    audience: str = "adult"
    tags: list[str] = []
    reading_minutes: int = 0
    target_keyword: str | None = None
    search_intent: str | None = None
    cluster_id: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    og_image_url: str | None = None
    schema_type: str = "Article"


class BlogPostUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    hero_eyebrow: str | None = None
    content_mdx: str | None = None
    audience: str | None = None
    tags: list[str] | None = None
    reading_minutes: int | None = None
    target_keyword: str | None = None
    search_intent: str | None = None
    cluster_id: str | None = None
    readability_score: int | None = None
    readability_level: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    og_image_url: str | None = None
    schema_type: str | None = None
    schema_extra_json: str | None = None
    author_display: str | None = None


class ScheduleRequest(BaseModel):
    scheduled_for: datetime


class SlugCheckRequest(BaseModel):
    slug: str
    exclude_id: str | None = None


class SlugCheckResponse(BaseModel):
    available: bool
    normalized: str


class AttachCTARequest(BaseModel):
    cta_key: str
    position: str = "inline"
    sort_order: int = 0
    detach: bool = False


class RevisionRow(BaseModel):
    id: int
    entity_type: str
    entity_id: str
    author_email: str | None
    created_at: datetime


# --- Helpers ------------------------------------------------------------------


def _audit(
    db: DBSession,
    admin: AdminIdentity,
    action: str,
    target_id: str,
    details: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            actor="admin",
            action=action,
            target_type="blog_post",
            target_id=target_id,
            details=json.dumps({**(details or {}), "admin_email": (admin.email or admin.user_id)}),
        )
    )


def _snapshot_revision(db: DBSession, post: BlogPost, admin: AdminIdentity) -> None:
    db.add(
        ContentRevision(
            entity_type="blog_post",
            entity_id=post.id,
            snapshot_json=json.dumps(snapshot_post(post, db), ensure_ascii=False),
            author_email=(admin.email or admin.user_id),
        )
    )


def _slug_exists(db: DBSession, slug: str, exclude_id: str | None = None) -> bool:
    q = db.query(BlogPost).filter(BlogPost.slug == slug)
    if exclude_id:
        q = q.filter(BlogPost.id != exclude_id)
    return db.query(q.exists()).scalar() is True


def _to_summary(post: BlogPost) -> BlogPostSummary:
    return BlogPostSummary(
        id=post.id,
        slug=post.slug,
        title=post.title,
        description=post.description,
        audience=post.audience,
        status=post.status,
        author_id=post.author_id,
        author_display=post.author_display,
        cluster_id=post.cluster_id,
        tags=parse_tags(post.tags_json),
        reading_minutes=post.reading_minutes,
        readability_level=post.readability_level,
        published_at=post.published_at,
        scheduled_for=post.scheduled_for,
        updated_at=post.updated_at,
        seo_title=post.seo_title,
        seo_description=post.seo_description,
    )


def _to_detail(db: DBSession, post: BlogPost) -> BlogPostDetail:
    ctas = (
        db.query(PostCTA)
        .filter(PostCTA.post_id == post.id)
        .order_by(PostCTA.sort_order)
        .all()
    )
    return BlogPostDetail(
        **_to_summary(post).model_dump(),
        hero_eyebrow=post.hero_eyebrow,
        content_mdx=post.content_mdx,
        target_keyword=post.target_keyword,
        search_intent=post.search_intent,
        readability_score=post.readability_score,
        og_image_url=post.og_image_url,
        schema_type=post.schema_type,
        schema_extra_json=post.schema_extra_json,
        ctas=[
            PostCTAItem(cta_key=c.cta_key, position=c.position, sort_order=c.sort_order)
            for c in ctas
        ],
    )


def _trigger_revalidate(slug: str, type_: str = "post") -> None:
    url = settings.frontend_revalidate_url
    secret = settings.revalidate_secret
    if not url or not secret:
        return
    try:
        httpx.post(
            url,
            headers={"x-revalidate-secret": secret, "Content-Type": "application/json"},
            json={"slug": slug, "type": type_},
            timeout=3.0,
        )
    except Exception as exc:  # noqa: BLE001 - best effort
        logger.warning("revalidate frontend failed slug=%s err=%s", slug, exc)


def _can_edit(admin: AdminIdentity, post: BlogPost) -> bool:
    if admin.role in ("super_admin", "content_editor", "content_reviewer"):
        return True
    if admin.role == "content_author":
        return post.author_id == admin.user_id and post.status in ("draft", "review")
    return False


# --- Endpoints ----------------------------------------------------------------


@router.get("", response_model=list[BlogPostSummary])
def list_posts(
    audience: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    author_id: str | None = None,
    cluster_id: str | None = None,
    q: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: DBSession = Depends(get_db),
) -> list[BlogPostSummary]:
    query = db.query(BlogPost)
    if audience:
        query = query.filter(BlogPost.audience == audience)
    if status_filter:
        query = query.filter(BlogPost.status == status_filter)
    if author_id:
        query = query.filter(BlogPost.author_id == author_id)
    if cluster_id:
        query = query.filter(BlogPost.cluster_id == cluster_id)
    if q:
        query = query.filter(BlogPost.title.ilike(f"%{q}%"))
    rows = query.order_by(desc(BlogPost.updated_at)).offset(offset).limit(limit).all()
    return [_to_summary(r) for r in rows]


@router.post("/slugs/check", response_model=SlugCheckResponse)
def check_slug(payload: SlugCheckRequest, db: DBSession = Depends(get_db)) -> SlugCheckResponse:
    normalized = slugify(payload.slug)
    if not normalized:
        return SlugCheckResponse(available=False, normalized="")
    exists = _slug_exists(db, normalized, exclude_id=payload.exclude_id)
    return SlugCheckResponse(available=not exists, normalized=normalized)


@router.get("/{post_id}", response_model=BlogPostDetail)
def get_post(post_id: str, db: DBSession = Depends(get_db)) -> BlogPostDetail:
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(404, "Article inconnu")
    return _to_detail(db, post)


@router.get("/{post_id}/revisions", response_model=list[RevisionRow])
def list_revisions(post_id: str, db: DBSession = Depends(get_db)) -> list[RevisionRow]:
    rows = (
        db.query(ContentRevision)
        .filter(ContentRevision.entity_type == "blog_post", ContentRevision.entity_id == post_id)
        .order_by(desc(ContentRevision.created_at))
        .limit(100)
        .all()
    )
    return [
        RevisionRow(
            id=r.id,
            entity_type=r.entity_type,
            entity_id=r.entity_id,
            author_email=r.author_email,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.post(
    "",
    response_model=BlogPostDetail,
    dependencies=[Depends(require_role(*CONTENT_ROLES))],
)
def create_post(
    payload: BlogPostCreate,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> BlogPostDetail:
    slug = slugify(payload.slug or payload.title)
    if not slug:
        raise HTTPException(400, "Slug invalide")
    if _slug_exists(db, slug):
        raise HTTPException(409, f"Slug déjà utilisé : {slug}")

    post = BlogPost(
        slug=slug,
        title=payload.title,
        description=payload.description,
        hero_eyebrow=payload.hero_eyebrow,
        content_mdx=payload.content_mdx,
        tags_json=json.dumps(payload.tags, ensure_ascii=False),
        reading_minutes=payload.reading_minutes,
        audience=payload.audience,
        target_keyword=payload.target_keyword,
        search_intent=payload.search_intent,
        cluster_id=payload.cluster_id,
        author_id=(admin.user_id if admin.user_id != "system" else None),
        status="draft",
        seo_title=payload.seo_title,
        seo_description=payload.seo_description,
        og_image_url=payload.og_image_url,
        schema_type=payload.schema_type,
    )
    db.add(post)
    db.flush()
    _audit(db, admin, "blog.create", post.id, {"slug": slug})
    db.commit()
    db.refresh(post)
    return _to_detail(db, post)


@router.put(
    "/{post_id}",
    response_model=BlogPostDetail,
)
def update_post(
    post_id: str,
    payload: BlogPostUpdate,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> BlogPostDetail:
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(404, "Article inconnu")
    if not _can_edit(admin, post):
        raise HTTPException(403, "Permission insuffisante")

    _snapshot_revision(db, post, admin)

    changes: dict[str, object] = {}
    data = payload.model_dump(exclude_unset=True)

    new_slug: str | None = None
    if "slug" in data and data["slug"]:
        new_slug = slugify(data["slug"])
        if new_slug != post.slug:
            if _slug_exists(db, new_slug, exclude_id=post.id):
                raise HTTPException(409, f"Slug déjà utilisé : {new_slug}")
            if post.status == "published":
                db.add(SlugRedirect(entity_type="blog_post", old_slug=post.slug, new_slug=new_slug))
            changes["slug"] = new_slug
            post.slug = new_slug
        data.pop("slug")

    if "tags" in data:
        post.tags_json = json.dumps(data.pop("tags") or [], ensure_ascii=False)
        changes["tags"] = True

    for field, value in data.items():
        if hasattr(post, field) and getattr(post, field) != value:
            setattr(post, field, value)
            changes[field] = True

    _audit(db, admin, "blog.update", post.id, {"changes": list(changes.keys())})
    db.commit()
    db.refresh(post)
    if post.status == "published":
        _trigger_revalidate(post.slug, "post")
    return _to_detail(db, post)


@router.delete(
    "/{post_id}",
    dependencies=[Depends(require_role(*PUBLISH_ROLES))],
)
def delete_post(
    post_id: str,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> dict:
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(404, "Article inconnu")
    _snapshot_revision(db, post, admin)
    post.status = "draft"
    post.published_at = None
    post.scheduled_for = None
    _audit(db, admin, "blog.delete", post.id, {"slug": post.slug})
    db.commit()
    return {"ok": True, "status": post.status}


@router.post(
    "/{post_id}/publish",
    response_model=BlogPostDetail,
    dependencies=[Depends(require_role(*PUBLISH_ROLES))],
)
def publish_post(
    post_id: str,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> BlogPostDetail:
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(404, "Article inconnu")

    warnings: list[str] = []
    if not post.seo_title or not post.seo_description:
        warnings.append("seo_missing")
    if post.readability_level and post.readability_level > "B1":
        warnings.append("readability_above_B1")

    _snapshot_revision(db, post, admin)
    post.status = "published"
    post.published_at = post.published_at or datetime.now(UTC)
    post.scheduled_for = None
    _audit(db, admin, "blog.publish", post.id, {"slug": post.slug, "warnings": warnings})
    db.commit()
    db.refresh(post)
    _trigger_revalidate(post.slug, "post")
    return _to_detail(db, post)


@router.post(
    "/{post_id}/schedule",
    response_model=BlogPostDetail,
    dependencies=[Depends(require_role(*PUBLISH_ROLES))],
)
def schedule_post(
    post_id: str,
    payload: ScheduleRequest,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> BlogPostDetail:
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(404, "Article inconnu")
    _snapshot_revision(db, post, admin)
    post.status = "scheduled"
    post.scheduled_for = payload.scheduled_for
    _audit(db, admin, "blog.schedule", post.id, {"scheduled_for": payload.scheduled_for.isoformat()})
    db.commit()
    db.refresh(post)
    return _to_detail(db, post)


@router.post(
    "/{post_id}/revert/{revision_id}",
    response_model=BlogPostDetail,
    dependencies=[Depends(require_role(*CONTENT_ROLES))],
)
def revert_post(
    post_id: str,
    revision_id: int,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> BlogPostDetail:
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(404, "Article inconnu")
    if not _can_edit(admin, post):
        raise HTTPException(403, "Permission insuffisante")

    revision = db.get(ContentRevision, revision_id)
    if not revision or revision.entity_id != post_id or revision.entity_type != "blog_post":
        raise HTTPException(404, "Révision inconnue")

    _snapshot_revision(db, post, admin)
    try:
        snap = json.loads(revision.snapshot_json)
    except ValueError as exc:
        raise HTTPException(500, "Snapshot illisible") from exc

    for field in (
        "slug", "title", "description", "hero_eyebrow", "content_mdx", "tags_json",
        "reading_minutes", "audience", "target_keyword", "search_intent", "cluster_id",
        "readability_score", "readability_level", "author_display", "status",
        "seo_title", "seo_description", "og_image_url", "schema_type", "schema_extra_json",
    ):
        if field in snap and snap[field] is not None:
            setattr(post, field, snap[field])

    _audit(db, admin, "blog.revert", post.id, {"revision_id": revision_id})
    db.commit()
    db.refresh(post)
    return _to_detail(db, post)


@router.post(
    "/{post_id}/ctas",
    response_model=BlogPostDetail,
)
def attach_cta(
    post_id: str,
    payload: AttachCTARequest,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> BlogPostDetail:
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(404, "Article inconnu")
    if not _can_edit(admin, post):
        raise HTTPException(403, "Permission insuffisante")

    cta_exists = (
        db.query(CTABlock).filter(CTABlock.key == payload.cta_key).first()
    )
    if not cta_exists:
        raise HTTPException(404, "CTA inconnu")

    if payload.detach:
        db.query(PostCTA).filter(
            PostCTA.post_id == post_id, PostCTA.cta_key == payload.cta_key
        ).delete()
    else:
        existing = (
            db.query(PostCTA)
            .filter(PostCTA.post_id == post_id, PostCTA.cta_key == payload.cta_key)
            .first()
        )
        if existing:
            existing.position = payload.position
            existing.sort_order = payload.sort_order
        else:
            db.add(
                PostCTA(
                    post_id=post_id,
                    cta_key=payload.cta_key,
                    position=payload.position,
                    sort_order=payload.sort_order,
                )
            )
    _audit(
        db, admin, "blog.attach_cta", post.id,
        {"cta_key": payload.cta_key, "detach": payload.detach},
    )
    db.commit()
    db.refresh(post)
    return _to_detail(db, post)
