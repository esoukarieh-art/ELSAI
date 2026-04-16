"""Session anonyme par JWT. Aucun nom/email stocké."""
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session as DBSession

from .config import settings
from .database import get_db
from .models import Session as UserSession

_bearer = HTTPBearer(auto_error=True)


def create_token(session_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": session_id,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.session_expire_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _decode(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token invalide")
        return sub
    except JWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token invalide ou expiré") from exc


def get_session(
    creds: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    db: Annotated[DBSession, Depends(get_db)],
) -> UserSession:
    session_id = _decode(creds.credentials)
    session = db.get(UserSession, session_id)
    if session is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session inexistante ou oubliée")
    session.last_activity = datetime.now(timezone.utc)
    db.commit()
    return session


SessionDep = Annotated[UserSession, Depends(get_session)]
