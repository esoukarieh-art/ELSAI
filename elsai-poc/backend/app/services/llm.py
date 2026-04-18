"""Wrapper autour de l'API Anthropic Claude."""

import json
from collections.abc import Iterable

from anthropic import Anthropic
from anthropic.types import MessageParam

from ..config import settings
from ..prompts import get_active, load_file, pick_active


def _client() -> Anthropic:
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY non définie dans .env")
    return Anthropic(api_key=settings.anthropic_api_key)


def _pick_system(profile: str) -> tuple[str, int | None]:
    """Retourne (prompt, version_id) — version_id = None si fichier .md."""
    name = "system_minor" if profile == "minor" else "system_adult"
    picked = pick_active(name)
    if picked is not None:
        return picked[1], picked[0]
    return load_file(name), None


def chat_completion(profile: str, history: Iterable[dict]) -> tuple[str, int | None]:
    """Appelle Claude avec l'historique. Retourne (reply, prompt_version_id)."""
    messages: list[MessageParam] = [{"role": m["role"], "content": m["content"]} for m in history]
    system, version_id = _pick_system(profile)
    response = _client().messages.create(
        model=settings.claude_model,
        max_tokens=1024,
        system=system,
        messages=messages,
    )
    parts = [block.text for block in response.content if hasattr(block, "text")]
    return "".join(parts).strip(), version_id


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
        system=get_active("ocr_explain"),
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
