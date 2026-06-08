"""Admin SEO : pilotage de la génération longue traîne et supervision qualité."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

from ..admin_auth import CONTENT_ROLES, PUBLISH_ROLES, AdminIdentity, get_admin, require_role
from ..database import get_db
from ..models import Department, LifeSituation, LongTailPage, Right
from ..observability import get_logger
from ..services import longtail

router = APIRouter(prefix="/api/admin/seo", tags=["admin-seo"])
logger = get_logger("elsai.admin_seo")


# ---------------- Schemas ----------------


class LongTailRow(BaseModel):
    id: str
    composite_slug: str
    right_slug: str
    situation_slug: str
    department_code: str
    title: str
    word_count: int
    status: str
    last_generated_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LongTailDetail(LongTailRow):
    seo_description: str
    content_md: str


class StatsResponse(BaseModel):
    total: int
    by_status: dict[str, int]
    avg_word_count: int
    rights_count: int
    situations_count: int
    departments_count: int


class GenerateBatchRequest(BaseModel):
    combinations: list[tuple[str, str, str]] = Field(
        ...,
        description="Liste de (right_slug, situation_slug, department_code).",
        min_length=1,
        max_length=200,
    )
    publish: bool = False


class GenerateBatchResponse(BaseModel):
    generated: int
    skipped: int
    pages: list[LongTailRow]


class StatusUpdateRequest(BaseModel):
    status: str  # "draft" | "published" | "noindex"


class LongTailUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    seo_description: str | None = Field(default=None, min_length=1, max_length=400)
    content_md: str | None = Field(default=None, min_length=1)


# ---------------- Endpoints ----------------


@router.get(
    "/stats",
    response_model=StatsResponse,
    dependencies=[Depends(require_role(*CONTENT_ROLES))],
)
def stats(db: DBSession = Depends(get_db)) -> StatsResponse:
    rows = (
        db.query(
            LongTailPage.status, func.count(LongTailPage.id), func.avg(LongTailPage.word_count)
        )
        .group_by(LongTailPage.status)
        .all()
    )
    by_status: dict[str, int] = {}
    total = 0
    weighted_words = 0.0
    for st, cnt, avg in rows:
        by_status[st] = int(cnt)
        total += int(cnt)
        weighted_words += float(avg or 0) * int(cnt)
    avg_words = int(weighted_words / total) if total else 0

    return StatsResponse(
        total=total,
        by_status=by_status,
        avg_word_count=avg_words,
        rights_count=db.query(Right).count(),
        situations_count=db.query(LifeSituation).count(),
        departments_count=db.query(Department).count(),
    )


@router.get(
    "/longtail",
    response_model=list[LongTailRow],
    dependencies=[Depends(require_role(*CONTENT_ROLES))],
)
def list_pages(
    right: str | None = None,
    situation: str | None = None,
    department: str | None = None,
    page_status: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: DBSession = Depends(get_db),
) -> list[LongTailPage]:
    q = db.query(LongTailPage)
    if right:
        q = q.filter(LongTailPage.right_slug == right)
    if situation:
        q = q.filter(LongTailPage.situation_slug == situation)
    if department:
        q = q.filter(LongTailPage.department_code == department)
    if page_status:
        q = q.filter(LongTailPage.status == page_status)
    return (
        q.order_by(LongTailPage.updated_at.desc())
        .offset(max(0, offset))
        .limit(min(limit, 500))
        .all()
    )


@router.get(
    "/longtail/{page_id}",
    response_model=LongTailDetail,
    dependencies=[Depends(require_role(*CONTENT_ROLES))],
)
def get_page(page_id: str, db: DBSession = Depends(get_db)) -> LongTailPage:
    page = db.get(LongTailPage, page_id)
    if page is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page introuvable")
    return page


@router.post(
    "/longtail/generate",
    response_model=GenerateBatchResponse,
    dependencies=[Depends(require_role(*CONTENT_ROLES))],
)
def generate(
    payload: GenerateBatchRequest,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> GenerateBatchResponse:
    pages = longtail.generate_batch(db, payload.combinations, publish=payload.publish)
    skipped = len(payload.combinations) - len(pages)
    logger.info(
        "admin.seo.batch_generated",
        extra={
            "admin_email": admin.email,
            "requested": len(payload.combinations),
            "generated": len(pages),
            "skipped": skipped,
            "publish": payload.publish,
        },
    )
    return GenerateBatchResponse(
        generated=len(pages),
        skipped=skipped,
        pages=[LongTailRow.model_validate(p) for p in pages],
    )


@router.put(
    "/longtail/{page_id}",
    response_model=LongTailDetail,
    dependencies=[Depends(require_role(*CONTENT_ROLES))],
)
def update_page(
    page_id: str,
    payload: LongTailUpdateRequest,
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> LongTailPage:
    page = db.get(LongTailPage, page_id)
    if page is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page introuvable")
    changed: list[str] = []
    if payload.title is not None and payload.title != page.title:
        page.title = payload.title
        changed.append("title")
    if payload.seo_description is not None and payload.seo_description != page.seo_description:
        page.seo_description = payload.seo_description
        changed.append("seo_description")
    if payload.content_md is not None and payload.content_md != page.content_md:
        page.content_md = payload.content_md
        page.word_count = len(payload.content_md.split())
        changed.append("content_md")
    if changed:
        db.commit()
        db.refresh(page)
        logger.info(
            "admin.seo.longtail_updated",
            extra={
                "admin_email": admin.email,
                "page_id": page_id,
                "fields": changed,
                "word_count": page.word_count,
            },
        )
    return page


@router.patch(
    "/longtail/{page_id}/status",
    response_model=LongTailRow,
    dependencies=[Depends(require_role(*PUBLISH_ROLES))],
)
def update_status(
    page_id: str,
    payload: StatusUpdateRequest,
    db: DBSession = Depends(get_db),
) -> LongTailPage:
    if payload.status not in {"draft", "published", "noindex"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Statut invalide")
    page = db.get(LongTailPage, page_id)
    if page is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page introuvable")
    page.status = payload.status
    db.commit()
    db.refresh(page)
    return page


@router.delete(
    "/longtail/{page_id}",
    dependencies=[Depends(require_role(*PUBLISH_ROLES))],
)
def delete_page(page_id: str, db: DBSession = Depends(get_db)) -> dict:
    page = db.get(LongTailPage, page_id)
    if page is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page introuvable")
    db.delete(page)
    db.commit()
    return {"deleted": page_id}
