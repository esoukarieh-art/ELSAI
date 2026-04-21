"""API publique newsletter + lead magnets (P0.7).

Flow subscribe :
  1. Hash email (SHA-256 + jwt_secret comme salt) — RGPD : pas de PII en clair
     côté ELSAI, la source de vérité email reste Brevo.
  2. Idempotence via email_hash unique.
  3. Sync contact Brevo (best effort : si Brevo indispo, subscriber créé quand
     même côté DB pour reconciliation manuelle).
  4. Lead magnet : planifie la séquence Brevo associée + renvoie file_url pour
     téléchargement immédiat.

Unsubscribe : token HMAC signé depuis l'email clair (lien 1-click dans email).
"""

from __future__ import annotations

import hashlib
import hmac
import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session as DBSession

from ..config import settings
from ..database import get_db
from ..models import LeadMagnet, NewsletterSubscriber
from ..services import email as email_service
from ..services.email_scheduler import schedule_sequence

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/public/newsletter", tags=["public-newsletter"])

_ALLOWED_AUDIENCES = {"adult", "minor", "b2b", "all"}


def _hash_email(email: str) -> str:
    """SHA-256(email_normalisé + jwt_secret). Déterministe pour idempotence."""
    normalized = email.strip().lower().encode("utf-8")
    salt = settings.jwt_secret.encode("utf-8")
    return hashlib.sha256(salt + b"|newsletter|" + normalized).hexdigest()


def _unsubscribe_token(email: str) -> str:
    normalized = email.strip().lower().encode("utf-8")
    return hmac.new(
        settings.jwt_secret.encode("utf-8"),
        b"unsub|" + normalized,
        hashlib.sha256,
    ).hexdigest()


def _verify_unsubscribe_token(email: str, token: str) -> bool:
    expected = _unsubscribe_token(email)
    return hmac.compare_digest(expected, token)


# --- Schemas ------------------------------------------------------------------


class SubscribeRequest(BaseModel):
    email: EmailStr
    audience: str = Field(default="adult", max_length=8)
    lead_magnet_key: str | None = Field(default=None, max_length=64)
    consent: bool
    source: str | None = Field(default=None, max_length=64)


class SubscribeResponse(BaseModel):
    ok: bool
    lead_magnet_url: str | None = None


class UnsubscribeRequest(BaseModel):
    email: EmailStr
    token: str | None = None


# --- Endpoints ----------------------------------------------------------------


@router.post("/subscribe", response_model=SubscribeResponse)
def subscribe(
    payload: SubscribeRequest, db: DBSession = Depends(get_db)
) -> SubscribeResponse:
    if not payload.consent:
        raise HTTPException(400, "Consentement RGPD requis.")
    if payload.audience not in _ALLOWED_AUDIENCES:
        raise HTTPException(400, "Audience invalide.")

    email_clear = str(payload.email).strip().lower()
    email_hash = _hash_email(email_clear)

    # Lead magnet (optionnel) : doit exister et être actif
    magnet: LeadMagnet | None = None
    if payload.lead_magnet_key:
        magnet = (
            db.query(LeadMagnet)
            .filter(LeadMagnet.key == payload.lead_magnet_key)
            .first()
        )
        if magnet is None or not magnet.active:
            # On n'échoue pas : on log et on ignore le magnet
            logger.info(
                "subscribe: lead_magnet %s indisponible, fallback newsletter seule",
                payload.lead_magnet_key,
            )
            magnet = None

    # Idempotence : subscriber actif déjà présent → 200 silent
    existing = (
        db.query(NewsletterSubscriber)
        .filter(NewsletterSubscriber.email_hash == email_hash)
        .first()
    )
    if existing is not None and existing.unsubscribed_at is None:
        return SubscribeResponse(
            ok=True,
            lead_magnet_url=(magnet.file_url if magnet else None),
        )

    # Sync Brevo (best effort)
    brevo_contact_id = email_service.create_or_update_contact(
        email=email_clear,
        attributes={
            "AUDIENCE": payload.audience,
            "SOURCE": payload.source or "newsletter",
            "LEAD_MAGNET": payload.lead_magnet_key or "",
        },
        list_ids=None,
    )

    if existing is None:
        sub = NewsletterSubscriber(
            email_hash=email_hash,
            audience=payload.audience,
            lead_magnet_key=payload.lead_magnet_key,
            consent_at=datetime.now(UTC),
            brevo_contact_id=brevo_contact_id,
        )
        db.add(sub)
    else:
        # Ré-abonnement : on efface unsubscribed_at
        existing.audience = payload.audience
        existing.lead_magnet_key = payload.lead_magnet_key
        existing.consent_at = datetime.now(UTC)
        existing.unsubscribed_at = None
        if brevo_contact_id:
            existing.brevo_contact_id = brevo_contact_id

    db.commit()

    # Séquence email liée au lead magnet
    if magnet and magnet.trigger_sequence_key:
        try:
            schedule_sequence(
                db,
                sequence_key=magnet.trigger_sequence_key,
                recipient_email=email_clear,
                recipient_name=None,
                context={
                    "audience": payload.audience,
                    "lead_magnet_title": magnet.title,
                    "lead_magnet_url": magnet.file_url or "",
                },
                subject_id=email_hash,
                subject_type="b2c_user",
            )
        except Exception as exc:  # pragma: no cover - best effort
            logger.error("schedule_sequence failed for %s: %s", magnet.key, exc)

    return SubscribeResponse(
        ok=True,
        lead_magnet_url=(magnet.file_url if magnet else None),
    )


@router.post("/unsubscribe")
def unsubscribe(
    payload: UnsubscribeRequest, db: DBSession = Depends(get_db)
) -> dict:
    email_clear = str(payload.email).strip().lower()
    if payload.token and not _verify_unsubscribe_token(email_clear, payload.token):
        raise HTTPException(400, "Token invalide.")

    email_hash = _hash_email(email_clear)
    sub = (
        db.query(NewsletterSubscriber)
        .filter(NewsletterSubscriber.email_hash == email_hash)
        .first()
    )
    if sub is None:
        return {"ok": True}  # silent : pas de fuite d'info

    if sub.unsubscribed_at is None:
        sub.unsubscribed_at = datetime.now(UTC)
        db.commit()

    # Brevo : retire de la liste principale si configurée (list id paramétrable plus tard)
    # Pour l'instant no-op côté listes (le contact Brevo reste mais peut être blacklisté
    # via l'UI Brevo). Une évolution future ajoutera une settings.brevo_newsletter_list_id.
    return {"ok": True}
