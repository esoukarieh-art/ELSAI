"""Admin API pour le CMS de pages statiques (accueil, etc.).

Workflow draft/publish :
    - PUT /api/admin/pages/{key}          → enregistre en brouillon
    - POST /api/admin/pages/{key}/publish → publie le brouillon
    - POST /api/admin/pages/{key}/discard-draft
    - POST /api/admin/pages/{key}/upload-image
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from ..admin_auth import (
    CONTENT_ROLES,
    PUBLISH_ROLES,
    AdminIdentity,
    get_admin,
    require_role,
)
from ..config import settings
from ..database import get_db
from ..models import AuditLog, ContentRevision, PageContent
from ..page_schemas import PAGE_SCHEMAS, get_schema
from ..services.uploads import save_page_image

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/admin/pages",
    tags=["admin-pages"],
    dependencies=[Depends(get_admin)],
)


# --- Schemas ------------------------------------------------------------------


class PageRow(BaseModel):
    page_key: str
    title: str
    status: str
    audience: str
    updated_at: datetime
    updated_by: str | None = None
    published_at: datetime | None = None
    has_draft: bool = False


class PageDetail(BaseModel):
    page_key: str
    title: str
    status: str
    audience: str
    seo_title: str | None = None
    seo_description: str | None = None
    og_image_url: str | None = None
    blocks: list[dict[str, Any]]
    draft_blocks: list[dict[str, Any]] | None = None
    has_draft: bool = False
    schema: dict[str, Any] | None = None  # type: ignore[assignment]
    updated_at: datetime
    updated_by: str | None = None
    published_at: datetime | None = None
    preview_token: str


class PagePutPayload(BaseModel):
    blocks: list[dict[str, Any]]
    title: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    og_image_url: str | None = None


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
            target_type="page_content",
            target_id=target_id,
            details=json.dumps(
                {**(details or {}), "admin_email": (admin.email or admin.user_id)}
            ),
        )
    )


def _snapshot(db: DBSession, page: PageContent, admin: AdminIdentity) -> None:
    snap = {
        "page_key": page.page_key,
        "title": page.title,
        "status": page.status,
        "blocks_json": page.blocks_json,
        "draft_blocks_json": page.draft_blocks_json,
        "seo_title": page.seo_title,
        "seo_description": page.seo_description,
        "og_image_url": page.og_image_url,
    }
    db.add(
        ContentRevision(
            entity_type="page_content",
            entity_id=page.id,
            snapshot_json=json.dumps(snap, ensure_ascii=False),
            author_email=(admin.email or admin.user_id),
        )
    )


def _parse_blocks(raw: str | None) -> list[dict[str, Any]]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except ValueError:
        return []
    return data if isinstance(data, list) else []


def _to_row(p: PageContent) -> PageRow:
    return PageRow(
        page_key=p.page_key,
        title=p.title,
        status=p.status,
        audience=p.audience,
        updated_at=p.updated_at,
        updated_by=p.updated_by,
        published_at=p.published_at,
        has_draft=p.draft_blocks_json is not None,
    )


def _to_detail(p: PageContent) -> PageDetail:
    return PageDetail(
        page_key=p.page_key,
        title=p.title,
        status=p.status,
        audience=p.audience,
        seo_title=p.seo_title,
        seo_description=p.seo_description,
        og_image_url=p.og_image_url,
        blocks=_parse_blocks(p.blocks_json),
        draft_blocks=_parse_blocks(p.draft_blocks_json) if p.draft_blocks_json else None,
        has_draft=p.draft_blocks_json is not None,
        schema=get_schema(p.page_key),
        updated_at=p.updated_at,
        updated_by=p.updated_by,
        published_at=p.published_at,
        preview_token=settings.admin_preview_token,
    )


# --- Endpoints ----------------------------------------------------------------


@router.get("", response_model=list[PageRow])
def list_pages(db: DBSession = Depends(get_db)) -> list[PageRow]:
    rows = db.query(PageContent).order_by(PageContent.page_key).all()
    # Pages déclarées dans PAGE_SCHEMAS mais jamais seedées → placeholder vide
    known = {r.page_key for r in rows}
    out = [_to_row(r) for r in rows]
    for key in PAGE_SCHEMAS:
        if key not in known:
            out.append(
                PageRow(
                    page_key=key,
                    title=PAGE_SCHEMAS[key].get("label", key),
                    status="missing",
                    audience="all",
                    updated_at=datetime.now(UTC),
                )
            )
    return out


@router.get("/{key}", response_model=PageDetail)
def get_page(key: str, db: DBSession = Depends(get_db)) -> PageDetail:
    if key not in PAGE_SCHEMAS:
        raise HTTPException(404, "Page non déclarée (schéma manquant)")
    page = db.query(PageContent).filter(PageContent.page_key == key).first()
    if not page:
        raise HTTPException(404, "Page absente en BDD — relancer le seed")
    return _to_detail(page)


@router.put(
    "/{key}",
    response_model=PageDetail,
    dependencies=[Depends(require_role(*CONTENT_ROLES))],
)
def save_draft(
    key: str,
    payload: PagePutPayload,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> PageDetail:
    if key not in PAGE_SCHEMAS:
        raise HTTPException(404, "Page non déclarée")
    page = db.query(PageContent).filter(PageContent.page_key == key).first()
    if not page:
        raise HTTPException(404, "Page absente en BDD")

    _snapshot(db, page, admin)

    page.draft_blocks_json = json.dumps(payload.blocks, ensure_ascii=False)
    if payload.title is not None:
        page.title = payload.title
    if payload.seo_title is not None:
        page.seo_title = payload.seo_title or None
    if payload.seo_description is not None:
        page.seo_description = payload.seo_description or None
    if payload.og_image_url is not None:
        page.og_image_url = payload.og_image_url or None
    page.updated_by = admin.email or admin.user_id

    _audit(db, admin, "page.save_draft", page.id, {"page_key": key})
    db.commit()
    db.refresh(page)
    return _to_detail(page)


@router.post(
    "/{key}/publish",
    response_model=PageDetail,
    dependencies=[Depends(require_role(*PUBLISH_ROLES))],
)
def publish_page(
    key: str,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> PageDetail:
    if key not in PAGE_SCHEMAS:
        raise HTTPException(404, "Page non déclarée")
    page = db.query(PageContent).filter(PageContent.page_key == key).first()
    if not page:
        raise HTTPException(404, "Page absente en BDD")

    _snapshot(db, page, admin)

    if page.draft_blocks_json:
        page.blocks_json = page.draft_blocks_json
        page.draft_blocks_json = None
    page.status = "published"
    page.published_at = datetime.now(UTC)
    page.updated_by = admin.email or admin.user_id

    _audit(db, admin, "page.publish", page.id, {"page_key": key})
    db.commit()
    db.refresh(page)
    return _to_detail(page)


@router.post(
    "/{key}/discard-draft",
    response_model=PageDetail,
    dependencies=[Depends(require_role(*CONTENT_ROLES))],
)
def discard_draft(
    key: str,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> PageDetail:
    if key not in PAGE_SCHEMAS:
        raise HTTPException(404, "Page non déclarée")
    page = db.query(PageContent).filter(PageContent.page_key == key).first()
    if not page:
        raise HTTPException(404, "Page absente en BDD")

    if page.draft_blocks_json:
        _snapshot(db, page, admin)
        page.draft_blocks_json = None
        page.updated_by = admin.email or admin.user_id

    _audit(db, admin, "page.discard_draft", page.id, {"page_key": key})
    db.commit()
    db.refresh(page)
    return _to_detail(page)


@router.post(
    "/{key}/upload-image",
    dependencies=[Depends(require_role(*CONTENT_ROLES))],
)
def upload_image(
    key: str,
    file: UploadFile = File(...),
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> dict:
    if key not in PAGE_SCHEMAS:
        raise HTTPException(404, "Page non déclarée")
    url = save_page_image(file)
    _audit(db, admin, "page.upload_image", key, {"filename": file.filename, "url": url})
    db.commit()
    return {"url": url}
