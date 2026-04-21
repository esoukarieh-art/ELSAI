"""Wrapper autour de l'API Anthropic Claude."""

import json
import logging
from collections.abc import Iterable

from anthropic import Anthropic
from anthropic.types import MessageParam

from ..config import settings
from ..prompts import get_active, load_file, pick_active

logger = logging.getLogger(__name__)


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
    # Claude enrobe parfois le JSON dans des fences markdown malgré l'instruction
    candidate = text
    if candidate.startswith("```"):
        candidate = candidate.split("\n", 1)[1] if "\n" in candidate else candidate[3:]
        if candidate.endswith("```"):
            candidate = candidate[:-3]
        candidate = candidate.strip()
    # Extraire le premier objet JSON présent dans la réponse
    start, end = candidate.find("{"), candidate.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            payload = json.loads(candidate[start : end + 1])
            if isinstance(payload, dict) and payload.get("danger"):
                return (
                    payload.get("message", "Vous n'êtes pas seul·e. Appelez le 119."),
                    True,
                    payload.get("emergency_cta", {"label": "Appeler le 119", "phone": "119"}),
                )
            if isinstance(payload, dict) and "message" in payload:
                # Réponse JSON sans danger : extraire le message propre
                return payload["message"], False, None
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


# --- Helpers assistant éditeur de contenu -------------------------------------


def _llm_text(system: str, user: str, max_tokens: int = 1024, timeout: float = 30.0) -> str:
    """Appel Claude simple, réponse texte brut."""
    response = _client().messages.create(
        model=settings.claude_model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
        timeout=timeout,
    )
    parts = [b.text for b in response.content if hasattr(b, "text")]
    return "".join(parts).strip()


def _llm_json(system: str, user: str, max_tokens: int = 1500, timeout: float = 30.0) -> dict:
    """Appel Claude avec extraction JSON stricte. Lève ValueError si parse impossible."""
    system_json = (
        system
        + "\n\nIMPORTANT : réponds UNIQUEMENT avec un objet JSON valide, sans texte ni fences markdown."
    )
    raw = _llm_text(system_json, user, max_tokens=max_tokens, timeout=timeout)
    candidate = raw
    if candidate.startswith("```"):
        candidate = candidate.split("\n", 1)[1] if "\n" in candidate else candidate[3:]
        if candidate.endswith("```"):
            candidate = candidate[:-3]
        candidate = candidate.strip()
    start, end = candidate.find("{"), candidate.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"Réponse LLM non-JSON : {raw[:200]}")
    try:
        return json.loads(candidate[start : end + 1])
    except json.JSONDecodeError as exc:
        raise ValueError(f"JSON invalide : {exc}") from exc


def _ai_prompt(name: str, **vars: str) -> str:
    """Charge un prompt AI-assist (override DB ou fichier .md) et substitue les variables."""
    tpl = get_active(name)
    for key, value in vars.items():
        tpl = tpl.replace("{" + key + "}", value)
    return tpl


def assist_rewrite(text: str, instruction: str) -> str:
    system = _ai_prompt("ai_rewrite")
    user = f"Instruction : {instruction}\n\nTexte à reformuler :\n{text}"
    return _llm_text(system, user, max_tokens=1500)


def assist_shorten(text: str, target_chars: int | None = None) -> str:
    cible = f"environ {target_chars} caractères" if target_chars else "le plus court possible sans perdre l'essentiel"
    system = _ai_prompt("ai_shorten")
    return _llm_text(system, f"Cible : {cible}.\n\nTexte :\n{text}", max_tokens=1200)


def assist_expand(text: str, target_chars: int | None = None) -> str:
    cible = f"environ {target_chars} caractères" if target_chars else "environ 2x la longueur initiale"
    system = _ai_prompt("ai_expand")
    return _llm_text(system, f"Cible : {cible}.\n\nTexte :\n{text}", max_tokens=2000)


def score_readability_fr(text: str) -> dict:
    system = _ai_prompt("ai_readability")
    try:
        return _llm_json(system, text, max_tokens=1200)
    except ValueError as exc:
        logger.warning("score_readability_fr parse failed: %s", exc)
        return {"score": 0, "level": "B2", "issues": ["Analyse indisponible"], "suggestions": []}


def editorial_check(text: str, audience: str) -> dict:
    system = _ai_prompt("ai_editorial_check", audience=audience)
    try:
        return _llm_json(system, text, max_tokens=2000)
    except ValueError as exc:
        logger.warning("editorial_check parse failed: %s", exc)
        return {"ok": False, "flags": [{"type": "ton_hors_charte", "excerpt": "", "suggestion": "Analyse indisponible"}]}


def brief_from_keyword(keyword: str, audience: str) -> dict:
    system = _ai_prompt("ai_brief", audience=audience)
    return _llm_json(system, f"Mot-clé cible : {keyword}", max_tokens=2500)


def suggest_schema(content_mdx: str, title: str) -> dict:
    system = _ai_prompt("ai_suggest_schema")
    user = f"Titre : {title}\n\nContenu MDX :\n{content_mdx[:6000]}"
    return _llm_json(system, user, max_tokens=1500)


def generate_seo_meta(title: str, content_mdx: str) -> dict:
    system = _ai_prompt("ai_seo_meta")
    user = f"Titre : {title}\n\nContenu :\n{content_mdx[:5000]}"
    return _llm_json(system, user, max_tokens=800)


def generate_article_draft(
    template_key: str,
    title: str,
    keyword: str,
    audience: str,
    kind: str,
) -> dict:
    """Génère un brouillon complet via un template de la bibliothèque."""
    from ..prompts import ARTICLE_TEMPLATES

    tpl = next((t for t in ARTICLE_TEMPLATES if t["key"] == template_key), None)
    if tpl is None:
        raise ValueError(f"Template inconnu : {template_key}")
    system = _ai_prompt(
        tpl["prompt"],
        title=title,
        keyword=keyword or title,
        audience=audience,
        kind=kind,
    )
    user = f"Génère l'article pour : {title}"
    return _llm_json(system, user, max_tokens=4000, timeout=180.0)


def _parse_json_from_stream(raw: str) -> dict:
    """Extrait l'objet JSON depuis une réponse LLM potentiellement entourée de fences."""
    candidate = raw.strip()
    if candidate.startswith("```"):
        candidate = candidate.split("\n", 1)[1] if "\n" in candidate else candidate[3:]
        if candidate.endswith("```"):
            candidate = candidate[:-3]
        candidate = candidate.strip()
    start, end = candidate.find("{"), candidate.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("Réponse non-JSON")
    return json.loads(candidate[start : end + 1])


def stream_article_draft(
    template_key: str,
    title: str,
    keyword: str,
    audience: str,
    kind: str,
):
    """Generator SSE : yield des events 'chunk' puis 'done' (ou 'error')."""
    from ..prompts import ARTICLE_TEMPLATES

    def sse(payload: dict) -> str:
        return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

    tpl = next((t for t in ARTICLE_TEMPLATES if t["key"] == template_key), None)
    if tpl is None:
        yield sse({"type": "error", "message": f"Template inconnu : {template_key}"})
        return

    system = _ai_prompt(
        tpl["prompt"],
        title=title,
        keyword=keyword or title,
        audience=audience,
        kind=kind,
    )
    system_json = (
        system
        + "\n\nIMPORTANT : réponds UNIQUEMENT avec un objet JSON valide, sans texte ni fences markdown."
    )
    user = f"Génère l'article pour : {title}"

    yield sse({"type": "start", "template": template_key})
    parts: list[str] = []
    try:
        with _client().messages.stream(
            model=settings.claude_model,
            max_tokens=4000,
            system=system_json,
            messages=[{"role": "user", "content": user}],
            timeout=180.0,
        ) as stream:
            for text in stream.text_stream:
                if not text:
                    continue
                parts.append(text)
                yield sse({"type": "chunk", "text": text})
    except Exception as exc:
        logger.exception("stream_article_draft LLM failed")
        yield sse({"type": "error", "message": f"Appel IA échoué : {str(exc)[:200]}"})
        return

    raw = "".join(parts)
    try:
        parsed = _parse_json_from_stream(raw)
    except (ValueError, json.JSONDecodeError) as exc:
        logger.warning("stream_article_draft JSON parse failed: %s", exc)
        yield sse({"type": "error", "message": f"JSON invalide : {str(exc)[:200]}"})
        return

    yield sse({"type": "done", "draft": parsed})
