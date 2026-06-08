"""API publique des pages SEO longue traîne."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from ..database import get_db
from ..models import Department, LifeSituation, LongTailPage, Right

router = APIRouter(prefix="/api/public/aides", tags=["longtail"])


class LongTailView(BaseModel):
    composite_slug: str
    title: str
    seo_description: str
    content_md: str
    right_slug: str
    situation_slug: str
    department_code: str
    word_count: int
    status: str

    model_config = {"from_attributes": True}


class LongTailIndexEntry(BaseModel):
    composite_slug: str
    title: str
    right_slug: str
    situation_slug: str
    department_code: str

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[LongTailIndexEntry])
def list_pages(
    right: str | None = None,
    situation: str | None = None,
    department: str | None = None,
    limit: int = 200,
    db: DBSession = Depends(get_db),
) -> list[LongTailPage]:
    q = db.query(LongTailPage).filter(LongTailPage.status == "published")
    if right:
        q = q.filter(LongTailPage.right_slug == right)
    if situation:
        q = q.filter(LongTailPage.situation_slug == situation)
    if department:
        q = q.filter(LongTailPage.department_code == department)
    return q.limit(min(limit, 1000)).all()


@router.get("/by-slug/{composite_slug}", response_model=LongTailView)
def get_by_slug(composite_slug: str, db: DBSession = Depends(get_db)) -> LongTailPage:
    page = (
        db.query(LongTailPage).filter_by(composite_slug=composite_slug, status="published").first()
    )
    if page is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page introuvable")
    return page


@router.get("/by-keys/{right_slug}/{situation_slug}/{department_slug}", response_model=LongTailView)
def get_by_keys(
    right_slug: str,
    situation_slug: str,
    department_slug: str,
    db: DBSession = Depends(get_db),
) -> LongTailPage:
    dept = db.query(Department).filter_by(slug=department_slug).first()
    if dept is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Département introuvable")
    page = (
        db.query(LongTailPage)
        .filter_by(
            right_slug=right_slug,
            situation_slug=situation_slug,
            department_code=dept.code,
            status="published",
        )
        .first()
    )
    if page is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page introuvable")
    return page


class TaxonomyResponse(BaseModel):
    rights: list[dict]
    situations: list[dict]
    departments: list[dict]


@router.get("/taxonomy", response_model=TaxonomyResponse)
def taxonomy(db: DBSession = Depends(get_db)) -> TaxonomyResponse:
    rights = [{"slug": r.slug, "name": r.name} for r in db.query(Right).order_by(Right.name).all()]
    situations = [
        {"slug": s.slug, "name": s.name, "profile": s.profile}
        for s in db.query(LifeSituation).order_by(LifeSituation.name).all()
    ]
    departments = [
        {
            "code": d.code,
            "name": d.name,
            "slug": d.slug,
            "prefecture": d.prefecture,
            "region": d.region,
        }
        for d in db.query(Department).order_by(Department.code).all()
    ]
    return TaxonomyResponse(rights=rights, situations=situations, departments=departments)
