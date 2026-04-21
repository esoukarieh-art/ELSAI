"""Admin API pour les CTABlocks ELSAI (P0.6).

CRUD des variantes de CTA (A/B). Pattern similaire à admin_blog.py :
- auth via get_admin (dépendance routeur)
- CONTENT_ROLES pour mutations
- audit log sur chaque mutation
- soft delete (active=false) plutôt que DELETE réel
"""

from __future__ import annotations

import json
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc
from sqlalchemy.orm import Session as DBSession

from ..admin_auth import (
    CONTENT_ROLES,
    AdminIdentity,
    get_admin,
    require_role,
)
from ..database import get_db
from ..models import AuditLog, CTABlock

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/admin/cta",
    tags=["admin-cta"],
    dependencies=[Depends(get_admin)],
)


# --- Schemas ------------------------------------------------------------------


class CTARow(BaseModel):
    id: str
    key: str
    label: str
    variant: str
    component: str
    audience: str
    weight: int
    active: bool
    props: dict
    created_at: datetime
    updated_at: datetime


class CTACreate(BaseModel):
    key: str = Field(..., max_length=64)
    label: str = Field(..., max_length=200)
    variant: str = Field(default="control", max_length=64)
    component: str = Field(..., max_length=64)
    audience: str = Field(default="all", max_length=8)
    weight: int = Field(default=100, ge=0, le=1000)
    props: dict = Field(default_factory=dict)


class CTAUpdate(BaseModel):
    label: str | None = None
    weight: int | None = Field(default=None, ge=0, le=1000)
    props: dict | None = None
    active: bool | None = None
    audience: str | None = None
    variant: str | None = None
    component: str | None = None


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
            target_type="cta_block",
            target_id=target_id,
            details=json.dumps(
                {**(details or {}), "admin_email": (admin.email or admin.user_id)}
            ),
        )
    )


def _parse_props(raw: str) -> dict:
    try:
        parsed = json.loads(raw or "{}")
        return parsed if isinstance(parsed, dict) else {}
    except (ValueError, TypeError):
        return {}


def _to_row(block: CTABlock) -> CTARow:
    return CTARow(
        id=block.id,
        key=block.key,
        label=block.label,
        variant=block.variant,
        component=block.component,
        audience=block.audience,
        weight=block.weight,
        active=block.active,
        props=_parse_props(block.props_json),
        created_at=block.created_at,
        updated_at=block.updated_at,
    )


# --- Endpoints ----------------------------------------------------------------


@router.get("", response_model=list[CTARow])
def list_ctas(
    key: str | None = None,
    audience: str | None = None,
    active: bool | None = Query(default=None),
    db: DBSession = Depends(get_db),
) -> list[CTARow]:
    q = db.query(CTABlock)
    if key:
        q = q.filter(CTABlock.key == key)
    if audience:
        q = q.filter(CTABlock.audience == audience)
    if active is not None:
        q = q.filter(CTABlock.active.is_(active))
    rows = q.order_by(CTABlock.key, desc(CTABlock.weight), CTABlock.variant).all()
    return [_to_row(r) for r in rows]


@router.get("/{cta_id}", response_model=CTARow)
def get_cta(cta_id: str, db: DBSession = Depends(get_db)) -> CTARow:
    block = db.get(CTABlock, cta_id)
    if not block:
        raise HTTPException(404, "CTA inconnu")
    return _to_row(block)


@router.post(
    "",
    response_model=CTARow,
    dependencies=[Depends(require_role(*CONTENT_ROLES))],
)
def create_cta(
    payload: CTACreate,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> CTARow:
    block = CTABlock(
        key=payload.key,
        label=payload.label,
        variant=payload.variant,
        component=payload.component,
        audience=payload.audience,
        weight=payload.weight,
        props_json=json.dumps(payload.props, ensure_ascii=False),
        active=True,
    )
    db.add(block)
    db.flush()
    _audit(
        db, admin, "cta.create", block.id,
        {"key": block.key, "variant": block.variant, "component": block.component},
    )
    db.commit()
    db.refresh(block)
    return _to_row(block)


@router.put(
    "/{cta_id}",
    response_model=CTARow,
    dependencies=[Depends(require_role(*CONTENT_ROLES))],
)
def update_cta(
    cta_id: str,
    payload: CTAUpdate,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> CTARow:
    block = db.get(CTABlock, cta_id)
    if not block:
        raise HTTPException(404, "CTA inconnu")

    changes: dict[str, object] = {}
    data = payload.model_dump(exclude_unset=True)
    if "props" in data and data["props"] is not None:
        block.props_json = json.dumps(data.pop("props"), ensure_ascii=False)
        changes["props"] = True
    for field, value in data.items():
        if value is None:
            continue
        if hasattr(block, field) and getattr(block, field) != value:
            setattr(block, field, value)
            changes[field] = True

    _audit(db, admin, "cta.update", block.id, {"changes": list(changes.keys())})
    db.commit()
    db.refresh(block)
    return _to_row(block)


@router.delete(
    "/{cta_id}",
    dependencies=[Depends(require_role(*CONTENT_ROLES))],
)
def delete_cta(
    cta_id: str,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> dict:
    """Soft delete : désactive la variante (active=false). Pas de hard delete."""
    block = db.get(CTABlock, cta_id)
    if not block:
        raise HTTPException(404, "CTA inconnu")
    block.active = False
    _audit(db, admin, "cta.disable", block.id, {"key": block.key, "variant": block.variant})
    db.commit()
    return {"ok": True, "active": block.active}
