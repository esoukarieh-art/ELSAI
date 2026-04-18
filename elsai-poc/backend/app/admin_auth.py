"""Authentification admin (RBAC) — JWT + hash scrypt stdlib.

Fallback rétrocompatible : X-Admin-Token (env ADMIN_TOKEN) = super_admin.
"""

from __future__ import annotations

import hashlib
import hmac
import os
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session as DBSession

from .config import settings
from .database import get_db
from .models import AdminUser

ROLES = ("super_admin", "moderator_119", "content_editor", "b2b_sales")

_SCRYPT_N = 2**14
_SCRYPT_R = 8
_SCRYPT_P = 1
_SCRYPT_DK = 64


def hash_password(pw: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.scrypt(pw.encode(), salt=salt, n=_SCRYPT_N, r=_SCRYPT_R, p=_SCRYPT_P, dklen=_SCRYPT_DK)
    return f"scrypt${salt.hex()}${dk.hex()}"


def verify_password(pw: str, stored: str) -> bool:
    try:
        scheme, salt_hex, dk_hex = stored.split("$", 2)
        if scheme != "scrypt":
            return False
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(dk_hex)
        dk = hashlib.scrypt(
            pw.encode(), salt=salt, n=_SCRYPT_N, r=_SCRYPT_R, p=_SCRYPT_P, dklen=len(expected)
        )
        return hmac.compare_digest(dk, expected)
    except (ValueError, AttributeError):
        return False


def create_admin_token(user_id: str, role: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": user_id,
        "role": role,
        "scope": "admin",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=8)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@dataclass
class AdminIdentity:
    user_id: str
    role: str
    email: str | None = None


def _from_jwt(token: str) -> AdminIdentity:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token admin invalide") from exc
    if payload.get("scope") != "admin":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Scope invalide")
    role = payload.get("role")
    if role not in ROLES:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Rôle inconnu")
    return AdminIdentity(user_id=payload["sub"], role=role)


def get_admin(
    authorization: str | None = Header(default=None),
    x_admin_token: str | None = Header(default=None),
) -> AdminIdentity:
    # 1. Legacy super_admin via X-Admin-Token (conservé pour scripts/POC)
    if settings.admin_token and x_admin_token == settings.admin_token:
        return AdminIdentity(user_id="system", role="super_admin", email="system@elsai")

    # 2. JWT admin standard
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(None, 1)[1].strip()
        return _from_jwt(token)

    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentification admin requise")


def require_role(*allowed: str):
    """Factory de Depends : super_admin bypass tout, sinon rôle dans la whitelist."""

    def _dep(admin: AdminIdentity = Depends(get_admin)) -> AdminIdentity:
        if admin.role == "super_admin":
            return admin
        if admin.role not in allowed:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Accès refusé : rôle requis parmi {allowed}",
            )
        return admin

    return _dep


# Seed initial : crée un super_admin depuis ENV si la table est vide.
def ensure_initial_admin(db: DBSession) -> None:
    if db.query(AdminUser).count() > 0:
        return
    email = os.getenv("ADMIN_BOOTSTRAP_EMAIL", "admin@elsai.local")
    password = os.getenv("ADMIN_BOOTSTRAP_PASSWORD")
    if not password:
        return  # ne rien créer sans mot de passe explicite
    user = AdminUser(email=email, password_hash=hash_password(password), role="super_admin")
    db.add(user)
    db.commit()


def get_admin_user(
    db: DBSession = Depends(get_db),
    admin: AdminIdentity = Depends(get_admin),
) -> AdminUser | None:
    """Retourne l'objet AdminUser si le token correspond à un user en DB (sinon None = system)."""
    if admin.user_id == "system":
        return None
    return db.get(AdminUser, admin.user_id)
