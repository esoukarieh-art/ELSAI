"""Tests observabilité : correlation ID + logs safety sans PII."""

from __future__ import annotations

import json
import logging

import pytest

from app.services import llm as llm_module


def test_correlation_id_generated_when_absent(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    cid = r.headers.get("X-Correlation-Id")
    assert cid is not None
    assert len(cid) >= 16


def test_correlation_id_echoed_from_request(client):
    r = client.get("/api/health", headers={"X-Correlation-Id": "abc-123-xyz"})
    assert r.headers["X-Correlation-Id"] == "abc-123-xyz"


def test_danger_log_contains_no_user_content(client, auth_headers, monkeypatch, caplog):
    """Le log `safety.danger_detected` doit logger signals + profil + CTA,
    mais JAMAIS le contenu du message utilisateur (anonymat RGPD)."""
    monkeypatch.setattr(
        llm_module, "chat_completion", lambda profile, history: ("Je vous entends.", None)
    )
    headers = auth_headers("adult")
    user_message = "je veux me tuer maintenant voici un secret SECRET-CANARY-42"

    with caplog.at_level(logging.WARNING):
        r = client.post("/api/chat", json={"message": user_message}, headers=headers)

    assert r.status_code == 200
    assert r.json()["danger_detected"] is True

    # Aucun log ne doit contenir le canary ni le message brut
    all_text = "\n".join(rec.getMessage() for rec in caplog.records)
    assert "SECRET-CANARY-42" not in all_text
    assert user_message not in all_text


def test_danger_log_structure(client, auth_headers, monkeypatch, capsys):
    """Le log JSON safety doit contenir profil, signaux, cta_phone, correlation_id."""
    monkeypatch.setattr(llm_module, "chat_completion", lambda p, h: ("ok", None))
    headers = auth_headers("minor")

    client.post("/api/chat", json={"message": "je veux me tuer"}, headers=headers)

    captured = capsys.readouterr().out
    danger_lines = [line for line in captured.splitlines() if "safety.danger_detected" in line]
    assert danger_lines, f"aucun log safety émis. stdout={captured[:500]}"

    payload = json.loads(danger_lines[-1])
    assert payload["event"] == "safety.danger_detected"
    assert payload["profile"] == "minor"
    assert "suicide" in payload["heuristic_signals"]
    assert payload["cta_phone"] == "119"
    assert "correlation_id" in payload
    # Garde-fou : aucune clé ne doit contenir du contenu utilisateur
    assert "message" not in payload
    assert "content" not in payload


def test_init_sentry_disabled_without_dsn(monkeypatch):
    from app import observability
    from app.config import settings

    monkeypatch.setattr(settings, "sentry_dsn", "")
    assert observability.init_sentry() is False


@pytest.fixture(autouse=True)
def reset_structlog_caplog():
    """structlog cache son logger ; on s'assure que caplog capture bien."""
    yield
