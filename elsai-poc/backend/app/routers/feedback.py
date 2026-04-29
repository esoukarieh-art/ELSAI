"""Feedback fin de session : ai-je répondu à votre question ?"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from ..auth import SessionDep
from ..database import get_db
from ..models import Conversation, Feedback
from ..observability import get_logger
from ..schemas import FeedbackRequest, FeedbackResponse

router = APIRouter(prefix="/api/chat", tags=["feedback"])
logger = get_logger("elsai.feedback")


@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(
    payload: FeedbackRequest,
    session: SessionDep,
    db: DBSession = Depends(get_db),
) -> FeedbackResponse:
    conv = (
        db.query(Conversation)
        .filter_by(id=payload.conversation_id, session_id=session.id)
        .first()
    )
    if conv is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation introuvable")

    fb = Feedback(
        conversation_id=conv.id,
        helpful=payload.helpful,
        comment=(payload.comment or "").strip() or None,
        profile=session.profile,
    )
    db.add(fb)
    db.commit()
    logger.info(
        "feedback.submitted",
        extra={"conversation_id": conv.id, "helpful": payload.helpful},
    )
    return FeedbackResponse(ok=True)
