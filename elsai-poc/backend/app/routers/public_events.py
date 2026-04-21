"""API publique de collecte d'événements anonymes (view, cta_click, scroll…)."""

from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session as DBSession

from ..database import get_db
from ..models import ContentEvent

router = APIRouter(prefix="/api/public/events", tags=["public-events"])


# --- Schemas ------------------------------------------------------------------


class ContentEventCreate(BaseModel):
    post_slug: str = Field(..., max_length=200)
    event_type: Literal["view", "cta_click", "scroll_75", "newsletter_subscribe"]
    variant: str | None = Field(default=None, max_length=64)
    session_hash: str | None = Field(default=None, max_length=128)


class EventAck(BaseModel):
    ok: bool


# --- Anti-abuse minimaliste (compteur mémoire par IP, fenêtre 60 s) -----------

_RATE_LIMIT = 1000
_WINDOW_SEC = 60
_lock = Lock()
_buckets: dict[str, tuple[float, int]] = defaultdict(lambda: (0.0, 0))


def _rate_limit(ip: str) -> bool:
    now = time.time()
    with _lock:
        start, count = _buckets.get(ip, (now, 0))
        if now - start >= _WINDOW_SEC:
            _buckets[ip] = (now, 1)
            return True
        if count >= _RATE_LIMIT:
            return False
        _buckets[ip] = (start, count + 1)
        return True


# --- Endpoint -----------------------------------------------------------------


@router.post("", response_model=EventAck)
def track_event(
    payload: ContentEventCreate,
    request: Request,
    db: DBSession = Depends(get_db),
) -> EventAck:
    ip = request.client.host if request.client else "unknown"
    if not _rate_limit(ip):
        raise HTTPException(429, "Trop de requêtes")

    db.add(
        ContentEvent(
            post_slug=payload.post_slug,
            event_type=payload.event_type,
            variant=payload.variant,
            session_hash=payload.session_hash,
        )
    )
    db.commit()
    return EventAck(ok=True)
