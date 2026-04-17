"""Tests /api/auth/session et /api/auth/forget (cascade delete)."""
from __future__ import annotations

from app.models import Conversation, Message, MetricEvent, Session as UserSession


def test_create_session_adult(client):
    r = client.post("/api/auth/session", json={"profile": "adult"})
    assert r.status_code == 200
    body = r.json()
    assert body["profile"] == "adult"
    assert body["token"]
    assert body["session_id"]
    assert body["expires_in"] > 0


def test_create_session_minor(client):
    r = client.post("/api/auth/session", json={"profile": "minor"})
    assert r.status_code == 200
    assert r.json()["profile"] == "minor"


def test_forget_requires_auth(client):
    r = client.delete("/api/auth/forget")
    assert r.status_code in (401, 403)


def test_forget_invalid_token(client):
    r = client.delete("/api/auth/forget", headers={"Authorization": "Bearer pas-un-jwt"})
    assert r.status_code == 401


def test_forget_cascade_delete(client, auth_headers, db_session):
    """Le droit à l'oubli doit supprimer conversations + messages de la session,
    et UNIQUEMENT de celle-ci (pas ceux des autres sessions)."""
    headers = auth_headers("adult")

    # Identifier la session active via le JWT (on relit la première session en base)
    with db_session() as db:
        mine = db.query(UserSession).one()
        other = UserSession(profile="adult")
        db.add(other)
        db.flush()

        # Peupler MA session : 2 conv × 2 msg
        for _ in range(2):
            conv = Conversation(session_id=mine.id)
            db.add(conv)
            db.flush()
            db.add(Message(conversation_id=conv.id, role="user", content="x"))
            db.add(Message(conversation_id=conv.id, role="assistant", content="y"))

        # Peupler la session VOISINE : ne doit pas être touchée
        other_conv = Conversation(session_id=other.id)
        db.add(other_conv)
        db.flush()
        db.add(Message(conversation_id=other_conv.id, role="user", content="autre"))
        db.commit()
        other_id = other.id

    r = client.delete("/api/auth/forget", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["deleted_conversations"] == 2
    assert body["deleted_messages"] == 4

    with db_session() as db:
        assert db.query(Conversation).filter_by(session_id=other_id).count() == 1
        assert db.query(Message).count() == 1  # seul le message de l'autre session survit
        # Un event "forget" a été loggé
        assert db.query(MetricEvent).filter_by(event_type="forget").count() == 1
