"""Admin API pour les LeadMagnets ELSAI (P0.7).

CRUD simple : liste, créer, modifier, supprimer (hard delete — peu de données),
activer. MVP : pas d'upload fichier, seulement URL externe (ou path static
servi par le frontend).
"""

from __future__ import annotations

import json
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session as DBSession

from ..admin_auth import (
    PUBLISH_ROLES,
    AdminIdentity,
    get_admin,
    require_role,
)
from ..database import get_db
from ..models import AuditLog, LeadMagnet

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/admin/leadmagnets",
    tags=["admin-leadmagnets"],
    dependencies=[Depends(get_admin)],
)


class LeadMagnetRow(BaseModel):
    id: str
    key: str
    title: str
    description: str | None = None
    audience: str
    file_url: str | None = None
    trigger_sequence_key: str | None = None
    active: bool


class LeadMagnetCreate(BaseModel):
    key: str = Field(..., max_length=64)
    title: str = Field(..., max_length=200)
    description: str | None = None
    audience: str = Field(default="adult", max_length=8)
    file_url: str | None = Field(default=None, max_length=500)
    trigger_sequence_key: str | None = Field(default=None, max_length=32)
    active: bool = False


class LeadMagnetUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    audience: str | None = None
    file_url: str | None = None
    trigger_sequence_key: str | None = None
    active: bool | None = None


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
            target_type="lead_magnet",
            target_id=target_id,
            details=json.dumps(
                {**(details or {}), "admin_email": (admin.email or admin.user_id)}
            ),
        )
    )


def _to_row(m: LeadMagnet) -> LeadMagnetRow:
    return LeadMagnetRow(
        id=m.id,
        key=m.key,
        title=m.title,
        description=m.description,
        audience=m.audience,
        file_url=m.file_url,
        trigger_sequence_key=m.trigger_sequence_key,
        active=m.active,
    )


@router.get("", response_model=list[LeadMagnetRow])
def list_magnets(db: DBSession = Depends(get_db)) -> list[LeadMagnetRow]:
    rows = db.query(LeadMagnet).order_by(LeadMagnet.audience, LeadMagnet.key).all()
    return [_to_row(r) for r in rows]


@router.get("/{magnet_id}", response_model=LeadMagnetRow)
def get_magnet(magnet_id: str, db: DBSession = Depends(get_db)) -> LeadMagnetRow:
    m = db.get(LeadMagnet, magnet_id)
    if not m:
        raise HTTPException(404, "Lead magnet inconnu")
    return _to_row(m)


@router.post(
    "",
    response_model=LeadMagnetRow,
    dependencies=[Depends(require_role(*PUBLISH_ROLES))],
)
def create_magnet(
    payload: LeadMagnetCreate,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> LeadMagnetRow:
    if db.query(LeadMagnet).filter(LeadMagnet.key == payload.key).first():
        raise HTTPException(409, "Clé déjà utilisée")
    m = LeadMagnet(**payload.model_dump())
    db.add(m)
    db.flush()
    _audit(db, admin, "leadmagnet.create", m.id, {"key": m.key})
    db.commit()
    db.refresh(m)
    return _to_row(m)


@router.put(
    "/{magnet_id}",
    response_model=LeadMagnetRow,
    dependencies=[Depends(require_role(*PUBLISH_ROLES))],
)
def update_magnet(
    magnet_id: str,
    payload: LeadMagnetUpdate,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> LeadMagnetRow:
    m = db.get(LeadMagnet, magnet_id)
    if not m:
        raise HTTPException(404, "Lead magnet inconnu")
    changes: list[str] = []
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is None and field != "active":
            continue
        if getattr(m, field) != value:
            setattr(m, field, value)
            changes.append(field)
    _audit(db, admin, "leadmagnet.update", m.id, {"changes": changes})
    db.commit()
    db.refresh(m)
    return _to_row(m)


@router.delete(
    "/{magnet_id}",
    dependencies=[Depends(require_role(*PUBLISH_ROLES))],
)
def delete_magnet(
    magnet_id: str,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> dict:
    m = db.get(LeadMagnet, magnet_id)
    if not m:
        raise HTTPException(404, "Lead magnet inconnu")
    key = m.key
    db.delete(m)
    _audit(db, admin, "leadmagnet.delete", magnet_id, {"key": key})
    db.commit()
    return {"ok": True}


@router.post(
    "/{magnet_id}/activate",
    response_model=LeadMagnetRow,
    dependencies=[Depends(require_role(*PUBLISH_ROLES))],
)
def activate_magnet(
    magnet_id: str,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> LeadMagnetRow:
    m = db.get(LeadMagnet, magnet_id)
    if not m:
        raise HTTPException(404, "Lead magnet inconnu")
    if not m.file_url:
        raise HTTPException(400, "file_url requis pour activer")
    m.active = True
    _audit(db, admin, "leadmagnet.activate", m.id, {"key": m.key})
    db.commit()
    db.refresh(m)
    return _to_row(m)
