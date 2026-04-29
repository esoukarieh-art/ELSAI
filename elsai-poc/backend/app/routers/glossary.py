"""API publique du glossaire — sigles et termes du droit social."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from ..database import get_db
from ..models import GlossaryTerm

router = APIRouter(prefix="/api/public/glossary", tags=["glossary"])


class GlossaryView(BaseModel):
    slug: str
    sigle: str
    full_name: str
    definition_md: str

    model_config = {"from_attributes": True}


class GlossaryIndexEntry(BaseModel):
    slug: str
    sigle: str
    full_name: str

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[GlossaryIndexEntry])
def list_terms(db: DBSession = Depends(get_db)) -> list[GlossaryTerm]:
    return db.query(GlossaryTerm).order_by(GlossaryTerm.sigle).all()


@router.get("/{slug}", response_model=GlossaryView)
def get_term(slug: str, db: DBSession = Depends(get_db)) -> GlossaryTerm:
    term = db.query(GlossaryTerm).filter_by(slug=slug).first()
    if term is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sigle inconnu")
    return term
