"""Endpoints vocaux : STT (Whisper) + TTS."""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session as DBSession

from ..auth import SessionDep
from ..database import get_db
from ..models import MetricEvent
from ..schemas import TranscribeResponse, TTSRequest
from ..services import voice

router = APIRouter(prefix="/api/voice", tags=["voice"])

_AUDIO_TYPES = {
    "audio/webm", "audio/ogg", "audio/mpeg", "audio/mp3",
    "audio/mp4", "audio/m4a", "audio/wav", "audio/x-wav",
}
_MAX_AUDIO_BYTES = 15 * 1024 * 1024  # 15 MB (~5 min)
_MAX_TTS_CHARS = 2000


@router.post("/stt", response_model=TranscribeResponse)
async def speech_to_text(
    session: SessionDep,
    file: UploadFile = File(...),
    db: DBSession = Depends(get_db),
) -> TranscribeResponse:
    if file.content_type and file.content_type not in _AUDIO_TYPES:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"Type audio non supporté ({file.content_type})",
        )
    data = await file.read()
    if len(data) > _MAX_AUDIO_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Audio trop volumineux (max 15 MB)")
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Fichier audio vide")

    try:
        text = voice.transcribe(data, filename=file.filename or "audio.webm")
    except RuntimeError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
    except Exception as exc:  # erreurs API OpenAI
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Transcription échouée : {exc}") from exc

    db.add(MetricEvent(event_type="stt", profile=session.profile))
    db.commit()
    return TranscribeResponse(text=text)


@router.post("/tts")
def text_to_speech(
    payload: TTSRequest,
    session: SessionDep,
    db: DBSession = Depends(get_db),
) -> Response:
    text = payload.text.strip()
    if not text:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Texte vide")
    if len(text) > _MAX_TTS_CHARS:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"Texte trop long (max {_MAX_TTS_CHARS} caractères)")

    try:
        audio = voice.synthesize(text)
    except RuntimeError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Synthèse échouée : {exc}") from exc

    db.add(MetricEvent(event_type="tts", profile=session.profile))
    db.commit()
    return Response(content=audio, media_type="audio/mpeg")
