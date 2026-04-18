"""Gestion des utilisateurs admin (RBAC) — login + CRUD.

- POST /api/admin/auth/login — public, retourne JWT admin
- GET  /api/admin/auth/me    — identité courante (tous rôles)
- CRUD /api/admin/users       — super_admin uniquement
"""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session as DBSession

from ..admin_auth import (
    AdminIdentity,
    create_admin_token,
    get_admin,
    hash_password,
    require_role,
    verify_password,
)
from ..database import get_db
from ..models import AdminUser, AuditLog
from ..schemas import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminUserCreate,
    AdminUserUpdate,
    AdminUserView,
)

router = APIRouter(prefix="/api/admin", tags=["admin-users"])


@router.post("/auth/login", response_model=AdminLoginResponse)
def login(payload: AdminLoginRequest, db: DBSession = Depends(get_db)) -> AdminLoginResponse:
    user = db.query(AdminUser).filter_by(email=payload.email.lower().strip()).first()
    if not user or not user.active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Identifiants invalides")

    user.last_login = datetime.now(UTC)
    db.add(AuditLog(actor="admin", action="auth.login", target_type="admin_user", target_id=user.id))
    db.commit()

    return AdminLoginResponse(
        token=create_admin_token(user.id, user.role),
        role=user.role,  # type: ignore[arg-type]
        email=user.email,
        expires_in=8 * 3600,
    )


@router.get("/auth/me", response_model=AdminUserView)
def me(
    admin: AdminIdentity = Depends(get_admin),
    db: DBSession = Depends(get_db),
) -> AdminUserView:
    if admin.user_id == "system":
        # Token legacy : on renvoie un stub super_admin
        return AdminUserView(
            id="system",
            email="system@elsai",
            role="super_admin",
            active=True,
            created_at=datetime.now(UTC),
            last_login=None,
        )
    user = db.get(AdminUser, admin.user_id)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Utilisateur introuvable")
    return AdminUserView.model_validate(user)


@router.get(
    "/users",
    response_model=list[AdminUserView],
    dependencies=[Depends(require_role("super_admin"))],
)
def list_users(db: DBSession = Depends(get_db)) -> list[AdminUser]:
    return db.query(AdminUser).order_by(AdminUser.created_at.desc()).all()


@router.post(
    "/users",
    response_model=AdminUserView,
    dependencies=[Depends(require_role("super_admin"))],
)
def create_user(payload: AdminUserCreate, db: DBSession = Depends(get_db)) -> AdminUser:
    email = payload.email.lower().strip()
    if db.query(AdminUser).filter_by(email=email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email déjà utilisé")

    user = AdminUser(
        email=email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.add(
        AuditLog(
            actor="admin",
            action="admin_user.create",
            target_type="admin_user",
            target_id=user.id,
            details=f"{{\"role\": \"{payload.role}\"}}",
        )
    )
    db.commit()
    db.refresh(user)
    return user


@router.patch(
    "/users/{user_id}",
    response_model=AdminUserView,
    dependencies=[Depends(require_role("super_admin"))],
)
def update_user(
    user_id: str,
    payload: AdminUserUpdate,
    db: DBSession = Depends(get_db),
) -> AdminUser:
    user = db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Utilisateur introuvable")

    if payload.role is not None:
        user.role = payload.role
    if payload.active is not None:
        user.active = payload.active
    if payload.password:
        user.password_hash = hash_password(payload.password)

    db.add(
        AuditLog(
            actor="admin",
            action="admin_user.update",
            target_type="admin_user",
            target_id=user_id,
        )
    )
    db.commit()
    db.refresh(user)
    return user


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    dependencies=[Depends(require_role("super_admin"))],
)
def delete_user(user_id: str, db: DBSession = Depends(get_db)) -> Response:
    user = db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Utilisateur introuvable")
    db.delete(user)
    db.add(
        AuditLog(
            actor="admin",
            action="admin_user.delete",
            target_type="admin_user",
            target_id=user_id,
        )
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
