"""Wrapper autour de l'API Anthropic Claude."""

import json
from collections.abc import Iterable

from anthropic import Anthropic
from anthropic.types import MessageParam

from ..config import settings
from ..prompts import OCR_EXPLAIN, SYSTEM_ADULT, SYSTEM_MINOR


def _client() -> Anthropic:
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY non définie dans .env")
    return Anthropic(api_key=settings.anthropic_api_key)


def _system_for(profile: str) -> str:
    return SYSTEM_MINOR if profile == "minor" else SYSTEM_ADULT


def chat_completion(profile: str, history: Iterable[dict]) -> str:
    """Appelle Claude avec l'historique complet. `history` = [{role, content}, ...]."""
    messages: list[MessageParam] = [{"role": m["role"], "content": m["content"]} for m in history]
    response = _client().messages.create(
        model=settings.claude_model,
        max_tokens=1024,
        system=_system_for(profile),
        messages=messages,
    )
    parts = [block.text for block in response.content if hasattr(block, "text")]
    return "".join(parts).strip()


def parse_minor_response(text: str) -> tuple[str, bool, dict | None]:
    """Si le prompt mineur a renvoyé du JSON de danger, le parser.
    Retourne (message_final, danger_flag, emergency_cta)."""
    text = text.strip()
    if text.startswith("{"):
        try:
            # Extraire le premier objet JSON valide
            payload = json.loads(text)
            if payload.get("danger"):
                return (
                    payload.get("message", "Vous n'êtes pas seul·e. Appelez le 119."),
                    True,
                    payload.get("emergency_cta", {"label": "Appeler le 119", "phone": "119"}),
                )
        except json.JSONDecodeError:
            pass
    return text, False, None


def explain_document(ocr_text: str) -> dict:
    """Appelle Claude pour expliquer un document OCRisé. Renvoie un dict validé."""
    response = _client().messages.create(
        model=settings.claude_model,
        max_tokens=800,
        system=OCR_EXPLAIN,
        messages=[{"role": "user", "content": ocr_text[:6000]}],
    )
    raw = "".join(b.text for b in response.content if hasattr(b, "text")).strip()
    # Extraire le JSON (Claude peut ajouter du texte autour malgré l'instruction)
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1:
        return {
            "document_type": "Document",
            "explanation": raw or "Le document n'a pas pu être analysé.",
            "suggested_actions": [],
        }
    try:
        return json.loads(raw[start : end + 1])
    except json.JSONDecodeError:
        return {
            "document_type": "Document",
            "explanation": raw,
            "suggested_actions": [],
        }
