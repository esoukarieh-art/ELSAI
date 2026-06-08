"""Export PDF d'un plan d'action — non stocké côté serveur."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session as DBSession

from ..auth import SessionDep
from ..database import get_db
from ..models import Conversation
from ..observability import get_logger
from ..schemas import ExportPdfRequest
from ..services.pdf_action_plan import extract_action_plan, render_pdf

router = APIRouter(prefix="/api/chat", tags=["export"])
logger = get_logger("elsai.export")


@router.post("/export-pdf")
def export_pdf(
    payload: ExportPdfRequest,
    session: SessionDep,
    db: DBSession = Depends(get_db),
):
    conv = (
        db.query(Conversation).filter_by(id=payload.conversation_id, session_id=session.id).first()
    )
    if conv is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation introuvable")

    try:
        plan = extract_action_plan(db, conv.id)
        pdf_bytes = render_pdf(plan)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc

    logger.info("export.pdf_generated", extra={"conversation_id": conv.id})
    import io

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="plan-action-elsai.pdf"',
        },
    )
