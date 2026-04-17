"""Endpoint conversationnel principal."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from ..auth import SessionDep
from ..database import get_db
from ..models import Conversation, Message, MetricEvent
from ..observability import get_logger
from ..schemas import ChatRequest, ChatResponse
from ..services import llm, safety

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = get_logger("elsai.chat")


@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    session: SessionDep,
    db: DBSession = Depends(get_db),
) -> ChatResponse:
    # 1. Récupérer ou créer la conversation
    if payload.conversation_id:
        conv = (
            db.query(Conversation)
            .filter_by(id=payload.conversation_id, session_id=session.id)
            .first()
        )
        if conv is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation introuvable")
    else:
        conv = Conversation(session_id=session.id)
        db.add(conv)
        db.flush()

    # 2. Pré-scan heuristique (filet de sécurité)
    heuristic = safety.scan(payload.message, profile=session.profile)

    # 3. Stocker le message utilisateur
    db.add(
        Message(
            conversation_id=conv.id,
            role="user",
            content=payload.message,
            danger_flag=heuristic["danger"],
        )
    )
    db.flush()

    # 4. Construire l'historique pour Claude
    history = [
        {"role": m.role, "content": m.content}
        for m in db.query(Message)
        .filter_by(conversation_id=conv.id)
        .order_by(Message.created_at)
        .all()
    ]

    # 5. Appel LLM
    try:
        raw_reply = llm.chat_completion(session.profile, history)
    except RuntimeError as exc:
        logger.error(
            "llm_unavailable",
            profile=session.profile,
            conversation_id=str(conv.id),
            error=str(exc),
        )
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc

    # 6. Post-traitement : détection danger côté LLM (mineur uniquement)
    if session.profile == "minor":
        reply_text, danger_llm, cta = llm.parse_minor_response(raw_reply)
    else:
        reply_text, danger_llm, cta = raw_reply, False, None

    # 7. Fusionner avec heuristique
    danger = heuristic["danger"] or danger_llm
    emergency_cta = cta or heuristic["cta"]

    # 8. Stocker la réponse assistant
    db.add(
        Message(
            conversation_id=conv.id,
            role="assistant",
            content=reply_text,
            danger_flag=danger,
        )
    )
    db.add(MetricEvent(event_type="chat", profile=session.profile))
    if danger:
        db.add(MetricEvent(event_type="danger", profile=session.profile))
        # Event safety loggé SANS contenu utilisateur (anonymat + audit légal)
        logger.warning(
            "safety.danger_detected",
            profile=session.profile,
            conversation_id=str(conv.id),
            heuristic_signals=heuristic["signals"],
            llm_flag=danger_llm,
            cta_phone=(emergency_cta or {}).get("phone"),
        )
    db.commit()

    return ChatResponse(
        conversation_id=conv.id,
        reply=reply_text,
        danger_detected=danger,
        emergency_cta=emergency_cta,
    )
