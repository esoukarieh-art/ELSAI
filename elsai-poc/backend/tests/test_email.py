"""Tests du service email Brevo — on mocke httpx."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.config import settings
from app.services import email as email_service


def test_send_email_requires_api_key():
    # Par défaut, brevo_api_key est vide
    with pytest.raises(email_service.EmailNotConfiguredError):
        email_service.send_email(
            to_email="a@b.fr",
            to_name=None,
            subject="x",
            html_content="<p>hi</p>",
        )


def test_send_email_posts_to_brevo(monkeypatch):
    monkeypatch.setattr(settings, "brevo_api_key", "xkeysib-test", raising=False)

    fake_response = MagicMock()
    fake_response.status_code = 201
    fake_response.json.return_value = {"messageId": "abc123"}

    fake_client = MagicMock()
    fake_client.__enter__.return_value = fake_client
    fake_client.post.return_value = fake_response

    with patch.object(email_service.httpx, "Client", return_value=fake_client):
        msg_id = email_service.send_email(
            to_email="admin@acme.fr",
            to_name="ACME",
            subject="Codes",
            html_content="<p>code</p>",
            text_content="code",
            tags=["activation"],
        )

    assert msg_id == "abc123"
    call = fake_client.post.call_args
    assert call.args[0] == email_service.BREVO_API_URL
    assert call.kwargs["headers"]["api-key"] == "xkeysib-test"
    body = call.kwargs["json"]
    assert body["to"][0]["email"] == "admin@acme.fr"
    assert body["tags"] == ["activation"]


def test_render_activation_email_contains_codes():
    html, text = email_service.render_activation_email(
        company_name="ACME",
        plan="essentiel",
        seats=2,
        codes=["AAAA1111BBBB", "CCCC2222DDDD"],
        admin_url="https://elsai.fr/offre/admin?token=t",
        portal_url="https://billing.stripe.com/p/x",
    )
    assert "ACME" in html
    assert "AAAA1111BBBB" in html
    assert "AAAA1111BBBB" in text
    assert "Essentiel" in html
    assert "admin?token=t" in html
    assert "billing.stripe.com" in html


def test_render_without_portal_url_omits_portal_block():
    html, _ = email_service.render_activation_email(
        company_name="ACME",
        plan="premium",
        seats=1,
        codes=["XXXX"],
        admin_url="https://elsai.fr/offre/admin?token=t",
        portal_url=None,
    )
    assert "portail client Stripe" not in html
    assert "Premium" in html
