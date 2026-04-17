"""Tests du router /api/chat — fusion safety heuristique + LLM, historique, droits."""
import pytest

from app.models import Conversation, Message, MetricEvent
from app.services import llm as llm_service


@pytest.fixture(autouse=True)
def stub_llm(monkeypatch):
    """Évite tout appel réseau. Chaque test peut override via `set_reply`."""
    state = {"reply": "Bien reçu. Voici des pistes.", "history_seen": None}

    def fake_chat_completion(profile, history):
        state["history_seen"] = list(history)
        state["profile_seen"] = profile
        return state["reply"]

    monkeypatch.setattr(llm_service, "chat_completion", fake_chat_completion)
    return state


def test_chat_cree_conversation_et_stocke_messages(client, auth_headers, db_session):
    resp = client.post(
        "/api/chat",
        headers=auth_headers,
        json={"message": "Bonjour, j'ai une question sur le RSA"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["conversation_id"]
    assert body["reply"]
    assert body["danger_detected"] is False
    assert body["emergency_cta"] is None

    # DB : 1 conversation, 2 messages (user + assistant)
    assert db_session.query(Conversation).count() == 1
    msgs = db_session.query(Message).order_by(Message.created_at).all()
    assert [m.role for m in msgs] == ["user", "assistant"]
    assert msgs[0].content == "Bonjour, j'ai une question sur le RSA"
    assert all(m.danger_flag is False for m in msgs)

    # Événement métrique "chat" loggé, pas de "danger"
    events = db_session.query(MetricEvent).all()
    assert {e.event_type for e in events} == {"chat"}


def test_chat_reutilise_conversation_existante(client, auth_headers, db_session, stub_llm):
    first = client.post("/api/chat", headers=auth_headers, json={"message": "message 1"}).json()
    conv_id = first["conversation_id"]

    client.post(
        "/api/chat",
        headers=auth_headers,
        json={"message": "message 2", "conversation_id": conv_id},
    )

    assert db_session.query(Conversation).count() == 1
    assert db_session.query(Message).count() == 4  # 2 échanges × (user+assistant)

    # L'historique envoyé au LLM au 2e tour : user1 + assistant1 + user2 = 3.
    assert len(stub_llm["history_seen"]) == 3
    assert stub_llm["history_seen"][-1]["content"] == "message 2"
    assert stub_llm["history_seen"][-1]["role"] == "user"


def test_chat_conversation_inexistante_renvoie_404(client, auth_headers):
    resp = client.post(
        "/api/chat",
        headers=auth_headers,
        json={"message": "hello", "conversation_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert resp.status_code == 404


def test_chat_conversation_autre_session_renvoie_404(client, auth_headers, db_session):
    """Une conversation liée à une autre session ne doit pas être réutilisable."""
    # Créer une session B et une conversation à elle
    other = client.post("/api/auth/session", json={"profile": "adult"}).json()
    conv_other = Conversation(session_id=other["session_id"])
    db_session.add(conv_other)
    db_session.commit()

    # Session A (auth_headers) tente d'y écrire → 404, pas de fuite d'info
    resp = client.post(
        "/api/chat",
        headers=auth_headers,
        json={"message": "intrusion", "conversation_id": conv_other.id},
    )
    assert resp.status_code == 404


def test_chat_heuristique_danger_flague_et_cta_adulte(client, auth_headers, db_session):
    resp = client.post(
        "/api/chat",
        headers=auth_headers,
        json={"message": "je veux me tuer, je n'en peux plus"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["danger_detected"] is True
    assert body["emergency_cta"]["phone"] == "3114"

    # Le message user est flaggé en DB
    user_msg = db_session.query(Message).filter_by(role="user").one()
    assert user_msg.danger_flag is True

    # Événement "danger" loggé en plus de "chat"
    events = {e.event_type for e in db_session.query(MetricEvent).all()}
    assert "danger" in events and "chat" in events


def test_chat_mineur_cta_119(client, minor_session):
    headers = {"Authorization": f"Bearer {minor_session['token']}"}
    resp = client.post(
        "/api/chat",
        headers=headers,
        json={"message": "mon père me frappe"},
    )
    assert resp.status_code == 200
    assert resp.json()["emergency_cta"]["phone"] == "119"


def test_chat_mineur_parse_json_danger_du_llm(client, minor_session, stub_llm):
    """Si le LLM mineur renvoie du JSON `{danger: true, ...}`, il doit être parsé."""
    stub_llm["reply"] = (
        '{"danger": true, "message": "Je suis là avec toi.", '
        '"emergency_cta": {"label": "Appelle le 119", "phone": "119"}}'
    )
    headers = {"Authorization": f"Bearer {minor_session['token']}"}
    resp = client.post(
        "/api/chat",
        headers=headers,
        json={"message": "je me sens très mal"},  # pas de match heuristique
    )
    body = resp.json()
    assert body["reply"] == "Je suis là avec toi."
    assert body["danger_detected"] is True
    assert body["emergency_cta"] == {"label": "Appelle le 119", "phone": "119"}


def test_chat_adulte_ignore_json_danger_du_llm(client, auth_headers, stub_llm):
    """Le parsing JSON n'est appliqué qu'au profil mineur."""
    stub_llm["reply"] = '{"danger": true, "message": "x"}'
    resp = client.post("/api/chat", headers=auth_headers, json={"message": "hello"})
    body = resp.json()
    assert body["reply"].startswith("{")
    assert body["danger_detected"] is False


def test_chat_llm_indisponible_renvoie_503(client, auth_headers, monkeypatch):
    def boom(profile, history):
        raise RuntimeError("ANTHROPIC_API_KEY non définie")
    monkeypatch.setattr(llm_service, "chat_completion", boom)

    resp = client.post("/api/chat", headers=auth_headers, json={"message": "hello"})
    assert resp.status_code == 503


def test_chat_sans_token_refuse(client):
    resp = client.post("/api/chat", json={"message": "hello"})
    assert resp.status_code == 403


def test_chat_message_vide_rejete(client, auth_headers):
    resp = client.post("/api/chat", headers=auth_headers, json={"message": ""})
    assert resp.status_code == 422
