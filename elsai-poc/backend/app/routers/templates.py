"""Bibliothèque de courriers types — CRUD admin + génération IA."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session as DBSession

from ..admin_auth import get_admin
from ..config import settings
from ..database import get_db
from ..models import LetterTemplate

router = APIRouter(
    prefix="/api/admin/letter-templates",
    tags=["letter-templates"],
    dependencies=[Depends(get_admin)],
)


class TemplateIn(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category: str = Field("general", max_length=64)
    body: str = Field(..., min_length=1)


class TemplateOut(BaseModel):
    id: str
    title: str
    category: str
    body: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=2000)
    category: str = Field("general", max_length=64)


class GenerateResponse(BaseModel):
    title: str
    category: str
    body: str


@router.get("", response_model=list[TemplateOut])
def list_templates(db: DBSession = Depends(get_db)) -> list[LetterTemplate]:
    return db.query(LetterTemplate).order_by(LetterTemplate.updated_at.desc()).all()


@router.post("", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
def create_template(payload: TemplateIn, db: DBSession = Depends(get_db)) -> LetterTemplate:
    tpl = LetterTemplate(title=payload.title, category=payload.category, body=payload.body)
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl


@router.put("/{template_id}", response_model=TemplateOut)
def update_template(
    template_id: str, payload: TemplateIn, db: DBSession = Depends(get_db)
) -> LetterTemplate:
    tpl = db.get(LetterTemplate, template_id)
    if not tpl:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Modèle introuvable")
    tpl.title = payload.title
    tpl.category = payload.category
    tpl.body = payload.body
    db.commit()
    db.refresh(tpl)
    return tpl


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(template_id: str, db: DBSession = Depends(get_db)) -> None:
    tpl = db.get(LetterTemplate, template_id)
    if not tpl:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Modèle introuvable")
    db.delete(tpl)
    db.commit()


@router.post("/generate", response_model=GenerateResponse)
def generate_template(payload: GenerateRequest) -> GenerateResponse:
    """Génère un brouillon de courrier type via Claude à partir d'une instruction."""
    if not settings.anthropic_api_key:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Génération IA indisponible : ANTHROPIC_API_KEY non configurée.",
        )

    from anthropic import Anthropic

    system = (
        "Tu es un rédacteur spécialisé dans les courriers administratifs français destinés à "
        "des particuliers. Génère un MODÈLE de courrier type réutilisable, rédigé en français "
        "clair, avec des champs variables entre crochets (ex : [Nom], [Adresse], [Date]). "
        "Réponds STRICTEMENT en JSON valide, sans texte autour, au format : "
        '{"title": "...", "body": "..."} — le body doit contenir le courrier complet '
        "(en-tête, objet, corps, formule de politesse, signature)."
    )

    client = Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model=settings.claude_model,
        max_tokens=1500,
        system=system,
        messages=[{"role": "user", "content": payload.prompt}],
    )
    raw = "".join(b.text for b in response.content if hasattr(b, "text")).strip()

    import json

    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Réponse IA non exploitable")
    try:
        data = json.loads(raw[start : end + 1])
    except json.JSONDecodeError as err:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "JSON IA invalide") from err

    return GenerateResponse(
        title=str(data.get("title", "Courrier type")).strip()[:200],
        category=payload.category,
        body=str(data.get("body", "")).strip(),
    )
