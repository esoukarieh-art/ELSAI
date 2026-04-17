"""Dashboard POC — métriques agrégées anonymes."""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

from ..database import get_db
from ..models import MetricEvent
from ..models import Session as UserSession
from ..schemas import DashboardMetrics

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _count(db: DBSession, event_type: str) -> int:
    return (
        db.query(func.count(MetricEvent.id)).filter(MetricEvent.event_type == event_type).scalar()
        or 0
    )


@router.get("/metrics", response_model=DashboardMetrics)
def metrics(db: DBSession = Depends(get_db)) -> DashboardMetrics:
    one_hour_ago = datetime.now(UTC) - timedelta(hours=1)

    total_sessions = db.query(func.count(UserSession.id)).scalar() or 0
    active_last_hour = (
        db.query(func.count(UserSession.id))
        .filter(UserSession.last_activity >= one_hour_ago)
        .scalar()
        or 0
    )

    profile_rows = (
        db.query(UserSession.profile, func.count(UserSession.id))
        .group_by(UserSession.profile)
        .all()
    )

    return DashboardMetrics(
        total_sessions=total_sessions,
        active_last_hour=active_last_hour,
        chats_total=_count(db, "chat"),
        ocr_total=_count(db, "ocr"),
        danger_detections_total=_count(db, "danger"),
        forget_requests_total=_count(db, "forget"),
        profile_breakdown=dict(profile_rows),
    )
