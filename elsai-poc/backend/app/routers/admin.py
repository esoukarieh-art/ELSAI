"""Backoffice ELSAI — supervision, prompts, audit, droit à l'oubli.

Protégé par X-Admin-Token (même jeton que /api/dashboard/metrics).
Aucun endpoint ne remonte de PII : seul session_id (UUID anonyme) apparaît.
"""

from __future__ import annotations

import csv
import io
import json

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import desc, func
from sqlalchemy.orm import Session as DBSession

from ..admin_auth import get_admin, require_role
from ..database import get_db
from ..models import (
    AuditLog,
    DangerAlert,
    FeatureFlag,
    Message,
    MetricEvent,
    PromptVersion,
)
from ..models import Session as UserSession
from ..prompts import PROMPT_NAMES, load_file
from ..schemas import (
    AuditLogView,
    DangerAlertUpdate,
    DangerAlertView,
    FeatureFlagToggle,
    FeatureFlagUpsert,
    FeatureFlagView,
    ForgetRequestView,
    PromptUpdate,
    PromptVariantCreate,
    PromptVariantStats,
    PromptVersionFull,
    PromptVersionView,
    PromptView,
    PromptWeightUpdate,
)

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(get_admin)],
)


def _log(
    db: DBSession,
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    details: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            actor="admin",
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=json.dumps(details) if details else None,
        )
    )


# ---------------------- Alertes mineurs ----------------------


@router.get(
    "/alerts",
    response_model=list[DangerAlertView],
    dependencies=[Depends(require_role("moderator_119"))],
)
def list_alerts(
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, le=500),
    db: DBSession = Depends(get_db),
) -> list[DangerAlert]:
    q = db.query(DangerAlert).order_by(desc(DangerAlert.created_at))
    if status_filter:
        q = q.filter(DangerAlert.status == status_filter)
    return q.limit(limit).all()


@router.patch(
    "/alerts/{alert_id}",
    response_model=DangerAlertView,
    dependencies=[Depends(require_role("moderator_119"))],
)
def update_alert(
    alert_id: str,
    payload: DangerAlertUpdate,
    db: DBSession = Depends(get_db),
) -> DangerAlert:
    alert = db.query(DangerAlert).filter_by(id=alert_id).first()
    if alert is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Alerte introuvable")

    previous = alert.status
    alert.status = payload.status
    if payload.reviewer_note is not None:
        alert.reviewer_note = payload.reviewer_note

    _log(
        db,
        action="alert.status_change",
        target_type="danger_alert",
        target_id=alert_id,
        details={"from": previous, "to": payload.status},
    )
    db.commit()
    db.refresh(alert)
    return alert


# ---------------------- Gestion des prompts ----------------------


@router.get(
    "/prompts",
    response_model=list[PromptView],
    dependencies=[Depends(require_role("content_editor"))],
)
def list_prompts(db: DBSession = Depends(get_db)) -> list[PromptView]:
    result: list[PromptView] = []
    for name in PROMPT_NAMES:
        active = (
            db.query(PromptVersion)
            .filter_by(name=name, active=True)
            .order_by(desc(PromptVersion.created_at))
            .first()
        )
        if active:
            result.append(
                PromptView(
                    name=name,
                    content=active.content,
                    is_default=False,
                    version_id=active.id,
                    updated_at=active.created_at,
                )
            )
        else:
            result.append(
                PromptView(
                    name=name,
                    content=load_file(name),
                    is_default=True,
                    version_id=None,
                    updated_at=None,
                )
            )
    return result


@router.put(
    "/prompts/{name}",
    response_model=PromptView,
    dependencies=[Depends(require_role("content_editor"))],
)
def update_prompt(
    name: str,
    payload: PromptUpdate,
    db: DBSession = Depends(get_db),
) -> PromptView:
    if name not in PROMPT_NAMES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Prompt inconnu : {name}")

    # Désactiver les versions actives précédentes
    db.query(PromptVersion).filter_by(name=name, active=True).update({"active": False})

    version = PromptVersion(name=name, content=payload.content, active=True)
    db.add(version)
    db.flush()

    _log(
        db,
        action="prompt.update",
        target_type="prompt",
        target_id=name,
        details={"version_id": version.id, "length": len(payload.content)},
    )
    db.commit()
    db.refresh(version)

    return PromptView(
        name=name,
        content=version.content,
        is_default=False,
        version_id=version.id,
        updated_at=version.created_at,
    )


@router.post(
    "/prompts/{name}/reset",
    response_model=PromptView,
    dependencies=[Depends(require_role("content_editor"))],
)
def reset_prompt(name: str, db: DBSession = Depends(get_db)) -> PromptView:
    """Rollback : désactive tous les overrides DB, retour au fichier .md."""
    if name not in PROMPT_NAMES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Prompt inconnu : {name}")

    db.query(PromptVersion).filter_by(name=name, active=True).update({"active": False})
    _log(db, action="prompt.reset", target_type="prompt", target_id=name)
    db.commit()

    return PromptView(
        name=name,
        content=load_file(name),
        is_default=True,
        version_id=None,
        updated_at=None,
    )


@router.get("/prompts/{name}/versions", response_model=list[PromptVersionView])
def list_prompt_versions(
    name: str,
    db: DBSession = Depends(get_db),
) -> list[PromptVersion]:
    if name not in PROMPT_NAMES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Prompt inconnu : {name}")
    return (
        db.query(PromptVersion)
        .filter_by(name=name)
        .order_by(desc(PromptVersion.created_at))
        .limit(50)
        .all()
    )


# ---------------------- Journal d'audit ----------------------


@router.get("/audit", response_model=list[AuditLogView])
def list_audit(
    limit: int = Query(default=200, le=1000),
    action: str | None = Query(default=None),
    db: DBSession = Depends(get_db),
) -> list[AuditLog]:
    q = db.query(AuditLog).order_by(desc(AuditLog.created_at))
    if action:
        q = q.filter(AuditLog.action == action)
    return q.limit(limit).all()


# ---------------------- Demandes de droit à l'oubli ----------------------


@router.get("/forget-requests", response_model=list[ForgetRequestView])
def list_forget_requests(
    limit: int = Query(default=200, le=1000),
    db: DBSession = Depends(get_db),
) -> list[MetricEvent]:
    return (
        db.query(MetricEvent)
        .filter_by(event_type="forget")
        .order_by(desc(MetricEvent.created_at))
        .limit(limit)
        .all()
    )


# ---------------------- A/B testing prompts ----------------------


@router.get(
    "/prompts/{name}/variants",
    response_model=list[PromptVersionFull],
    dependencies=[Depends(require_role("content_editor"))],
)
def list_variants(name: str, db: DBSession = Depends(get_db)) -> list[PromptVersion]:
    if name not in PROMPT_NAMES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prompt inconnu")
    return (
        db.query(PromptVersion)
        .filter_by(name=name)
        .order_by(desc(PromptVersion.created_at))
        .all()
    )


@router.post(
    "/prompts/{name}/variants",
    response_model=PromptVersionFull,
    dependencies=[Depends(require_role("content_editor"))],
)
def create_variant(
    name: str,
    payload: PromptVariantCreate,
    db: DBSession = Depends(get_db),
) -> PromptVersion:
    if name not in PROMPT_NAMES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prompt inconnu")
    variant = PromptVersion(
        name=name,
        label=payload.label,
        content=payload.content,
        weight=payload.weight,
        active=True,
    )
    db.add(variant)
    db.flush()
    _log(
        db,
        "prompt.variant_create",
        "prompt",
        name,
        {"variant_id": variant.id, "label": payload.label, "weight": payload.weight},
    )
    db.commit()
    db.refresh(variant)
    return variant


@router.put(
    "/prompts/{name}/weights",
    response_model=list[PromptVersionFull],
    dependencies=[Depends(require_role("content_editor"))],
)
def update_weights(
    name: str,
    payload: PromptWeightUpdate,
    db: DBSession = Depends(get_db),
) -> list[PromptVersion]:
    if name not in PROMPT_NAMES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prompt inconnu")

    variants = db.query(PromptVersion).filter_by(name=name).all()
    by_id = {v.id: v for v in variants}
    for vid, w in payload.weights.items():
        if vid in by_id:
            by_id[vid].weight = max(0, min(1000, int(w)))

    _log(db, "prompt.weights_update", "prompt", name, {"weights": payload.weights})
    db.commit()
    return [by_id[v] for v in sorted(by_id)]


@router.get(
    "/prompts/{name}/stats",
    response_model=list[PromptVariantStats],
    dependencies=[Depends(require_role("content_editor"))],
)
def variant_stats(name: str, db: DBSession = Depends(get_db)) -> list[PromptVariantStats]:
    if name not in PROMPT_NAMES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prompt inconnu")

    variants = db.query(PromptVersion).filter_by(name=name).all()
    out: list[PromptVariantStats] = []
    for v in variants:
        served = (
            db.query(func.count(Message.id))
            .filter(Message.prompt_version_id == v.id, Message.role == "assistant")
            .scalar()
            or 0
        )
        dangers = (
            db.query(func.count(Message.id))
            .filter(
                Message.prompt_version_id == v.id,
                Message.role == "assistant",
                Message.danger_flag.is_(True),
            )
            .scalar()
            or 0
        )
        out.append(
            PromptVariantStats(
                version_id=v.id,
                label=v.label,
                weight=v.weight,
                active=v.active,
                messages_served=served,
                danger_flags=dangers,
            )
        )
    return out


# ---------------------- Exports statistiques ----------------------


def _csv_response(rows: list[list], headers: list[str], filename: str) -> Response:
    buf = io.StringIO()
    buf.write("\ufeff")  # BOM UTF-8 pour Excel
    writer = csv.writer(buf, delimiter=";")
    writer.writerow(headers)
    writer.writerows(rows)
    return Response(
        content=buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/exports/metrics.csv")
def export_metrics(
    db: DBSession = Depends(get_db),
    _=Depends(require_role("super_admin", "b2b_sales", "content_editor")),
) -> Response:
    """Export CSV agrégé (pour rapports DREES / partenaires)."""
    from sqlalchemy import case

    total_sessions = db.query(func.count(UserSession.id)).scalar() or 0
    profile_rows = dict(
        db.query(UserSession.profile, func.count(UserSession.id))
        .group_by(UserSession.profile)
        .all()
    )
    event_rows = dict(
        db.query(MetricEvent.event_type, func.count(MetricEvent.id))
        .group_by(MetricEvent.event_type)
        .all()
    )
    # Split danger par profil
    danger_by_profile = dict(
        db.query(MetricEvent.profile, func.count(MetricEvent.id))
        .filter(MetricEvent.event_type == "danger")
        .group_by(MetricEvent.profile)
        .all()
    )

    rows: list[list] = [
        ["Sessions totales", total_sessions],
        ["Sessions — Majeurs", profile_rows.get("adult", 0)],
        ["Sessions — Mineurs 12-18", profile_rows.get("minor", 0)],
        ["Conversations (chat)", event_rows.get("chat", 0)],
        ["Documents analysés (OCR)", event_rows.get("ocr", 0)],
        ["Signaux de danger — total", event_rows.get("danger", 0)],
        ["Signaux de danger — mineurs", danger_by_profile.get("minor", 0)],
        ["Signaux de danger — majeurs", danger_by_profile.get("adult", 0)],
        ["Demandes de droit à l'oubli", event_rows.get("forget", 0)],
    ]
    _ = case  # silence linter on reserved import
    _log(db, "export.metrics", "csv", None, {"rows": len(rows)})
    db.commit()
    return _csv_response(rows, ["Indicateur", "Valeur"], "elsai_metrics.csv")


@router.get("/exports/alerts.csv", dependencies=[Depends(require_role("moderator_119"))])
def export_alerts(db: DBSession = Depends(get_db)) -> Response:
    alerts = db.query(DangerAlert).order_by(DangerAlert.created_at).all()
    rows = [
        [
            a.created_at.isoformat(),
            a.id,
            a.session_id,
            a.profile,
            a.source,
            a.status,
            (a.excerpt or "").replace("\n", " "),
            (a.reviewer_note or "").replace("\n", " "),
        ]
        for a in alerts
    ]
    _log(db, "export.alerts", "csv", None, {"rows": len(rows)})
    db.commit()
    return _csv_response(
        rows,
        ["Date", "Alert_ID", "Session_ID", "Profil", "Source", "Statut", "Extrait", "Note"],
        "elsai_alerts.csv",
    )


# ---------------------- Feature flags (modules/parcours) ----------------------


@router.get("/features", response_model=list[FeatureFlagView])
def list_features(db: DBSession = Depends(get_db)) -> list[FeatureFlag]:
    return db.query(FeatureFlag).order_by(FeatureFlag.category, FeatureFlag.name).all()


@router.put(
    "/features",
    response_model=FeatureFlagView,
    dependencies=[Depends(require_role("content_editor"))],
)
def upsert_feature(payload: FeatureFlagUpsert, db: DBSession = Depends(get_db)) -> FeatureFlag:
    flag = db.get(FeatureFlag, payload.name)
    if flag is None:
        flag = FeatureFlag(name=payload.name)
        db.add(flag)
    flag.enabled = payload.enabled
    flag.description = payload.description
    flag.category = payload.category
    _log(db, "feature.upsert", "feature_flag", payload.name, {"enabled": payload.enabled})
    db.commit()
    db.refresh(flag)
    return flag


@router.patch(
    "/features/{name}",
    response_model=FeatureFlagView,
    dependencies=[Depends(require_role("content_editor"))],
)
def toggle_feature(
    name: str,
    payload: FeatureFlagToggle,
    db: DBSession = Depends(get_db),
) -> FeatureFlag:
    flag = db.get(FeatureFlag, name)
    if flag is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Feature inconnue")
    flag.enabled = payload.enabled
    _log(db, "feature.toggle", "feature_flag", name, {"enabled": payload.enabled})
    db.commit()
    db.refresh(flag)
    return flag


@router.delete(
    "/features/{name}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    dependencies=[Depends(require_role("super_admin"))],
)
def delete_feature(name: str, db: DBSession = Depends(get_db)) -> Response:
    flag = db.get(FeatureFlag, name)
    if flag is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Feature inconnue")
    db.delete(flag)
    _log(db, "feature.delete", "feature_flag", name)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
