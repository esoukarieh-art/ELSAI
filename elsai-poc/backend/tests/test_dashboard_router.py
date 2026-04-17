"""Tests du router /api/dashboard/metrics — agrégats anonymes."""
from datetime import datetime, timedelta, timezone

from app.models import MetricEvent, Session as UserSession


def test_metrics_dashboard_vide(client):
    resp = client.get("/api/dashboard/metrics")
    assert resp.status_code == 200
    body = resp.json()
    assert body == {
        "total_sessions": 0,
        "active_last_hour": 0,
        "chats_total": 0,
        "ocr_total": 0,
        "danger_detections_total": 0,
        "forget_requests_total": 0,
        "profile_breakdown": {},
    }


def test_metrics_dashboard_aggrege_evenements(client, db_session):
    # 2 adultes actifs maintenant, 1 mineur actif il y a 2h (hors fenêtre)
    now = datetime.now(timezone.utc)
    old = now - timedelta(hours=2)
    db_session.add_all([
        UserSession(profile="adult", last_activity=now),
        UserSession(profile="adult", last_activity=now),
        UserSession(profile="minor", last_activity=old),
    ])
    db_session.add_all([
        MetricEvent(event_type="chat", profile="adult"),
        MetricEvent(event_type="chat", profile="minor"),
        MetricEvent(event_type="ocr", profile="adult"),
        MetricEvent(event_type="danger", profile="minor"),
        MetricEvent(event_type="forget", profile="adult"),
    ])
    db_session.commit()

    resp = client.get("/api/dashboard/metrics")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_sessions"] == 3
    assert body["active_last_hour"] == 2  # le mineur est hors fenêtre 1h
    assert body["chats_total"] == 2
    assert body["ocr_total"] == 1
    assert body["danger_detections_total"] == 1
    assert body["forget_requests_total"] == 1
    assert body["profile_breakdown"] == {"adult": 2, "minor": 1}


def test_metrics_dashboard_accessible_sans_auth(client):
    """Constat : le dashboard n'a pas de garde. Documenté ici — roadmap #10
    prévoit d'ajouter un token admin."""
    resp = client.get("/api/dashboard/metrics")
    assert resp.status_code == 200
