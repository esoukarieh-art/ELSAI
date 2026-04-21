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


def _llm_text(system: str, user: str, max_tokens: int = 1024) -> str:
    """Appel Claude simple, réponse texte brut."""
    response = _client().messages.create(
        model=settings.claude_model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
        timeout=30.0,
    )
    parts = [b.text for b in response.content if hasattr(b, "text")]
    return "".join(parts).strip()


def _llm_json(system: str, user: str, max_tokens: int = 1500) -> dict:
    """Appel Claude avec extraction JSON stricte. Lève ValueError si parse impossible."""
    system_json = (
        system
        + "\n\nIMPORTANT : réponds UNIQUEMENT avec un objet JSON valide, sans texte ni fences markdown."
    )
    raw = _llm_text(system_json, user, max_tokens=max_tokens)
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


def assist_rewrite(text: str, instruction: str) -> str:
    system = (
        "Tu es un·e rédacteur·rice éditorial·e aide aux publics précaires. "
        "Tu reformules un texte selon l'instruction donnée, en français accessible (niveau A2-B1), "
        "ton empathique et franc, sans jargon administratif inutile. "
        "Réponds UNIQUEMENT avec le texte reformulé, sans commentaire ni préambule."
    )
    user = f"Instruction : {instruction}\n\nTexte à reformuler :\n{text}"
    return _llm_text(system, user, max_tokens=1500)


def assist_shorten(text: str, target_chars: int | None = None) -> str:
    cible = f"environ {target_chars} caractères" if target_chars else "le plus court possible sans perdre l'essentiel"
    system = (
        "Tu raccourcis un texte français pour un public en précarité sociale (niveau A2-B1). "
        "Garde les informations utiles et actionnables, retire le superflu. "
        "Réponds UNIQUEMENT avec le texte raccourci."
    )
    return _llm_text(system, f"Cible : {cible}.\n\nTexte :\n{text}", max_tokens=1200)


def assist_expand(text: str, target_chars: int | None = None) -> str:
    cible = f"environ {target_chars} caractères" if target_chars else "environ 2x la longueur initiale"
    system = (
        "Tu développes un texte français pour un public en précarité sociale (niveau A2-B1). "
        "Ajoute des exemples concrets, des précisions utiles, sans inventer de faits ni promettre de résultats. "
        "Ton empathique et franc. Réponds UNIQUEMENT avec le texte développé."
    )
    return _llm_text(system, f"Cible : {cible}.\n\nTexte :\n{text}", max_tokens=2000)


def score_readability_fr(text: str) -> dict:
    system = (
        "Tu évalues la lisibilité d'un texte français pour un lectorat en précarité sociale (niveau A2-B1 visé). "
        "Retourne JSON strict avec : "
        "score (int 0-100, 100=très lisible), "
        "level (A2|B1|B2|C1|C2), "
        "issues (list[str] problèmes détectés : jargon, phrases trop longues, passif, etc.), "
        "suggestions (list[str] recommandations concrètes pour simplifier)."
    )
    try:
        return _llm_json(system, text, max_tokens=1200)
    except ValueError as exc:
        logger.warning("score_readability_fr parse failed: %s", exc)
        return {"score": 0, "level": "B2", "issues": ["Analyse indisponible"], "suggestions": []}


def editorial_check(text: str, audience: str) -> dict:
    system = (
        "Tu es relecteur·rice éditorial·e ELSAI (assistant social IA pour publics précaires). "
        "Vérifie le texte fourni selon la charte ELSAI : anti-faux-espoirs, ton empathique et franc, "
        "pas de promesse fausse sur les droits, pas de bureaucratie jugeante. "
        f"Audience : {audience}. "
        "Si audience=minor, vérifie que toute mention de danger renvoie au 119. "
        "Retourne JSON strict : "
        "ok (bool — true si aucun flag bloquant), "
        "flags (list de {type, excerpt, suggestion}) où type ∈ "
        "['faux_espoir' (promesse fausse), 'barème_daté' (montant sans date), "
        "'ton_hors_charte' (bureaucratique/jugeant), 'danger_mineur_non_escaladé']."
    )
    try:
        return _llm_json(system, text, max_tokens=2000)
    except ValueError as exc:
        logger.warning("editorial_check parse failed: %s", exc)
        return {"ok": False, "flags": [{"type": "ton_hors_charte", "excerpt": "", "suggestion": "Analyse indisponible"}]}


def brief_from_keyword(keyword: str, audience: str) -> dict:
    system = (
        "Tu es stratège éditorial·e SEO pour ELSAI (assistant social numérique, public précaire FR). "
        "Produis un brief structuré pour un article ciblant un mot-clé donné. "
        f"Audience : {audience}. "
        "Retourne JSON strict : "
        "outline (list de {h2: str, h3s: list[str]}), "
        "faq (list de {q: str, a: str}, 4-6 questions pertinentes), "
        "target_personas (list[str] profils utilisateurs visés), "
        "internal_links_suggestions (list[str] sujets d'articles liés à créer ou lier), "
        "suggested_cta_keys (list[str] clés de CTA : ex 'rsa-simulation', 'rdv-assistante-sociale')."
    )
    return _llm_json(system, f"Mot-clé cible : {keyword}", max_tokens=2500)


def suggest_schema(content_mdx: str, title: str) -> dict:
    system = (
        "Tu proposes un schéma Schema.org optimal pour un contenu web. "
        "Types possibles : Article, HowTo, FAQPage, GovernmentService. "
        "Retourne JSON strict : "
        "type (un des quatre), "
        "extra (dict avec les champs Schema.org spécifiques au type choisi), "
        "justification (str courte expliquant le choix)."
    )
    user = f"Titre : {title}\n\nContenu MDX :\n{content_mdx[:6000]}"
    return _llm_json(system, user, max_tokens=1500)


def generate_seo_meta(title: str, content_mdx: str) -> dict:
    system = (
        "Tu rédiges les métadonnées SEO d'un article FR. "
        "Retourne JSON strict : "
        "seo_title (≤60 caractères, percutant, inclut le mot-clé principal), "
        "seo_description (≤155 caractères, incitatif, ton empathique), "
        "og_image_prompt (str, prompt descriptif pour générer une image d'illustration — pas de texte dans l'image)."
    )
    user = f"Titre : {title}\n\nContenu :\n{content_mdx[:5000]}"
    return _llm_json(system, user, max_tokens=800)
