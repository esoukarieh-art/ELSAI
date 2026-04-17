"""Service RGPD : purge automatique des sessions expirées + introspection.

Contraintes ELSAI :
  - Minimisation : aucune donnée utilisateur conservée au-delà du strict nécessaire.
  - Droit à l'oubli : déjà servi par `/api/auth/forget` (effet immédiat).
  - Durée de conservation : TTL défini par `settings.session_retention_hours`
    (défaut 24h), au-delà duquel les sessions inactives sont purgées.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session as DBSession

from ..models import Session as UserSession


def purge_expired_sessions(db: DBSession, ttl_hours: int) -> dict:
    """Supprime les sessions (+ cascade conversations/messages) inactives
    depuis plus de `ttl_hours`. Idempotent, sûr à lancer en continu.

    Retourne un rapport : {purged_sessions, cutoff_iso}.
    """
    cutoff = datetime.now(UTC) - timedelta(hours=ttl_hours)
    # SQLAlchemy stocke en naive si colonne DateTime sans tz ; on compare naive.
    cutoff_naive = cutoff.replace(tzinfo=None)

    expired = db.query(UserSession).filter(UserSession.last_activity < cutoff_naive).all()
    count = len(expired)
    for session in expired:
        db.delete(session)
    db.commit()
    return {"purged_sessions": count, "cutoff_iso": cutoff.isoformat()}


def session_footprint(db: DBSession, session_id: str) -> dict:
    """Introspection RGPD : que sait-on sur cette session ?

    Utilisé par `/api/auth/privacy` pour répondre au droit d'accès (RGPD art. 15).
    N'inclut AUCUN contenu de message (on renvoie des compteurs).
    """
    session = db.query(UserSession).filter_by(id=session_id).first()
    if session is None:
        return {"exists": False}

    conv_count = len(session.conversations)
    msg_count = sum(len(c.messages) for c in session.conversations)
    return {
        "exists": True,
        "session_id": session.id,
        "profile": session.profile,
        "created_at": session.created_at.isoformat(),
        "last_activity": session.last_activity.isoformat(),
        "conversation_count": conv_count,
        "message_count": msg_count,
        "data_categories_stored": [
            "profil (adult/minor)",
            "messages échangés (contenu + horodatage)",
            "indicateurs danger détectés",
        ],
        "retention_policy": "Purge automatique après inactivité ; oubli immédiat sur demande",
    }
