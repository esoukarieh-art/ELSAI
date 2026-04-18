"""Déclencheurs métier → planification des séquences email (B2B).

Appelé depuis :
- routers/billing.py (webhooks Stripe)
- email_scheduler.py (jobs cron quotidien / mensuel)

Les triggers B2C (LetterGenerated, FormDelegated, etc.) seront ajoutés ici
quand l'infra compte B2C sera implémentée.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

import stripe
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Organization
from . import email_scheduler

logger = logging.getLogger(__name__)

_PLAN_LABELS = {
    "essentiel": "Essentiel",
    "premium": "Premium",
    "sur_mesure": "Sur-mesure",
}

_MONTHS_FR = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]


def _admin_url(org: Organization) -> str:
    # Import local pour éviter le cycle routers.billing -> services.email_triggers
    from ..routers.billing import create_org_token

    token = create_org_token(org.id)
    return f"{settings.frontend_base_url}/offre/admin?token={token}"


def _portal_url(org: Organization) -> str | None:
    if not org.stripe_customer_id or not settings.stripe_secret_key:
        return None
    try:
        stripe.api_key = settings.stripe_secret_key
        s = stripe.billing_portal.Session.create(
            customer=org.stripe_customer_id,
            return_url=settings.billing_portal_return_url,
        )
        return s.url
    except Exception:  # noqa: BLE001
        logger.exception("Impossible de générer le portal URL pour org %s", org.id)
        return None


def _org_base_context(org: Organization) -> dict:
    """Contexte commun réutilisé par toutes les séquences B2B.

    Les valeurs « stats » (sessions, thèmes, durée…) sont des placeholders
    jusqu'à l'ajout d'un provider de métriques temps réel au send time.
    """
    active = [c for c in org.access_codes if c.revoked_at is None]
    codes_html = "".join(
        f'<tr><td style="font-family:monospace;padding:6px 0;'
        f'border-bottom:1px solid #eee;">{c.code}</td></tr>'
        for c in active
    )
    codes_text = "\n".join(f"  - {c.code}" for c in active)
    codes_used = sum(1 for c in active if c.assigned_at is not None)

    portal_url = _portal_url(org)
    portal_block_html = (
        f'<p>Gérez votre abonnement et vos factures via le '
        f'<a href="{portal_url}" style="color:#5A7E6B;">portail client Stripe</a>.</p>'
        if portal_url
        else ""
    )
    portal_block_text = f"Portail facturation : {portal_url}\n" if portal_url else ""

    return {
        "company_name": org.company_name,
        "plan_label": _PLAN_LABELS.get(org.plan, org.plan),
        "seats": org.seats,
        "admin_url": _admin_url(org),
        "portal_url": portal_url or "",
        "portal_block_html": portal_block_html,
        "portal_block_text": portal_block_text,
        "codes_html": codes_html,
        "codes_text": codes_text,
        "active_codes": len(active),
        "codes_used": codes_used,
        # Placeholders : remplacés quand les providers de stats seront branchés
        "total_sessions": 0,
        "sessions_count": 0,
        "avg_duration": "—",
        "new_codes_activated": len(active),
        "top_themes_or_dash": "—",
        "top_themes_bulleted": "—",
        "letters_generated": 0,
        "forms_completed": 0,
        "referrals_count": 0,
        "booking_url": f"{settings.frontend_base_url}/offre/rdv",
    }


# --- Webhooks Stripe → triggers -----------------------------------------------


def on_checkout_completed(db: Session, org: Organization) -> None:
    """Planifie la séquence onboarding (5 emails sur 30 jours).

    Flush immédiat pour que J+0 parte sans attendre le prochain tick.
    """
    ctx = _org_base_context(org)
    email_scheduler.schedule_sequence(
        db,
        sequence_key="b2b_onboarding",
        recipient_email=org.admin_email,
        recipient_name=org.company_name,
        context=ctx,
        subject_id=org.id,
        subject_type="organization",
    )
    email_scheduler.process_pending_emails()


def on_invoice_payment_failed(db: Session, org: Organization, invoice_obj: dict) -> None:
    """Planifie la séquence de dunning (3 emails sur 7 jours)."""
    amount_cents = invoice_obj.get("amount_due") or 0
    decline = (
        (invoice_obj.get("last_finalization_error") or {}).get("message")
        or "paiement refusé par la banque"
    )
    suspension_date = (datetime.now(UTC) + timedelta(days=7)).strftime("%d/%m/%Y")
    ctx = {
        **_org_base_context(org),
        "amount": f"{amount_cents / 100:.2f}",
        "decline_reason_or_generic": decline,
        "suspension_date": suspension_date,
    }
    email_scheduler.schedule_sequence(
        db,
        sequence_key="b2b_dunning",
        recipient_email=org.admin_email,
        recipient_name=org.company_name,
        context=ctx,
        subject_id=org.id,
        subject_type="organization",
    )


def on_invoice_paid(db: Session, org: Organization) -> None:
    """Annule les dunning en attente pour l'org (paiement régularisé)."""
    n = email_scheduler.cancel_pending_emails_for_subject(
        db, subject_id=org.id, sequence_key="b2b_dunning", reason="invoice_paid"
    )
    if n:
        logger.info("Dunning annulé pour org %s (%s emails)", org.id, n)


def on_subscription_canceled(db: Session, org: Organization) -> None:
    """Annule TOUTES les séquences pending pour cette org."""
    n = email_scheduler.cancel_pending_emails_for_subject(
        db, subject_id=org.id, reason="subscription_canceled"
    )
    if n:
        logger.info("Abonnement résilié, %s emails pending annulés pour org %s", n, org.id)


# --- Jobs cron ---------------------------------------------------------------


def trigger_pre_expiry_scan() -> dict:
    """Job quotidien : détecte les abonnements qui expirent dans 13-15 jours
    et planifie la séquence pré-expiration (J-14, J-3).
    """
    from .. import database

    stats = {"scanned": 0, "scheduled": 0, "errors": 0}
    if not settings.stripe_secret_key:
        logger.info("pre_expiry_scan: stripe_secret_key vide, skip")
        return stats

    stripe.api_key = settings.stripe_secret_key
    now = datetime.now(UTC)

    with database.SessionLocal() as db:
        orgs = (
            db.query(Organization)
            .filter(
                Organization.status == "active",
                Organization.stripe_subscription_id.is_not(None),
            )
            .all()
        )
        for org in orgs:
            stats["scanned"] += 1
            try:
                sub = stripe.Subscription.retrieve(org.stripe_subscription_id)
                period_end_ts = sub["current_period_end"]
                period_end = datetime.fromtimestamp(period_end_ts, tz=UTC)
                days = (period_end - now).days
                if not (13 <= days <= 15):
                    continue

                price_item = (sub["items"]["data"] or [{}])[0].get("price") or {}
                unit_amount = price_item.get("unit_amount") or 0
                amount_cents = unit_amount * (org.seats or 1)
                ctx = {
                    **_org_base_context(org),
                    "renewal_date": period_end.strftime("%d/%m/%Y"),
                    "amount": f"{amount_cents / 100:.2f}",
                }
                scheduled = email_scheduler.schedule_sequence(
                    db,
                    sequence_key="b2b_pre_expiry",
                    recipient_email=org.admin_email,
                    recipient_name=org.company_name,
                    context=ctx,
                    subject_id=org.id,
                    subject_type="organization",
                    anchor=period_end,
                )
                if scheduled:
                    stats["scheduled"] += 1
            except Exception:  # noqa: BLE001
                stats["errors"] += 1
                logger.exception("pre_expiry_scan: erreur org %s", org.id)

    logger.info("pre_expiry_scan: %s", stats)
    return stats


def trigger_monthly_reports() -> dict:
    """Job mensuel : planifie un rapport d'usage pour chaque org active.

    Prévu le 1er du mois à 09:00 UTC. Le mois de reporting est le mois écoulé.
    """
    from .. import database

    stats = {"scanned": 0, "scheduled": 0}
    now = datetime.now(UTC)
    prev_month = now.month - 1 or 12
    prev_year = now.year if now.month > 1 else now.year - 1
    month_label = f"{_MONTHS_FR[prev_month - 1]} {prev_year}"

    with database.SessionLocal() as db:
        orgs = db.query(Organization).filter(Organization.status == "active").all()
        for org in orgs:
            stats["scanned"] += 1
            ctx = {**_org_base_context(org), "month_label": month_label}
            scheduled = email_scheduler.schedule_email(
                db,
                template_key="b2b_monthly_report",
                recipient_email=org.admin_email,
                recipient_name=org.company_name,
                context=ctx,
                subject_id=org.id,
                subject_type="organization",
            )
            if scheduled:
                stats["scheduled"] += 1

    logger.info("monthly_reports: %s", stats)
    return stats
