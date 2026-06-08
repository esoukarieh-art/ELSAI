"""Création de session anonyme + droit à l'oubli + introspection RGPD + comptes optionnels."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from ..auth import SessionDep, create_token
from ..config import settings
from ..database import get_db
from ..models import AuditLog, Conversation, MetricEvent, OptionalAccount
from ..models import Session as UserSession
from ..observability import get_logger
from ..schemas import (
    AccountCreateRequest,
    AccountLoginRequest,
    AccountResponse,
    ForgetResponse,
    SessionCreateRequest,
    SessionResponse,
)
from ..services.account import hash_phrase, verify_phrase
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
    db.add(
        AuditLog(
            actor="user",
            action="forget.executed",
            target_type="session",
            target_id=session.id,
            details=None,  # anonyme : aucun contenu conservé
        )
    )
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


@router.post("/account/create", response_model=AccountResponse)
def create_account(
    payload: AccountCreateRequest,
    session: SessionDep,
    db: DBSession = Depends(get_db),
) -> AccountResponse:
    """Crée un compte optionnel anonyme (pseudo + phrase secrète Argon2).

    Phrase perdue = compte perdu (pas de récupération par email pour préserver
    l'anonymat). Une conversation en cours peut être attachée au compte.
    """
    pseudo = payload.pseudo.strip()
    if len(pseudo) < 3:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Pseudo trop court (3 min)")
    if db.query(OptionalAccount).filter_by(pseudo=pseudo).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Pseudo déjà pris")
    if len(payload.phrase) < 12:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Phrase secrète trop courte (12 min)")

    account = OptionalAccount(pseudo=pseudo, phrase_hash=hash_phrase(payload.phrase))
    db.add(account)
    db.flush()

    if payload.attach_conversation_id:
        conv = (
            db.query(Conversation)
            .filter_by(id=payload.attach_conversation_id, session_id=session.id)
            .first()
        )
        if conv is not None:
            conv.optional_account_id = account.id

    db.add(
        AuditLog(
            actor="user",
            action="account.create",
            target_type="optional_account",
            target_id=account.id,
        )
    )
    db.commit()

    return AccountResponse(
        pseudo=account.pseudo,
        token=create_token(session.id),
        expires_in=settings.session_expire_minutes * 60,
    )


@router.post("/account/login", response_model=AccountResponse)
def login_account(
    payload: AccountLoginRequest,
    db: DBSession = Depends(get_db),
) -> AccountResponse:
    """Reconnexion : pseudo + phrase secrète. Crée une nouvelle session anonyme
    et la rattache aux conversations sauvegardées de ce compte."""
    account = db.query(OptionalAccount).filter_by(pseudo=payload.pseudo.strip()).first()
    if account is None or not verify_phrase(payload.phrase, account.phrase_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Pseudo ou phrase secrète incorrect")

    new_session = UserSession(profile="adult")
    db.add(new_session)
    db.flush()

    convs = db.query(Conversation).filter_by(optional_account_id=account.id).all()
    for conv in convs:
        conv.session_id = new_session.id

    account.last_login_at = datetime.utcnow()
    db.commit()

    return AccountResponse(
        pseudo=account.pseudo,
        token=create_token(new_session.id),
        expires_in=settings.session_expire_minutes * 60,
    )


@router.delete("/account")
def delete_account(
    session: SessionDep,
    db: DBSession = Depends(get_db),
) -> dict:
    """Supprime le compte optionnel rattaché aux conversations de la session."""
    convs = (
        db.query(Conversation)
        .filter(
            Conversation.session_id == session.id,
            Conversation.optional_account_id.isnot(None),
        )
        .all()
    )
    account_ids = {c.optional_account_id for c in convs if c.optional_account_id}
    for conv in convs:
        db.delete(conv)
    deleted = 0
    for aid in account_ids:
        acc = db.get(OptionalAccount, aid)
        if acc:
            db.delete(acc)
            deleted += 1
    db.add(
        AuditLog(
            actor="user",
            action="account.delete",
            target_type="optional_account",
            target_id=session.id,
        )
    )
    db.commit()
    return {"deleted_accounts": deleted, "deleted_conversations": len(convs)}
