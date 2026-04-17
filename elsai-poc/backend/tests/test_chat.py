"""Tests /api/chat — fusion heuristique + LLM, persistance, CTA."""
from __future__ import annotations

import json

import pytest

from app.models import Message, MetricEvent
from app.services import llm as llm_module


@pytest.fixture
def fake_llm(monkeypatch):
    """Stub de llm.chat_completion configurable par test."""
    calls: list[dict] = []

    def _set(reply: str):
        def _fake(profile, history):
            calls.append({"profile": profile, "history": list(history)})
            return reply
        monkeypatch.setattr(llm_module, "chat_completion", _fake)
        return calls

    return _set


def test_chat_adult_normal(client, auth_headers, fake_llm, db_session):
    calls = fake_llm("Bonjour, en quoi puis-je vous aider ?")
    headers = auth_headers("adult")

    r = client.post("/api/chat", json={"message": "bonjour"}, headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["reply"].startswith("Bonjour")
    assert body["danger_detected"] is False
    assert body["emergency_cta"] is None
    assert body["conversation_id"]
    assert len(calls) == 1

    # User + assistant persistés
    with db_session() as db:
        msgs = db.query(Message).all()
        assert [m.role for m in msgs] == ["user", "assistant"]


def test_chat_heuristic_triggers_cta_even_without_llm_danger(client, auth_headers, fake_llm):
    """Si la regex safety détecte un signal, la CTA doit remonter même
    quand le LLM répond normalement (filet de sécurité)."""
    fake_llm("Je vous entends, parlons-en.")
    headers = auth_headers("adult")

    r = client.post("/api/chat", json={"message": "je veux me tuer"}, headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["danger_detected"] is True
    assert body["emergency_cta"] is not None
    assert body["emergency_cta"]["phone"] == "3114"


def test_chat_minor_llm_returns_json_danger(client, auth_headers, fake_llm):
    """Profil mineur : le LLM peut renvoyer un JSON {danger: true, ...}
    qui doit être parsé et transformé en CTA 119."""
    payload = {
        "danger": True,
        "message": "Tu n'es pas seul·e. Je te propose d'appeler le 119.",
        "emergency_cta": {"label": "Appeler le 119", "phone": "119"},
    }
    fake_llm(json.dumps(payload))
    headers = auth_headers("minor")

    r = client.post("/api/chat", json={"message": "ça va pas"}, headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["danger_detected"] is True
    assert body["emergency_cta"]["phone"] == "119"
    assert "119" in body["reply"]


def test_chat_unknown_conversation_id_returns_404(client, auth_headers, fake_llm):
    fake_llm("peu importe")
    headers = auth_headers("adult")
    r = client.post(
        "/api/chat",
        json={"message": "hello", "conversation_id": "00000000-0000-0000-0000-000000000000"},
        headers=headers,
    )
    assert r.status_code == 404


def test_chat_requires_auth(client):
    r = client.post("/api/chat", json={"message": "hello"})
    assert r.status_code in (401, 403)


def test_chat_conversation_reuse_preserves_history(client, auth_headers, fake_llm):
    """Deuxième message sur la même conv → l'historique envoyé au LLM
    contient les 3 messages précédents (user, assistant, user)."""
    calls = fake_llm("réponse")
    headers = auth_headers("adult")

    r1 = client.post("/api/chat", json={"message": "msg1"}, headers=headers)
    conv_id = r1.json()["conversation_id"]
    client.post(
        "/api/chat",
        json={"message": "msg2", "conversation_id": conv_id},
        headers=headers,
    )

    assert len(calls) == 2
    # Au 2e appel, l'historique doit contenir : msg1 user, reply assistant, msg2 user
    second_history = calls[1]["history"]
    assert len(second_history) == 3
    assert second_history[0]["content"] == "msg1"
    assert second_history[-1]["content"] == "msg2"


def test_chat_emits_danger_metric(client, auth_headers, fake_llm, db_session):
    fake_llm("ok")
    headers = auth_headers("adult")
    client.post("/api/chat", json={"message": "il me frappe"}, headers=headers)

    with db_session() as db:
        events = {e.event_type for e in db.query(MetricEvent).all()}
        assert "chat" in events
        assert "danger" in events


def test_chat_llm_failure_returns_503(client, auth_headers, monkeypatch):
    def _boom(profile, history):
        raise RuntimeError("ANTHROPIC_API_KEY non définie dans .env")
    monkeypatch.setattr(llm_module, "chat_completion", _boom)
    headers = auth_headers("adult")

    r = client.post("/api/chat", json={"message": "hello"}, headers=headers)
    assert r.status_code == 503
