"""Scheduler des emails planifiés (séquences).

Architecture simple :
- `schedule_email()` insère une ligne ScheduledEmail(status=pending, send_at=...).
- `process_pending_emails()` est appelé par APScheduler toutes les N minutes :
  pour chaque ScheduledEmail dont send_at <= now et status=pending, rend le
  template (substitution {{var}}), envoie via email_service.send_email(),
  passe status à "sent" ou "failed".
- `cancel_pending_emails_for_subject()` annule les envois en attente d'une org/user
  (utile si résiliation / suppression de compte).

Rendu : substitution simple `{{variable}}` → `str(context.get("variable", ""))`.
Pas de Jinja pour limiter les dépendances et éviter l'exécution de code dans
un template éditable par un admin.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import UTC, datetime, timedelta
from typing import Any

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from .. import database
from ..models import EmailTemplate, ScheduledEmail
from . import email as email_service

logger = logging.getLogger(__name__)

_VAR_RE = re.compile(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}")

# Tick du scheduler : toutes les 5 minutes en prod, paramétrable pour les tests.
_DEFAULT_TICK_MINUTES = 5

_scheduler: BackgroundScheduler | None = None


# --- Planification ----------------------------------------------------------


def schedule_email(
    db: Session,
    *,
    template_key: str,
    recipient_email: str,
    recipient_name: str | None,
    context: dict[str, Any],
    subject_id: str,
    subject_type: str = "organization",
    send_at: datetime | None = None,
) -> ScheduledEmail | None:
    """Planifie un email. Retourne None si le template est inactif ou manquant.

    `send_at` par défaut = now + delay_hours du template.
    Idempotence : si une ligne pending existe déjà pour (template_key, subject_id),
    on ne la duplique pas.
    """
    template = db.get(EmailTemplate, template_key)
    if template is None:
        logger.warning("schedule_email: template %s introuvable", template_key)
        return None
    if not template.active:
        logger.info("schedule_email: template %s inactif, skip", template_key)
        return None

    existing = (
        db.query(ScheduledEmail)
        .filter(
            ScheduledEmail.template_key == template_key,
            ScheduledEmail.subject_id == subject_id,
            ScheduledEmail.status == "pending",
        )
        .first()
    )
    if existing is not None:
        return existing

    if send_at is None:
        send_at = datetime.now(UTC) + timedelta(hours=template.delay_hours)

    row = ScheduledEmail(
        template_key=template_key,
        sequence_key=template.sequence_key,
        step_order=template.step_order,
        recipient_email=recipient_email,
        recipient_name=recipient_name,
        context_json=json.dumps(context, default=str, ensure_ascii=False),
        subject_type=subject_type,
        subject_id=subject_id,
        send_at=send_at,
        status="pending",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def schedule_sequence(
    db: Session,
    *,
    sequence_key: str,
    recipient_email: str,
    recipient_name: str | None,
    context: dict[str, Any],
    subject_id: str,
    subject_type: str = "organization",
    anchor: datetime | None = None,
) -> list[ScheduledEmail]:
    """Planifie tous les emails actifs d'une séquence.

    `anchor` = datetime de référence (trigger). Chaque email sera envoyé à
    anchor + template.delay_hours. Par défaut : now().
    """
    if anchor is None:
        anchor = datetime.now(UTC)

    templates = (
        db.query(EmailTemplate)
        .filter(
            EmailTemplate.sequence_key == sequence_key,
            EmailTemplate.active.is_(True),
        )
        .order_by(EmailTemplate.step_order)
        .all()
    )

    scheduled: list[ScheduledEmail] = []
    for t in templates:
        send_at = anchor + timedelta(hours=t.delay_hours)
        row = schedule_email(
            db,
            template_key=t.key,
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            context=context,
            subject_id=subject_id,
            subject_type=subject_type,
            send_at=send_at,
        )
        if row is not None:
            scheduled.append(row)
    return scheduled


def cancel_pending_emails_for_subject(
    db: Session,
    *,
    subject_id: str,
    sequence_key: str | None = None,
    reason: str = "cancelled",
) -> int:
    """Annule les envois pending pour un subject donné (org, user). Retourne le nb annulés."""
    q = db.query(ScheduledEmail).filter(
        ScheduledEmail.subject_id == subject_id,
        ScheduledEmail.status == "pending",
    )
    if sequence_key is not None:
        q = q.filter(ScheduledEmail.sequence_key == sequence_key)
    rows = q.all()
    for r in rows:
        r.status = "cancelled"
        r.cancel_reason = reason
    if rows:
        db.commit()
    return len(rows)


# --- Rendu ------------------------------------------------------------------


def render_template_string(template: str, context: dict[str, Any]) -> str:
    """Substitue {{var}} par context[var] (valeur vide si absent)."""

    def repl(match: re.Match[str]) -> str:
        key = match.group(1)
        value = context.get(key, "")
        return str(value) if value is not None else ""

    return _VAR_RE.sub(repl, template)


def render_scheduled(email: ScheduledEmail, template: EmailTemplate) -> tuple[str, str, str | None]:
    """Rend (subject, html, text) à partir du template + contexte sérialisé."""
    ctx: dict[str, Any] = json.loads(email.context_json or "{}")
    subject = render_template_string(template.subject, ctx)
    html = render_template_string(template.html_content, ctx)
    text = render_template_string(template.text_content, ctx) if template.text_content else None
    return subject, html, text


# --- Traitement de la queue -------------------------------------------------


def process_pending_emails(batch_limit: int = 50) -> dict[str, int]:
    """Tick du scheduler : dépile les emails prêts à partir.

    Retourne {"sent": n, "failed": n, "skipped": n}.
    """
    stats = {"sent": 0, "failed": 0, "skipped": 0}
    now = datetime.now(UTC)

    with database.SessionLocal() as db:
        due = (
            db.query(ScheduledEmail)
            .filter(
                ScheduledEmail.status == "pending",
                ScheduledEmail.send_at <= now,
            )
            .order_by(ScheduledEmail.send_at)
            .limit(batch_limit)
            .all()
        )

        for row in due:
            template = db.get(EmailTemplate, row.template_key) if row.template_key else None
            if template is None or not template.active:
                row.status = "cancelled"
                row.cancel_reason = "template_missing_or_inactive"
                stats["skipped"] += 1
                continue

            try:
                subject, html, text = render_scheduled(row, template)
                message_id = email_service.send_email(
                    to_email=row.recipient_email,
                    to_name=row.recipient_name,
                    subject=subject,
                    html_content=html,
                    text_content=text,
                    tags=[row.sequence_key, f"step:{row.step_order}"],
                )
                row.status = "sent"
                row.sent_at = now
                row.brevo_message_id = message_id
                stats["sent"] += 1
            except email_service.EmailNotConfiguredError as e:
                logger.warning("Brevo non configuré, email %s reporté : %s", row.id, e)
                # On laisse pending pour retry ultérieur (configuration fixe).
                stats["skipped"] += 1
            except Exception as e:  # noqa: BLE001
                logger.exception("Echec envoi email planifié %s", row.id)
                row.status = "failed"
                row.error = str(e)[:2000]
                stats["failed"] += 1

        db.commit()

    if any(stats.values()):
        logger.info("email_scheduler tick: %s", stats)
    return stats


# --- Démarrage / arrêt du scheduler APScheduler ------------------------------


def start_scheduler(tick_minutes: int = _DEFAULT_TICK_MINUTES) -> BackgroundScheduler:
    """Démarre le scheduler en background thread. Idempotent.

    Trois jobs :
    - email_scheduler_tick : dépile la queue des ScheduledEmail (intervalle)
    - pre_expiry_daily_scan : 08:00 UTC chaque jour
    - monthly_reports_scan : 09:00 UTC le 1er du mois
    """
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        return _scheduler

    # Import tardif pour éviter les cycles (email_triggers importe email_scheduler)
    from . import email_triggers

    sched = BackgroundScheduler(timezone="UTC")
    sched.add_job(
        process_pending_emails,
        trigger="interval",
        minutes=tick_minutes,
        id="email_scheduler_tick",
        max_instances=1,
        coalesce=True,
        next_run_time=datetime.now(UTC) + timedelta(seconds=30),
    )
    sched.add_job(
        email_triggers.trigger_pre_expiry_scan,
        trigger="cron",
        hour=8,
        minute=0,
        id="pre_expiry_daily_scan",
        max_instances=1,
        coalesce=True,
    )
    sched.add_job(
        email_triggers.trigger_monthly_reports,
        trigger="cron",
        day=1,
        hour=9,
        minute=0,
        id="monthly_reports_scan",
        max_instances=1,
        coalesce=True,
    )
    sched.start()
    _scheduler = sched
    logger.info("email_scheduler démarré, tick toutes les %s minutes", tick_minutes)
    return sched


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=False)
        _scheduler = None
