"""Création de session anonyme + droit à l'oubli + introspection RGPD."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession

from ..auth import SessionDep, create_token
from ..config import settings
from ..database import get_db
from ..models import MetricEvent
from ..models import Session as UserSession
from ..observability import get_logger
from ..schemas import ForgetResponse, SessionCreateRequest, SessionResponse
from ..services.privacy import session_footprint

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = get_logger("elsai.auth")


@router.post("/session", response_model=SessionResponse)
def create_session(
    payload: SessionCreateRequest,
    db: DBSession = Depends(get_db),
) -> SessionResponse:
    session = UserSession(profile=payload.profile)
    db.add(session)
    db.commit()
    db.refresh(session)

    return SessionResponse(
        session_id=session.id,
        token=create_token(session.id),
        profile=session.profile,  # type: ignore[arg-type]
        expires_in=settings.session_expire_minutes * 60,
    )


@router.delete("/forget", response_model=ForgetResponse)
def forget_me(
    session: SessionDep,
    db: DBSession = Depends(get_db),
) -> ForgetResponse:
    """Droit à l'oubli instantané : supprime toutes les conversations/messages
    de la session (la session elle-même est conservée pour le token en cours).
    """
    conv_count = len(session.conversations)
    msg_count = sum(len(c.messages) for c in session.conversations)

    for conv in list(session.conversations):
        db.delete(conv)

    db.add(MetricEvent(event_type="forget", profile=session.profile))
    db.commit()

    # Audit RGPD : trace anonyme de l'exercice du droit à l'oubli
    logger.info(
        "privacy.forget_executed",
        session_id=session.id,
        profile=session.profile,
        deleted_conversations=conv_count,
        deleted_messages=msg_count,
    )

    return ForgetResponse(
        deleted_conversations=conv_count,
        deleted_messages=msg_count,
    )


@router.get("/privacy")
def privacy(
    session: SessionDep,
    db: DBSession = Depends(get_db),
) -> dict:
    """Droit d'accès RGPD (art. 15) : renvoie la liste des données stockées
    sur la session courante (compteurs uniquement — jamais le contenu brut)."""
    return session_footprint(db, session.id)
