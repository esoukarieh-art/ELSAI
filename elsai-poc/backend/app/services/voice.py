"""Interface vocale — Whisper STT + TTS via OpenAI.

Abstrait volontairement derrière deux fonctions pour pouvoir basculer
plus tard vers faster-whisper + Piper en local (cf. éthique ELSAI).
"""
from __future__ import annotations

from io import BytesIO

from openai import OpenAI

from ..config import settings

_STT_MODEL = "whisper-1"
_TTS_MODEL = "tts-1"
_TTS_VOICE = "nova"  # voix chaleureuse, neutre genrée


def _client() -> OpenAI:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY non définie dans .env")
    return OpenAI(api_key=settings.openai_api_key)


def transcribe(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """Audio → texte (français forcé)."""
    buf = BytesIO(audio_bytes)
    buf.name = filename
    result = _client().audio.transcriptions.create(
        model=_STT_MODEL,
        file=buf,
        language="fr",
        response_format="text",
    )
    return str(result).strip()


def synthesize(text: str) -> bytes:
    """Texte → MP3 bytes."""
    if not text.strip():
        raise ValueError("Texte vide")
    response = _client().audio.speech.create(
        model=_TTS_MODEL,
        voice=_TTS_VOICE,
        input=text,
        response_format="mp3",
    )
    return response.read()
