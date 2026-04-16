"""OCR + explication de documents administratifs."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session as DBSession

from ..auth import SessionDep
from ..database import get_db
from ..models import MetricEvent
from ..schemas import DocumentAnalyzeResponse
from ..services import llm, ocr

router = APIRouter(prefix="/api/documents", tags=["documents"])

_ALLOWED_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
_MAX_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/analyze", response_model=DocumentAnalyzeResponse)
async def analyze_document(
    session: SessionDep,
    file: UploadFile = File(...),
    db: DBSession = Depends(get_db),
) -> DocumentAnalyzeResponse:
    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"Type non supporté ({file.content_type}). Utilisez PNG/JPG/WEBP.",
        )

    data = await file.read()
    if len(data) > _MAX_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Image trop volumineuse (max 10 MB)")

    # 1. OCR (le binaire n'est PAS stocké — droit à l'oubli)
    try:
        text = ocr.extract_text(data)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc

    if not text:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Aucun texte détecté dans l'image")

    # 2. Explication via Claude
    try:
        result = llm.explain_document(text)
    except RuntimeError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc

    db.add(MetricEvent(event_type="ocr", profile=session.profile))
    db.commit()

    return DocumentAnalyzeResponse(
        ocr_text=text,
        explanation=result.get("explanation", ""),
        suggested_actions=result.get("suggested_actions", []),
    )
