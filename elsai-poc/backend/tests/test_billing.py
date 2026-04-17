"""Tests billing Stripe — on mocke entièrement le SDK Stripe."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import patch

import pytest

from app.config import settings
from app.models import AccessCode, Organization
from app.routers import billing as billing_mod


@pytest.fixture
def stripe_configured(monkeypatch):
    monkeypatch.setattr(settings, "stripe_secret_key", "sk_test_fake", raising=False)
    monkeypatch.setattr(settings, "stripe_webhook_secret", "whsec_fake", raising=False)
    monkeypatch.setattr(
        settings, "stripe_price_essentiel_monthly", "price_essm", raising=False
    )
    monkeypatch.setattr(
        settings, "stripe_price_premium_monthly", "price_prem", raising=False
    )


def test_checkout_requires_stripe_config(client):
    r = client.post(
        "/api/billing/checkout",
        json={
            "plan": "essentiel",
            "billing_cycle": "monthly",
            "seats": 10,
            "company_name": "ACME",
            "admin_email": "admin@acme.fr",
        },
    )
    assert r.status_code == 503


def test_checkout_creates_org_and_returns_url(client, db_session, stripe_configured):
    fake_customer = SimpleNamespace(id="cus_123")
    fake_session = SimpleNamespace(url="https://checkout.stripe.com/x", id="cs_123")

    with patch.object(
        billing_mod.stripe.Customer, "create", return_value=fake_customer
    ) as cust_create, patch.object(
        billing_mod.stripe.checkout.Session, "create", return_value=fake_session
    ) as sess_create:
        r = client.post(
            "/api/billing/checkout",
            json={
                "plan": "essentiel",
                "billing_cycle": "monthly",
                "seats": 7,
                "company_name": "ACME",
                "admin_email": "admin@acme.fr",
                "siret": "12345678900010",
            },
        )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["checkout_url"] == "https://checkout.stripe.com/x"
    org_id = body["organization_id"]

    cust_create.assert_called_once()
    sess_create.assert_called_once()
    call_kwargs = sess_create.call_args.kwargs
    assert call_kwargs["line_items"] == [{"price": "price_essm", "quantity": 7}]
    assert call_kwargs["customer"] == "cus_123"

    with db_session() as s:
        org = s.get(Organization, org_id)
        assert org is not None
        assert org.status == "pending"
        assert org.seats == 7
        assert org.stripe_customer_id == "cus_123"


def test_webhook_checkout_completed_activates_org_and_generates_codes(
    client, db_session, stripe_configured
):
    with db_session() as s:
        org = Organization(
            company_name="ACME",
            admin_email="a@a.fr",
            plan="essentiel",
            billing_cycle="monthly",
            seats=3,
            status="pending",
            stripe_customer_id="cus_123",
        )
        s.add(org)
        s.commit()
        org_id = org.id

    fake_event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "metadata": {"organization_id": org_id},
                "subscription": "sub_abc",
            }
        },
    }

    with patch.object(
        billing_mod.stripe.Webhook, "construct_event", return_value=fake_event
    ):
        r = client.post(
            "/api/billing/webhook",
            content=b"{}",
            headers={"Stripe-Signature": "t=1,v1=fake"},
        )

    assert r.status_code == 200

    with db_session() as s:
        org = s.get(Organization, org_id)
        assert org.status == "active"
        assert org.stripe_subscription_id == "sub_abc"
        codes = s.query(AccessCode).filter_by(organization_id=org_id).all()
        assert len(codes) == 3
        assert len({c.code for c in codes}) == 3


def test_webhook_subscription_deleted_revokes_codes(client, db_session, stripe_configured):
    with db_session() as s:
        org = Organization(
            company_name="ACME",
            admin_email="a@a.fr",
            plan="premium",
            billing_cycle="monthly",
            seats=2,
            status="active",
            stripe_customer_id="cus_1",
            stripe_subscription_id="sub_xyz",
        )
        s.add(org)
        s.commit()
        s.add_all([
            AccessCode(organization_id=org.id, code="AAAA1111BBBB"),
            AccessCode(organization_id=org.id, code="CCCC2222DDDD"),
        ])
        s.commit()
        org_id = org.id

    fake_event = {
        "type": "customer.subscription.deleted",
        "data": {"object": {"id": "sub_xyz", "status": "canceled"}},
    }

    with patch.object(
        billing_mod.stripe.Webhook, "construct_event", return_value=fake_event
    ):
        r = client.post(
            "/api/billing/webhook",
            content=b"{}",
            headers={"Stripe-Signature": "fake"},
        )
    assert r.status_code == 200

    with db_session() as s:
        org = s.get(Organization, org_id)
        assert org.status == "canceled"
        codes = s.query(AccessCode).filter_by(organization_id=org_id).all()
        assert all(c.revoked_at is not None for c in codes)


def test_webhook_completed_triggers_email_send(client, db_session, stripe_configured):
    """Vérifie qu'un webhook activation tente d'envoyer l'email via Brevo."""
    with db_session() as s:
        org = Organization(
            company_name="ACME",
            admin_email="admin@acme.fr",
            plan="essentiel",
            billing_cycle="monthly",
            seats=2,
            status="pending",
            stripe_customer_id="cus_e",
        )
        s.add(org)
        s.commit()
        org_id = org.id

    fake_event = {
        "type": "checkout.session.completed",
        "data": {"object": {"metadata": {"organization_id": org_id}, "subscription": "sub_x"}},
    }

    with patch.object(
        billing_mod.stripe.Webhook, "construct_event", return_value=fake_event
    ), patch.object(
        billing_mod.email_service, "send_email", return_value="msg_1"
    ) as send_mock, patch.object(
        billing_mod, "_build_portal_url", return_value=None
    ):
        r = client.post(
            "/api/billing/webhook",
            content=b"{}",
            headers={"Stripe-Signature": "fake"},
        )
    assert r.status_code == 200
    send_mock.assert_called_once()
    kwargs = send_mock.call_args.kwargs
    assert kwargs["to_email"] == "admin@acme.fr"
    assert "ELSAI" in kwargs["subject"] or "elsai" in kwargs["subject"].lower()


def _make_org_with_codes(db_session, seats=3, status="active"):
    with db_session() as s:
        org = Organization(
            company_name="ACME",
            admin_email="a@a.fr",
            plan="essentiel",
            billing_cycle="monthly",
            seats=seats,
            status=status,
            stripe_customer_id="cus_x",
        )
        s.add(org)
        s.commit()
        for _ in range(seats):
            s.add(AccessCode(organization_id=org.id, code=billing_mod._generate_code()))
        s.commit()
        return org.id


def test_get_organization_with_token(client, db_session, stripe_configured):
    org_id = _make_org_with_codes(db_session)
    token = billing_mod.create_org_token(org_id)

    r = client.get(f"/api/billing/organization?token={token}")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["id"] == org_id
    assert body["seats"] == 3
    assert len(body["codes"]) == 3


def test_get_organization_rejects_bad_token(client):
    r = client.get("/api/billing/organization?token=not-a-jwt")
    assert r.status_code == 401


def test_revoke_code(client, db_session, stripe_configured):
    org_id = _make_org_with_codes(db_session)
    token = billing_mod.create_org_token(org_id)

    body = client.get(f"/api/billing/organization?token={token}").json()
    code_id = body["codes"][0]["id"]

    r = client.post(
        f"/api/billing/organization/codes/{code_id}/revoke?token={token}"
    )
    assert r.status_code == 200

    with db_session() as s:
        code = s.get(AccessCode, code_id)
        assert code.revoked_at is not None


def test_regenerate_code(client, db_session, stripe_configured):
    org_id = _make_org_with_codes(db_session, seats=1)
    token = billing_mod.create_org_token(org_id)

    body = client.get(f"/api/billing/organization?token={token}").json()
    code_id = body["codes"][0]["id"]

    r = client.post(
        f"/api/billing/organization/codes/regenerate?code_id={code_id}&token={token}"
    )
    assert r.status_code == 200
    new = r.json()
    assert new["new_code"] and new["new_code_id"] != code_id

    with db_session() as s:
        codes = s.query(AccessCode).filter_by(organization_id=org_id).all()
        assert len(codes) == 2
        assert sum(1 for c in codes if c.revoked_at is None) == 1


def test_resend_email_not_configured(client, db_session, stripe_configured):
    org_id = _make_org_with_codes(db_session)
    token = billing_mod.create_org_token(org_id)

    # Brevo non configuré -> send_email lève EmailNotConfiguredError -> sent=False
    with patch.object(
        billing_mod.email_service,
        "send_email",
        side_effect=billing_mod.email_service.EmailNotConfiguredError("no key"),
    ):
        r = client.post(
            f"/api/billing/organization/resend-email?token={token}"
        )
    assert r.status_code == 200
    assert r.json() == {"sent": False}


def test_resend_email_ok(client, db_session, stripe_configured):
    org_id = _make_org_with_codes(db_session)
    token = billing_mod.create_org_token(org_id)

    with patch.object(
        billing_mod.email_service, "send_email", return_value="msg_id"
    ) as send_mock, patch.object(billing_mod, "_build_portal_url", return_value=None):
        r = client.post(
            f"/api/billing/organization/resend-email?token={token}"
        )
    assert r.status_code == 200
    assert r.json() == {"sent": True}
    send_mock.assert_called_once()


def test_webhook_bad_signature(client, stripe_configured):
    import stripe as stripe_lib

    with patch.object(
        billing_mod.stripe.Webhook,
        "construct_event",
        side_effect=stripe_lib.error.SignatureVerificationError("bad", "sig"),
    ):
        r = client.post(
            "/api/billing/webhook",
            content=b"{}",
            headers={"Stripe-Signature": "wrong"},
        )
    assert r.status_code == 400
