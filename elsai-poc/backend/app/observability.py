"""Observabilité : logs JSON structurés + correlation ID + Sentry (optionnel).

Contraintes ELSAI :
  - Anonymat : aucune donnée utilisateur (contenu message, email, nom) ne doit
    apparaître dans les logs. On logue seulement profil, flags, signaux, IDs.
  - `send_default_pii=False` côté Sentry.
  - Sentry et structlog restent **optionnels** : absence de DSN → pas d'init,
    fallback logging stdlib. Cohérent avec dev local sans infra.
"""

from __future__ import annotations

import logging
import sys
import uuid
from contextvars import ContextVar

import structlog
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings

_correlation_id: ContextVar[str] = ContextVar("correlation_id", default="-")


def _add_correlation_id(_, __, event_dict):
    event_dict["correlation_id"] = _correlation_id.get()
    return event_dict


def configure_logging(level: str = "INFO") -> None:
    """Configure structlog pour émettre du JSON sur stdout."""
    log_level = getattr(logging, level.upper(), logging.INFO)

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            _add_correlation_id,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None):
    return structlog.get_logger(name)


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Injecte un correlation ID par requête. Lit `X-Correlation-Id` si fourni,
    sinon en génère un (UUID4). Propagé dans les logs + header de réponse."""

    async def dispatch(self, request: Request, call_next):
        cid = request.headers.get("X-Correlation-Id") or uuid.uuid4().hex
        token = _correlation_id.set(cid)
        try:
            response = await call_next(request)
            response.headers["X-Correlation-Id"] = cid
            return response
        finally:
            _correlation_id.reset(token)


def init_sentry() -> bool:
    """Initialise Sentry si DSN présent. Renvoie True si actif."""
    if not settings.sentry_dsn:
        return False
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration
    except ImportError:
        return False

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        release=settings.sentry_release or None,
        send_default_pii=False,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
        ],
    )
    return True


def setup_observability(app: FastAPI) -> None:
    """Point d'entrée unique : appeler depuis main.py avant add_middleware."""
    configure_logging(settings.log_level)
    sentry_active = init_sentry()
    app.add_middleware(CorrelationIdMiddleware)
    get_logger("elsai.boot").info(
        "observability_ready",
        log_level=settings.log_level,
        sentry=sentry_active,
        environment=settings.sentry_environment,
    )
