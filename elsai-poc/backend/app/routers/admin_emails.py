"""Admin API pour les séquences email (phase 3 — édition depuis le backoffice).

Endpoints :
- GET    /api/admin/email-sequences                  → liste des séquences (agrégé)
- GET    /api/admin/email-sequences/{sequence_key}   → détail d'une séquence (steps)
- GET    /api/admin/email-sequences/templates/{key}  → détail d'un template
- PUT    /api/admin/email-sequences/templates/{key}  → édition (sujet/html/texte/delay/active)
- POST   /api/admin/email-sequences/templates/{key}/test-send?to=... → envoi test
- GET    /api/admin/email-sequences/history          → derniers envois (tous)
- POST   /api/admin/email-sequences/{sequence_key}/pause|resume → kill-switch
"""

from __future__ import annotations

import json
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, func
from sqlalchemy.orm import Session as DBSession

from ..admin_auth import AdminIdentity, get_admin, require_role
from ..database import get_db
from ..models import AuditLog, EmailTemplate, ScheduledEmail
from ..services import email as email_service
from ..services import email_scheduler

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/admin/email-sequences",
    tags=["admin-emails"],
    dependencies=[Depends(get_admin)],
)


# --- Schemas -----------------------------------------------------------------


class SequenceSummary(BaseModel):
    sequence_key: str
    sequence_label: str
    audience: str
    steps_total: int
    steps_active: int
    last_sent_at: datetime | None = None
    pending_count: int = 0


class TemplateSummary(BaseModel):
    key: str
    sequence_key: str
    sequence_label: str
    audience: str
    step_order: int
    step_label: str
    delay_hours: int
    subject: str
    preview: str | None
    active: bool
    notes: str | None
    updated_at: datetime
    updated_by: str | None


class TemplateDetail(TemplateSummary):
    html_content: str
    text_content: str | None


class TemplateUpdate(BaseModel):
    subject: str | None = Field(default=None, max_length=200)
    preview: str | None = Field(default=None, max_length=240)
    html_content: str | None = None
    text_content: str | None = None
    delay_hours: int | None = None
    step_label: str | None = Field(default=None, max_length=120)
    active: bool | None = None
    notes: str | None = None


class HistoryRow(BaseModel):
    id: str
    template_key: str | None
    sequence_key: str
    step_order: int
    recipient_email: str
    subject_id: str
    send_at: datetime
    sent_at: datetime | None
    status: str
    error: str | None
    brevo_message_id: str | None


class TestSendResponse(BaseModel):
    sent: bool
    message_id: str | None = None
    rendered_subject: str
    rendered_html_preview: str  # 500 premiers caractères


# --- Helpers -----------------------------------------------------------------


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
            target_type="email_template",
            target_id=target_id,
            details=json.dumps({**(details or {}), "admin_email": (admin.email or admin.user_id)}),
        )
    )


def _sample_context() -> dict:
    """Contexte synthétique pour les previews et test-send."""
    return {
        "company_name": "Démo SA",
        "plan_label": "Essentiel",
        "seats": 10,
        "admin_url": "https://www.elsai.fr/offre/admin?token=SAMPLE",
        "portal_url": "https://billing.stripe.com/p/sample",
        "portal_block_html": "",
        "portal_block_text": "",
        "codes_html": '<tr><td style="font-family:monospace;">SAMPLE-CODE-01</td></tr>',
        "codes_text": "  - SAMPLE-CODE-01",
        "active_codes": 8,
        "codes_used": 6,
        "total_sessions": 42,
        "sessions_count": 42,
        "avg_duration": "7",
        "new_codes_activated": 3,
        "top_themes_or_dash": "logement, emploi, CAF",
        "top_themes_bulleted": "• logement<br>• emploi<br>• CAF",
        "letters_generated": 5,
        "forms_completed": 2,
        "referrals_count": 1,
        "booking_url": "https://www.elsai.fr/offre/rdv",
        "renewal_date": "15/05/2026",
        "amount": "29.00",
        "decline_reason_or_generic": "carte expirée",
        "suspension_date": "25/04/2026",
        "month_label": "mars 2026",
        # B2C sample
        "recipient_org": "CAF 33",
        "subject_line": "Demande d'APL",
        "letter_url": "https://www.elsai.fr/account/letter/SAMPLE",
        "account_url": "https://www.elsai.fr/account",
        "letter_id": "SAMPLE-LETTER",
        "legal_delay_days": 60,
        "sent_date": "10/03/2026",
        "form_type": "RSA",
        "target_organism": "CAF",
        "doc_page": "3",
        "avg_instruction_days": 30,
        "followup_days": 45,
        "appeal_type": "gracieux",
        "appeal_id": "SAMPLE-APPEAL",
        "applicable_deadline_days": 60,
        "days_remaining": 30,
        "deadline_date": "15/06/2026",
        "event_type": "audience tribunal",
        "event_date": "20/05/2026",
        "event_time": "14:00",
        "event_location": "TA Bordeaux",
        "event_location_details": "Salle 3, 1er étage",
        "required_docs_or_dash": "convocation, pièce d'identité, dossier complet",
        "reminder_id": "SAMPLE-REMINDER",
    }


# --- Endpoints ---------------------------------------------------------------


@router.get("", response_model=list[SequenceSummary])
def list_sequences(db: DBSession = Depends(get_db)) -> list[SequenceSummary]:
    templates = (
        db.query(EmailTemplate)
        .order_by(EmailTemplate.audience, EmailTemplate.sequence_label, EmailTemplate.step_order)
        .all()
    )
    by_seq: dict[str, list[EmailTemplate]] = {}
    for t in templates:
        by_seq.setdefault(t.sequence_key, []).append(t)

    sent_stats = dict(
        db.query(ScheduledEmail.sequence_key, func.max(ScheduledEmail.sent_at))
        .filter(ScheduledEmail.status == "sent")
        .group_by(ScheduledEmail.sequence_key)
        .all()
    )
    pending_stats = dict(
        db.query(ScheduledEmail.sequence_key, func.count(ScheduledEmail.id))
        .filter(ScheduledEmail.status == "pending")
        .group_by(ScheduledEmail.sequence_key)
        .all()
    )

    out: list[SequenceSummary] = []
    for seq_key, items in by_seq.items():
        out.append(
            SequenceSummary(
                sequence_key=seq_key,
                sequence_label=items[0].sequence_label,
                audience=items[0].audience,
                steps_total=len(items),
                steps_active=sum(1 for t in items if t.active),
                last_sent_at=sent_stats.get(seq_key),
                pending_count=pending_stats.get(seq_key, 0),
            )
        )
    out.sort(key=lambda s: (s.audience, s.sequence_label))
    return out


@router.get("/history", response_model=list[HistoryRow])
def list_history(
    sequence_key: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=500),
    db: DBSession = Depends(get_db),
) -> list[HistoryRow]:
    q = db.query(ScheduledEmail)
    if sequence_key:
        q = q.filter(ScheduledEmail.sequence_key == sequence_key)
    if status_filter:
        q = q.filter(ScheduledEmail.status == status_filter)
    rows = q.order_by(desc(ScheduledEmail.send_at)).limit(limit).all()
    return [
        HistoryRow(
            id=r.id,
            template_key=r.template_key,
            sequence_key=r.sequence_key,
            step_order=r.step_order,
            recipient_email=r.recipient_email,
            subject_id=r.subject_id,
            send_at=r.send_at,
            sent_at=r.sent_at,
            status=r.status,
            error=r.error,
            brevo_message_id=r.brevo_message_id,
        )
        for r in rows
    ]


@router.get("/{sequence_key}", response_model=list[TemplateSummary])
def list_templates_in_sequence(
    sequence_key: str, db: DBSession = Depends(get_db)
) -> list[TemplateSummary]:
    items = (
        db.query(EmailTemplate)
        .filter(EmailTemplate.sequence_key == sequence_key)
        .order_by(EmailTemplate.step_order)
        .all()
    )
    if not items:
        raise HTTPException(404, "Séquence inconnue")
    return [_to_summary(t) for t in items]


@router.get("/templates/{key}", response_model=TemplateDetail)
def get_template(key: str, db: DBSession = Depends(get_db)) -> TemplateDetail:
    t = db.get(EmailTemplate, key)
    if not t:
        raise HTTPException(404, "Template inconnu")
    return TemplateDetail(
        **_to_summary(t).model_dump(),
        html_content=t.html_content,
        text_content=t.text_content,
    )


@router.put(
    "/templates/{key}",
    response_model=TemplateDetail,
    dependencies=[Depends(require_role("content_editor"))],
)
def update_template(
    key: str,
    payload: TemplateUpdate,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> TemplateDetail:
    t = db.get(EmailTemplate, key)
    if not t:
        raise HTTPException(404, "Template inconnu")

    changes: dict[str, object] = {}
    for field in ("subject", "preview", "html_content", "text_content", "delay_hours",
                  "step_label", "active", "notes"):
        value = getattr(payload, field)
        if value is not None and getattr(t, field) != value:
            setattr(t, field, value)
            changes[field] = value

    if changes:
        t.updated_by = (admin.email or admin.user_id)
        _audit(db, admin, "email_template.update", key, {"changes": list(changes.keys())})
        db.commit()
        db.refresh(t)

    return TemplateDetail(
        **_to_summary(t).model_dump(),
        html_content=t.html_content,
        text_content=t.text_content,
    )


@router.post(
    "/templates/{key}/test-send",
    response_model=TestSendResponse,
    dependencies=[Depends(require_role("content_editor"))],
)
def test_send(
    key: str,
    to: str = Query(..., description="Adresse email du destinataire de test",
                     pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$"),
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> TestSendResponse:
    t = db.get(EmailTemplate, key)
    if not t:
        raise HTTPException(404, "Template inconnu")

    ctx = _sample_context()
    subject = email_scheduler.render_template_string(t.subject, ctx)
    html = email_scheduler.render_template_string(t.html_content, ctx)
    text = email_scheduler.render_template_string(t.text_content, ctx) if t.text_content else None

    sent = False
    message_id: str | None = None
    try:
        message_id = email_service.send_email(
            to_email=str(to),
            to_name="Test admin",
            subject=f"[TEST] {subject}",
            html_content=html,
            text_content=text,
            tags=[t.sequence_key, "test", f"admin:{(admin.email or admin.user_id)}"],
        )
        sent = True
        _audit(db, admin, "email_template.test_send", key, {"to": str(to)})
        db.commit()
    except email_service.EmailNotConfiguredError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Brevo non configuré : BREVO_API_KEY manquant.",
        )
    except Exception as e:  # noqa: BLE001
        logger.exception("test_send erreur pour %s", key)
        raise HTTPException(502, f"Erreur d'envoi Brevo : {e}") from e

    return TestSendResponse(
        sent=sent,
        message_id=message_id,
        rendered_subject=subject,
        rendered_html_preview=html[:500],
    )


@router.post(
    "/{sequence_key}/pause",
    response_model=SequenceSummary,
    dependencies=[Depends(require_role("content_editor"))],
)
def pause_sequence(
    sequence_key: str,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> SequenceSummary:
    return _set_sequence_active(db, admin, sequence_key, active=False)


@router.post(
    "/{sequence_key}/resume",
    response_model=SequenceSummary,
    dependencies=[Depends(require_role("content_editor"))],
)
def resume_sequence(
    sequence_key: str,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> SequenceSummary:
    return _set_sequence_active(db, admin, sequence_key, active=True)


# --- Internals ---------------------------------------------------------------


def _to_summary(t: EmailTemplate) -> TemplateSummary:
    return TemplateSummary(
        key=t.key,
        sequence_key=t.sequence_key,
        sequence_label=t.sequence_label,
        audience=t.audience,
        step_order=t.step_order,
        step_label=t.step_label,
        delay_hours=t.delay_hours,
        subject=t.subject,
        preview=t.preview,
        active=t.active,
        notes=t.notes,
        updated_at=t.updated_at,
        updated_by=t.updated_by,
    )


def _set_sequence_active(
    db: DBSession, admin: AdminIdentity, sequence_key: str, *, active: bool
) -> SequenceSummary:
    items = (
        db.query(EmailTemplate).filter(EmailTemplate.sequence_key == sequence_key).all()
    )
    if not items:
        raise HTTPException(404, "Séquence inconnue")
    for t in items:
        if t.active != active:
            t.active = active
            t.updated_by = (admin.email or admin.user_id)
    _audit(
        db,
        admin,
        "email_template.pause" if not active else "email_template.resume",
        sequence_key,
        {"steps": len(items)},
    )
    db.commit()
    return SequenceSummary(
        sequence_key=sequence_key,
        sequence_label=items[0].sequence_label,
        audience=items[0].audience,
        steps_total=len(items),
        steps_active=sum(1 for t in items if t.active),
        last_sent_at=None,
        pending_count=0,
    )
