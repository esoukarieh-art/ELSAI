"""Endpoint conversationnel principal."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from ..auth import SessionDep
from ..database import get_db
from ..models import Conversation, DangerAlert, Department, Message, MetricEvent
from ..observability import get_logger
from ..schemas import ChatRequest, ChatResponse
from ..services import llm, safety

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = get_logger("elsai.chat")


class DepartmentSetRequest(BaseModel):
    conversation_id: str
    department_code: str | None = None  # None = clear


@router.post("/department")
def set_department(
    payload: DepartmentSetRequest,
    session: SessionDep,
    db: DBSession = Depends(get_db),
) -> dict:
    """Opt-in géoloc : l'utilisateur fournit son département pour des contacts locaux."""
    conv = (
        db.query(Conversation)
        .filter_by(id=payload.conversation_id, session_id=session.id)
        .first()
    )
    if conv is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation introuvable")
    if payload.department_code is not None:
        dept = db.query(Department).filter_by(code=payload.department_code).first()
        if dept is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Département inconnu")
        conv.department_code = dept.code
    else:
        conv.department_code = None
    db.commit()
    return {"ok": True, "department_code": conv.department_code}


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

    # 4.bis Contexte géoloc opt-in : injecté en premier message system additionnel
    if conv.department_code:
        dept = db.query(Department).filter_by(code=conv.department_code).first()
        if dept is not None:
            geo_note = (
                f"[Contexte local — confié par l'utilisateur] "
                f"Département : {dept.name} ({dept.code}), préfecture : {dept.prefecture}, "
                f"région : {dept.region}. Quand pertinent, cite la CAF, la MDPH, l'ASE et "
                f"les services locaux de ce département."
            )
            history = [{"role": "user", "content": geo_note}] + history

    # 5. Appel LLM (retourne aussi la version de prompt utilisée pour A/B tracking)
    try:
        raw_reply, prompt_version_id = llm.chat_completion(session.profile, history)
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
    third_party_info = heuristic.get("third_party", False) and not danger

    # 8. Stocker la réponse assistant
    db.add(
        Message(
            conversation_id=conv.id,
            role="assistant",
            content=reply_text,
            danger_flag=danger,
            prompt_version_id=prompt_version_id,
        )
    )
    db.add(MetricEvent(event_type="chat", profile=session.profile))
    if third_party_info:
        # Tiers concerné : on n'arme pas l'alerte admin, on log en info uniquement.
        logger.info(
            "safety.third_party_info",
            profile=session.profile,
            conversation_id=str(conv.id),
            heuristic_signals=heuristic["signals"],
            cta_phone=(emergency_cta or {}).get("phone"),
        )
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
        if heuristic["danger"] and danger_llm:
            alert_source = "both"
        elif danger_llm:
            alert_source = "llm"
        else:
            alert_source = "heuristic"
        db.add(
            DangerAlert(
                session_id=session.id,
                conversation_id=conv.id,
                profile=session.profile,
                source=alert_source,
                excerpt=payload.message[:240],
                status="new",
            )
        )
    db.commit()

    return ChatResponse(
        conversation_id=conv.id,
        reply=reply_text,
        danger_detected=danger,
        emergency_cta=emergency_cta,
        third_party_concern=third_party_info,
    )
