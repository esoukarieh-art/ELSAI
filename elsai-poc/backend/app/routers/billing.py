"""Facturation B2B via Stripe.

- POST /api/billing/checkout : crée une session Stripe Checkout (Essentiel/Premium)
- POST /api/billing/webhook  : reçoit les événements Stripe (activation, résiliation...)
- POST /api/billing/portal   : génère une URL Customer Portal pour un client existant
"""

from __future__ import annotations

import logging
import secrets
from datetime import UTC, datetime, timedelta

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session as DBSession

from ..config import settings
from ..database import get_db
from ..models import AccessCode, Organization
from ..services import email as email_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/billing", tags=["billing"])


PLAN_TO_PRICE = {
    ("essentiel", "monthly"): lambda: settings.stripe_price_essentiel_monthly,
    ("essentiel", "yearly"): lambda: settings.stripe_price_essentiel_yearly,
    ("premium", "monthly"): lambda: settings.stripe_price_premium_monthly,
    ("premium", "yearly"): lambda: settings.stripe_price_premium_yearly,
}


def _require_stripe() -> None:
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Facturation non configurée (STRIPE_SECRET_KEY manquant).",
        )
    stripe.api_key = settings.stripe_secret_key


ORG_TOKEN_TTL_DAYS = 365


def create_org_token(organization_id: str) -> str:
    """Token long-lived (1 an) donnant accès à l'espace admin de l'organisation."""
    now = datetime.now(UTC)
    payload = {
        "sub": organization_id,
        "scope": "org_admin",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=ORG_TOKEN_TTL_DAYS)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _decode_org_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(401, "Token invalide ou expiré") from exc
    if payload.get("scope") != "org_admin":
        raise HTTPException(401, "Token invalide (scope)")
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(401, "Token invalide")
    return sub


def _get_org_from_token(token: str, db: DBSession) -> Organization:
    org_id = _decode_org_token(token)
    org = db.get(Organization, org_id)
    if org is None:
        raise HTTPException(404, "Organisation inconnue")
    return org


def _resolve_price_id(plan: str, cycle: str) -> str:
    getter = PLAN_TO_PRICE.get((plan, cycle))
    if not getter:
        raise HTTPException(400, f"Combinaison plan/cycle invalide : {plan}/{cycle}")
    price_id = getter()
    if not price_id:
        raise HTTPException(
            status_code=503,
            detail=f"Price Stripe non configuré pour {plan}/{cycle}.",
        )
    return price_id


# --------- Schemas ---------

class CheckoutRequest(BaseModel):
    plan: str = Field(..., pattern="^(essentiel|premium)$")
    billing_cycle: str = Field("monthly", pattern="^(monthly|yearly)$")
    seats: int = Field(..., ge=1, le=10_000)
    company_name: str = Field(..., min_length=2, max_length=200)
    admin_email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=200)
    siret: str | None = Field(None, max_length=20)


class CheckoutResponse(BaseModel):
    checkout_url: str
    organization_id: str


class PortalRequest(BaseModel):
    organization_id: str


class PortalResponse(BaseModel):
    portal_url: str


class CodeView(BaseModel):
    id: str
    code: str
    assigned_at: datetime | None
    revoked_at: datetime | None


class OrganizationView(BaseModel):
    id: str
    company_name: str
    plan: str
    billing_cycle: str
    seats: int
    status: str
    admin_email: str
    codes: list[CodeView]


# --------- Endpoints ---------

@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout(
    payload: CheckoutRequest,
    db: DBSession = Depends(get_db),
) -> CheckoutResponse:
    _require_stripe()
    price_id = _resolve_price_id(payload.plan, payload.billing_cycle)

    org = Organization(
        company_name=payload.company_name,
        siret=payload.siret,
        admin_email=payload.admin_email,
        plan=payload.plan,
        billing_cycle=payload.billing_cycle,
        seats=payload.seats,
        status="pending",
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    customer = stripe.Customer.create(
        email=payload.admin_email,
        name=payload.company_name,
        metadata={"organization_id": org.id, "siret": payload.siret or ""},
    )
    org.stripe_customer_id = customer.id
    db.commit()

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=customer.id,
        line_items=[{"price": price_id, "quantity": payload.seats}],
        success_url=f"{settings.billing_success_url}?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=settings.billing_cancel_url,
        metadata={"organization_id": org.id},
        subscription_data={"metadata": {"organization_id": org.id}},
        allow_promotion_codes=True,
        billing_address_collection="required",
        tax_id_collection={"enabled": True},
    )

    return CheckoutResponse(checkout_url=session.url, organization_id=org.id)


@router.post("/portal", response_model=PortalResponse)
def create_portal(
    payload: PortalRequest,
    db: DBSession = Depends(get_db),
) -> PortalResponse:
    _require_stripe()
    org = db.get(Organization, payload.organization_id)
    if not org or not org.stripe_customer_id:
        raise HTTPException(404, "Organisation inconnue ou non encore facturée.")

    session = stripe.billing_portal.Session.create(
        customer=org.stripe_customer_id,
        return_url=settings.billing_portal_return_url,
    )
    return PortalResponse(portal_url=session.url)


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(None, alias="Stripe-Signature"),
    db: DBSession = Depends(get_db),
) -> dict:
    if not settings.stripe_webhook_secret:
        raise HTTPException(503, "Webhook Stripe non configuré.")

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature or "",
            secret=settings.stripe_webhook_secret,
        )
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        raise HTTPException(400, f"Signature invalide : {e}")

    handler = _EVENT_HANDLERS.get(event["type"])
    if handler:
        handler(event["data"]["object"], db)
    return {"received": True, "type": event["type"]}


# --------- Admin organisation (auth par token signé dans query) ---------

@router.get("/organization", response_model=OrganizationView)
def get_organization(
    token: str = Query(...),
    db: DBSession = Depends(get_db),
) -> OrganizationView:
    org = _get_org_from_token(token, db)
    return OrganizationView(
        id=org.id,
        company_name=org.company_name,
        plan=org.plan,
        billing_cycle=org.billing_cycle,
        seats=org.seats,
        status=org.status,
        admin_email=org.admin_email,
        codes=[
            CodeView(
                id=c.id,
                code=c.code,
                assigned_at=c.assigned_at,
                revoked_at=c.revoked_at,
            )
            for c in sorted(org.access_codes, key=lambda c: c.created_at)
        ],
    )


@router.post("/organization/codes/{code_id}/revoke")
def revoke_code(
    code_id: str,
    token: str = Query(...),
    db: DBSession = Depends(get_db),
) -> dict:
    org = _get_org_from_token(token, db)
    code = db.get(AccessCode, code_id)
    if not code or code.organization_id != org.id:
        raise HTTPException(404, "Code inconnu")
    if code.revoked_at is None:
        code.revoked_at = datetime.now(UTC)
        db.commit()
    return {"revoked": True, "code_id": code.id}


@router.post("/organization/codes/regenerate")
def regenerate_code(
    code_id: str = Query(...),
    token: str = Query(...),
    db: DBSession = Depends(get_db),
) -> dict:
    """Révoque un code et en génère un nouveau (même siège)."""
    org = _get_org_from_token(token, db)
    code = db.get(AccessCode, code_id)
    if not code or code.organization_id != org.id:
        raise HTTPException(404, "Code inconnu")
    if code.revoked_at is None:
        code.revoked_at = datetime.now(UTC)
    new_code = AccessCode(organization_id=org.id, code=_generate_code())
    db.add(new_code)
    db.commit()
    return {"new_code_id": new_code.id, "new_code": new_code.code}


@router.post("/organization/resend-email")
def resend_activation_email(
    token: str = Query(...),
    db: DBSession = Depends(get_db),
) -> dict:
    org = _get_org_from_token(token, db)
    sent = _send_activation_email(org)
    return {"sent": sent}


# --------- Event handlers ---------

def _generate_code() -> str:
    # 12 chars alphanum, lisible (sans 0/O/1/l)
    alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(12))


def _build_admin_url(org_id: str) -> str:
    token = create_org_token(org_id)
    return f"{settings.frontend_base_url}/offre/admin?token={token}"


def _build_portal_url(customer_id: str | None) -> str | None:
    if not customer_id or not settings.stripe_secret_key:
        return None
    try:
        stripe.api_key = settings.stripe_secret_key
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=settings.billing_portal_return_url,
        )
        return session.url
    except Exception:  # noqa: BLE001 — portail optionnel dans l'email
        logger.exception("Impossible de générer l'URL du Customer Portal")
        return None


def _send_activation_email(org: Organization) -> bool:
    """Envoie l'email d'activation (codes + lien admin + portail). Retourne True si envoyé."""
    active_codes = [c.code for c in org.access_codes if c.revoked_at is None]
    admin_url = _build_admin_url(org.id)
    portal_url = _build_portal_url(org.stripe_customer_id)

    html, text = email_service.render_activation_email(
        company_name=org.company_name,
        plan=org.plan,
        seats=org.seats,
        codes=active_codes,
        admin_url=admin_url,
        portal_url=portal_url,
    )
    try:
        email_service.send_email(
            to_email=org.admin_email,
            to_name=org.company_name,
            subject=f"Vos codes d'accès ELSAI — {org.company_name}",
            html_content=html,
            text_content=text,
            tags=["activation", f"plan:{org.plan}"],
        )
        return True
    except email_service.EmailNotConfiguredError:
        logger.warning("Brevo non configuré : email d'activation non envoyé pour %s", org.id)
        return False
    except Exception:  # noqa: BLE001
        logger.exception("Échec d'envoi de l'email d'activation pour %s", org.id)
        return False


def _handle_checkout_completed(obj: dict, db: DBSession) -> None:
    org_id = (obj.get("metadata") or {}).get("organization_id")
    if not org_id:
        return
    org = db.get(Organization, org_id)
    if not org:
        return

    sub_id = obj.get("subscription")
    if sub_id:
        org.stripe_subscription_id = sub_id
    org.status = "active"

    existing = len(org.access_codes)
    for _ in range(max(0, org.seats - existing)):
        db.add(AccessCode(organization_id=org.id, code=_generate_code()))

    db.commit()
    db.refresh(org)
    _send_activation_email(org)


def _handle_subscription_updated(obj: dict, db: DBSession) -> None:
    sub_id = obj.get("id")
    if not sub_id:
        return
    org = db.query(Organization).filter_by(stripe_subscription_id=sub_id).first()
    if not org:
        return

    stripe_status = obj.get("status")
    mapping = {
        "active": "active",
        "trialing": "active",
        "past_due": "past_due",
        "unpaid": "past_due",
        "canceled": "canceled",
        "incomplete_expired": "canceled",
    }
    org.status = mapping.get(stripe_status, org.status)

    items = (obj.get("items") or {}).get("data") or []
    if items:
        qty = items[0].get("quantity")
        if isinstance(qty, int) and qty > 0:
            org.seats = qty

    db.commit()


def _handle_subscription_deleted(obj: dict, db: DBSession) -> None:
    sub_id = obj.get("id")
    if not sub_id:
        return
    org = db.query(Organization).filter_by(stripe_subscription_id=sub_id).first()
    if not org:
        return
    org.status = "canceled"
    now = datetime.now(UTC)
    for code in org.access_codes:
        if code.revoked_at is None:
            code.revoked_at = now
    db.commit()


def _handle_invoice_paid(obj: dict, db: DBSession) -> None:
    customer_id = obj.get("customer")
    if not customer_id:
        return
    org = db.query(Organization).filter_by(stripe_customer_id=customer_id).first()
    if not org:
        return
    if org.status in ("pending", "past_due"):
        org.status = "active"
        db.commit()


_EVENT_HANDLERS = {
    "checkout.session.completed": _handle_checkout_completed,
    "customer.subscription.updated": _handle_subscription_updated,
    "customer.subscription.deleted": _handle_subscription_deleted,
    "invoice.paid": _handle_invoice_paid,
}
