"""Tests du router /api/auth — session anonyme + droit à l'oubli."""
from app.models import Conversation, Message, MetricEvent, Session as UserSession


def test_create_session_adulte(client):
    resp = client.post("/api/auth/session", json={"profile": "adult"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["profile"] == "adult"
    assert body["token"]
    assert body["session_id"]
    assert body["expires_in"] > 0


def test_create_session_mineur(client):
    resp = client.post("/api/auth/session", json={"profile": "minor"})
    assert resp.status_code == 200
    assert resp.json()["profile"] == "minor"


def test_create_session_profil_invalide_rejete(client):
    resp = client.post("/api/auth/session", json={"profile": "bogus"})
    assert resp.status_code == 422


def test_create_session_profil_defaut_adulte(client):
    resp = client.post("/api/auth/session", json={})
    assert resp.status_code == 200
    assert resp.json()["profile"] == "adult"


def test_forget_sans_token_refuse(client):
    resp = client.delete("/api/auth/forget")
    assert resp.status_code == 403  # HTTPBearer auto_error


def test_forget_token_invalide_refuse(client):
    resp = client.delete(
        "/api/auth/forget",
        headers={"Authorization": "Bearer not.a.jwt"},
    )
    assert resp.status_code == 401


def test_forget_cascade_supprime_conversations_et_messages(
    client, db_session, auth_headers, adult_session
):
    # Pré-remplir la DB avec 2 conversations et 3 messages
    session_id = adult_session["session_id"]
    conv1 = Conversation(session_id=session_id)
    conv2 = Conversation(session_id=session_id)
    db_session.add_all([conv1, conv2])
    db_session.flush()
    db_session.add_all([
        Message(conversation_id=conv1.id, role="user", content="hello"),
        Message(conversation_id=conv1.id, role="assistant", content="hi"),
        Message(conversation_id=conv2.id, role="user", content="second conv"),
    ])
    db_session.commit()

    resp = client.delete("/api/auth/forget", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == {"deleted_conversations": 2, "deleted_messages": 3}

    # Vérif cascade effective côté DB
    assert db_session.query(Conversation).count() == 0
    assert db_session.query(Message).count() == 0

    # La session elle-même est conservée (token courant utilisable)
    assert db_session.get(UserSession, session_id) is not None

    # Un événement métrique "forget" a été loggé
    events = db_session.query(MetricEvent).filter_by(event_type="forget").all()
    assert len(events) == 1
    assert events[0].profile == "adult"


def test_forget_sans_conversation_retourne_zero(client, auth_headers):
    resp = client.delete("/api/auth/forget", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == {"deleted_conversations": 0, "deleted_messages": 0}


def test_forget_puis_reutilisation_token_ok(client, auth_headers):
    """Après forget, le token reste valide (la session n'est pas supprimée)."""
    client.delete("/api/auth/forget", headers=auth_headers)
    # On peut encore enchaîner un nouveau forget sans 401
    resp = client.delete("/api/auth/forget", headers=auth_headers)
    assert resp.status_code == 200
