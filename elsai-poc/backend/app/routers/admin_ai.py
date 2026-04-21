"""Endpoints IA d'assistance pour l'éditeur de contenu (P0.4).

Chaque endpoint :
- exige un admin authentifié (tout rôle)
- applique un rate limit soft (60 appels/min par user)
- journalise l'appel dans AuditLog sans stocker le contenu texte
- retourne 503 si la clé Anthropic est absente
"""

from __future__ import annotations

import json
import logging
import time
from collections import deque

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session as DBSession

from ..admin_auth import AdminIdentity, get_admin
from ..config import settings
from ..database import get_db
from ..models import AuditLog
from ..prompts import ARTICLE_TEMPLATES
from ..services import llm

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/ai", tags=["admin-ai"])


# --- Rate limit en mémoire (60 appels / 60s / user) ---------------------------

_RATE_LIMIT_WINDOW = 60.0
_RATE_LIMIT_MAX = 60
_rate_buckets: dict[str, deque[float]] = {}


def _check_rate_limit(user_id: str) -> None:
    now = time.monotonic()
    bucket = _rate_buckets.setdefault(user_id, deque())
    while bucket and now - bucket[0] > _RATE_LIMIT_WINDOW:
        bucket.popleft()
    if len(bucket) >= _RATE_LIMIT_MAX:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Rate limit IA dépassé ({_RATE_LIMIT_MAX}/min)",
        )
    bucket.append(now)


def _require_llm() -> None:
    if not settings.anthropic_api_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "AI non configuré")


def _audit(
    db: DBSession,
    admin: AdminIdentity,
    action: str,
    details: dict,
) -> None:
    payload = {**details, "admin_email": (admin.email or admin.user_id)}
    db.add(
        AuditLog(
            actor="admin",
            action=action,
            target_type="ai_assist",
            target_id=None,
            details=json.dumps(payload, ensure_ascii=False),
        )
    )
    db.commit()


def _run(
    db: DBSession,
    admin: AdminIdentity,
    action: str,
    fn,
    text_length: int,
    **extra,
):
    _require_llm()
    _check_rate_limit(admin.user_id)
    started = time.monotonic()
    try:
        result = fn()
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("AI endpoint %s failed", action)
        _audit(
            db,
            admin,
            action,
            {"text_length": text_length, "ok": False, "error": str(exc)[:200], **extra},
        )
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Appel IA échoué") from exc
    elapsed_ms = int((time.monotonic() - started) * 1000)
    _audit(
        db,
        admin,
        action,
        {"text_length": text_length, "elapsed_ms": elapsed_ms, "ok": True, **extra},
    )
    return result


# --- Schemas ------------------------------------------------------------------


class RewriteIn(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
    instruction: str = Field(min_length=1, max_length=500)


class TextOut(BaseModel):
    text: str


class ShortenIn(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
    target_chars: int | None = Field(default=None, ge=50, le=10000)


class ExpandIn(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
    target_chars: int | None = Field(default=None, ge=100, le=20000)


class TextIn(BaseModel):
    text: str = Field(min_length=1, max_length=20000)


class EditorialCheckIn(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
    audience: str = Field(default="adult", pattern="^(adult|minor|all)$")


class BriefIn(BaseModel):
    keyword: str = Field(min_length=1, max_length=200)
    audience: str = Field(default="adult", pattern="^(adult|minor|all)$")


class SuggestSchemaIn(BaseModel):
    content_mdx: str = Field(min_length=1, max_length=30000)
    title: str = Field(min_length=1, max_length=300)


class SeoMetaIn(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    content_mdx: str = Field(min_length=1, max_length=30000)


class GenerateDraftIn(BaseModel):
    template_key: str = Field(min_length=1, max_length=50)
    title: str = Field(min_length=3, max_length=300)
    keyword: str = Field(default="", max_length=200)
    audience: str = Field(default="adult", pattern="^(adult|minor|b2b|all)$")
    kind: str = Field(default="article", pattern="^(article|help)$")


# --- Endpoints ----------------------------------------------------------------


@router.post("/rewrite", response_model=TextOut)
def post_rewrite(
    body: RewriteIn,
    db: DBSession = Depends(get_db),
    admin: AdminIdentity = Depends(get_admin),
) -> TextOut:
    out = _run(
        db,
        admin,
        "ai.rewrite",
        lambda: llm.assist_rewrite(body.text, body.instruction),
        text_length=len(body.text),
    )
    return TextOut(text=out)


@router.post("/shorten", response_model=TextOut)
def post_shorten(
    body: ShortenIn,
    db: DBSession = Depends(get_db),
    admin: AdminIdentity = Depends(get_admin),
) -> TextOut:
    out = _run(
        db,
        admin,
        "ai.shorten",
        lambda: llm.assist_shorten(body.text, body.target_chars),
        text_length=len(body.text),
        target_chars=body.target_chars,
    )
    return TextOut(text=out)


@router.post("/expand", response_model=TextOut)
def post_expand(
    body: ExpandIn,
    db: DBSession = Depends(get_db),
    admin: AdminIdentity = Depends(get_admin),
) -> TextOut:
    out = _run(
        db,
        admin,
        "ai.expand",
        lambda: llm.assist_expand(body.text, body.target_chars),
        text_length=len(body.text),
        target_chars=body.target_chars,
    )
    return TextOut(text=out)


@router.post("/readability")
def post_readability(
    body: TextIn,
    db: DBSession = Depends(get_db),
    admin: AdminIdentity = Depends(get_admin),
) -> dict:
    return _run(
        db,
        admin,
        "ai.readability",
        lambda: llm.score_readability_fr(body.text),
        text_length=len(body.text),
    )


@router.post("/editorial-check")
def post_editorial_check(
    body: EditorialCheckIn,
    db: DBSession = Depends(get_db),
    admin: AdminIdentity = Depends(get_admin),
) -> dict:
    return _run(
        db,
        admin,
        "ai.editorial_check",
        lambda: llm.editorial_check(body.text, body.audience),
        text_length=len(body.text),
        audience=body.audience,
    )


@router.post("/brief")
def post_brief(
    body: BriefIn,
    db: DBSession = Depends(get_db),
    admin: AdminIdentity = Depends(get_admin),
) -> dict:
    return _run(
        db,
        admin,
        "ai.brief",
        lambda: llm.brief_from_keyword(body.keyword, body.audience),
        text_length=len(body.keyword),
        audience=body.audience,
    )


@router.post("/suggest-schema")
def post_suggest_schema(
    body: SuggestSchemaIn,
    db: DBSession = Depends(get_db),
    admin: AdminIdentity = Depends(get_admin),
) -> dict:
    return _run(
        db,
        admin,
        "ai.suggest_schema",
        lambda: llm.suggest_schema(body.content_mdx, body.title),
        text_length=len(body.content_mdx),
    )


@router.get("/article-templates")
def get_article_templates(
    admin: AdminIdentity = Depends(get_admin),
) -> list[dict]:
    return [
        {"key": t["key"], "label": t["label"], "description": t["description"]}
        for t in ARTICLE_TEMPLATES
    ]


@router.post("/generate-draft")
def post_generate_draft(
    body: GenerateDraftIn,
    db: DBSession = Depends(get_db),
    admin: AdminIdentity = Depends(get_admin),
) -> dict:
    if not any(t["key"] == body.template_key for t in ARTICLE_TEMPLATES):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Template inconnu")
    return _run(
        db,
        admin,
        "ai.generate_draft",
        lambda: llm.generate_article_draft(
            body.template_key, body.title, body.keyword, body.audience, body.kind
        ),
        text_length=len(body.title),
        template_key=body.template_key,
        audience=body.audience,
        kind=body.kind,
    )


@router.post("/generate-draft/stream")
def post_generate_draft_stream(
    body: GenerateDraftIn,
    db: DBSession = Depends(get_db),
    admin: AdminIdentity = Depends(get_admin),
) -> StreamingResponse:
    _require_llm()
    _check_rate_limit(admin.user_id)
    if not any(t["key"] == body.template_key for t in ARTICLE_TEMPLATES):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Template inconnu")
    _audit(
        db,
        admin,
        "ai.generate_draft_stream",
        {
            "text_length": len(body.title),
            "template_key": body.template_key,
            "audience": body.audience,
            "kind": body.kind,
            "streaming": True,
        },
    )
    generator = llm.stream_article_draft(
        body.template_key, body.title, body.keyword, body.audience, body.kind
    )
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/seo-meta")
def post_seo_meta(
    body: SeoMetaIn,
    db: DBSession = Depends(get_db),
    admin: AdminIdentity = Depends(get_admin),
) -> dict:
    return _run(
        db,
        admin,
        "ai.seo_meta",
        lambda: llm.generate_seo_meta(body.title, body.content_mdx),
        text_length=len(body.content_mdx),
    )
