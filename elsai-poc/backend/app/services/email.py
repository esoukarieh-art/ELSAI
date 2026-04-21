"""Envoi d'emails transactionnels via l'API Brevo (ex-Sendinblue).

API v3 : https://developers.brevo.com/reference/sendtransacemail
Utilisation directe via httpx pour éviter une dépendance supplémentaire.
"""

from __future__ import annotations

import logging

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
BREVO_CONTACTS_URL = "https://api.brevo.com/v3/contacts"


class EmailNotConfiguredError(RuntimeError):
    """Brevo n'est pas configuré — l'email n'a pas été envoyé."""


def _require_brevo() -> str:
    if not settings.brevo_api_key:
        raise EmailNotConfiguredError("BREVO_API_KEY manquant")
    return settings.brevo_api_key


def send_email(
    *,
    to_email: str,
    to_name: str | None,
    subject: str,
    html_content: str,
    text_content: str | None = None,
    tags: list[str] | None = None,
) -> str:
    """Envoie un email via Brevo. Retourne le messageId. Lève EmailNotConfiguredError
    si Brevo n'est pas configuré (l'appelant décide quoi faire : logguer, ignorer...).
    """
    api_key = _require_brevo()

    payload: dict = {
        "sender": {
            "email": settings.brevo_sender_email,
            "name": settings.brevo_sender_name,
        },
        "to": [{"email": to_email, **({"name": to_name} if to_name else {})}],
        "subject": subject,
        "htmlContent": html_content,
    }
    if text_content:
        payload["textContent"] = text_content
    if tags:
        payload["tags"] = tags

    with httpx.Client(timeout=10.0) as client:
        r = client.post(
            BREVO_API_URL,
            headers={
                "api-key": api_key,
                "accept": "application/json",
                "content-type": "application/json",
            },
            json=payload,
        )

    if r.status_code >= 400:
        logger.error("Brevo error %s : %s", r.status_code, r.text)
        r.raise_for_status()

    return r.json().get("messageId", "")


def create_or_update_contact(
    email: str,
    attributes: dict | None = None,
    list_ids: list[int] | None = None,
) -> str | None:
    """Crée/met à jour un contact Brevo. Retourne brevo_contact_id (str) ou None si
    Brevo n'est pas configuré. `list_ids` rattache le contact à des listes Brevo
    (ex: newsletter générale, audience b2b…). Le double opt-in est géré via
    les templates Brevo.
    """
    if not settings.brevo_api_key:
        logger.warning("Brevo non configuré — contact %s non synchronisé", email)
        return None

    payload: dict = {
        "email": email,
        "updateEnabled": True,
    }
    if attributes:
        payload["attributes"] = attributes
    if list_ids:
        payload["listIds"] = list_ids

    try:
        with httpx.Client(timeout=10.0) as client:
            r = client.post(
                BREVO_CONTACTS_URL,
                headers={
                    "api-key": settings.brevo_api_key,
                    "accept": "application/json",
                    "content-type": "application/json",
                },
                json=payload,
            )
    except httpx.HTTPError as exc:
        logger.error("Brevo create_or_update_contact exception : %s", exc)
        return None

    if r.status_code in (200, 201, 204):
        data: dict = {}
        try:
            data = r.json() if r.content else {}
        except ValueError:
            data = {}
        contact_id = data.get("id")
        return str(contact_id) if contact_id else email
    logger.error("Brevo contact error %s : %s", r.status_code, r.text)
    return None


def remove_contact_from_lists(email: str, list_ids: list[int]) -> bool:
    """Retire un contact des listes données. Retourne True si Brevo non configuré
    (no-op) ou si l'appel a réussi.
    """
    if not settings.brevo_api_key:
        return True
    url = f"{BREVO_CONTACTS_URL}/lists/{list_ids[0]}/contacts/remove" if list_ids else None
    if not url:
        return True
    try:
        with httpx.Client(timeout=10.0) as client:
            for lid in list_ids:
                client.post(
                    f"{BREVO_CONTACTS_URL}/lists/{lid}/contacts/remove",
                    headers={
                        "api-key": settings.brevo_api_key,
                        "accept": "application/json",
                        "content-type": "application/json",
                    },
                    json={"emails": [email]},
                )
    except httpx.HTTPError as exc:
        logger.error("Brevo remove_contact_from_lists exception : %s", exc)
        return False
    return True


def render_activation_email(
    *,
    company_name: str,
    plan: str,
    seats: int,
    codes: list[str],
    admin_url: str,
    portal_url: str | None,
) -> tuple[str, str]:
    """Rend le HTML + texte brut de l'email d'activation (codes d'accès)."""
    plan_label = {"essentiel": "Essentiel", "premium": "Premium"}.get(plan, plan)
    codes_html = "".join(
        f'<tr><td style="font-family:monospace;padding:6px 0;border-bottom:1px solid #eee;">{c}</td></tr>'
        for c in codes
    )
    portal_block = (
        f'<p>Gérez votre abonnement et vos factures via le <a href="{portal_url}">portail client Stripe</a>.</p>'
        if portal_url
        else ""
    )

    html = f"""<!doctype html>
<html lang="fr"><body style="font-family:Inter,Arial,sans-serif;color:#2a2a2a;max-width:560px;margin:0 auto;padding:24px;">
  <h1 style="font-family:Georgia,serif;color:#3f5a4c;">Bienvenue chez ELSAI</h1>
  <p>Bonjour,</p>
  <p>Votre abonnement <strong>{plan_label}</strong> pour <strong>{company_name}</strong> ({seats} salariés) est actif.
  Voici les {len(codes)} codes d'accès à distribuer à vos équipes :</p>
  <table style="margin:16px 0;">{codes_html}</table>
  <p>Chaque salarié utilise son code sur <a href="{settings.frontend_base_url}/start">{settings.frontend_base_url}/start</a> — aucune donnée nominative n'est collectée.</p>
  <p><a href="{admin_url}" style="display:inline-block;background:#5A7E6B;color:#F5F5ED;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600;">Accéder à l'espace admin ELSAI</a></p>
  {portal_block}
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="font-size:12px;color:#666;">ELSAI — Assistant social numérique. Cet email contient des codes confidentiels, merci de le traiter avec précaution.</p>
</body></html>"""

    text = (
        f"Bienvenue chez ELSAI\n\n"
        f"Votre abonnement {plan_label} pour {company_name} ({seats} salariés) est actif.\n"
        f"Codes d'accès ({len(codes)}) :\n"
        + "\n".join(f"  - {c}" for c in codes)
        + f"\n\nEspace admin : {admin_url}\n"
        + (f"Portail facturation : {portal_url}\n" if portal_url else "")
    )
    return html, text
