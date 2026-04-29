"""Point d'entrée FastAPI — monolithe ESLAÏ POC."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import __version__
from .config import settings
from .database import init_db
from .observability import setup_observability
from .routers import (
    admin,
    admin_ai,
    admin_analytics,
    admin_blog,
    admin_cta,
    admin_emails,
    admin_leadmagnets,
    admin_pages,
    admin_seo,
    admin_users,
    auth,
    billing,
    chat,
    dashboard,
    documents,
    export_pdf,
    feedback,
    glossary,
    longtail,
    public_content,
    public_events,
    public_newsletter,
    templates,
    voice,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Répertoires d'upload (images CMS)
    from .services.uploads import ensure_uploads_dirs

    ensure_uploads_dirs()
    # Seed super_admin initial si ADMIN_BOOTSTRAP_EMAIL/PASSWORD définis
    from .admin_auth import ensure_initial_admin
    from .database import SessionLocal

    with SessionLocal() as db:
        ensure_initial_admin(db)
        from .services.email_templates_seed import seed_email_templates

        seed_email_templates(db)

        from .services.content_seed import seed_content

        seed_content(db)

        from .services.glossary_seed import seed_glossary

        seed_glossary(db)

        from .services.geo_seed import seed_departments

        seed_departments(db)

        # Seed idempotent des 9 pages du centre d'aide (kind=help).
        # Upsert par slug : safe à chaque boot.
        from .scripts.seed_help_pages import seed as seed_help

        try:
            seed_help(db)
        except Exception as exc:  # noqa: BLE001 — best effort, ne doit pas bloquer le boot
            import logging

            logging.getLogger(__name__).warning("seed_help_pages failed: %s", exc)

    if settings.email_scheduler_enabled:
        from .services.email_scheduler import start_scheduler, stop_scheduler

        start_scheduler(tick_minutes=settings.email_scheduler_tick_minutes)
        try:
            yield
        finally:
            stop_scheduler()
    else:
        yield


app = FastAPI(
    title="ESLAÏ POC API",
    description="Assistant social numérique — POC monolithe web",
    version=__version__,
    lifespan=lifespan,
)


@app.get("/api/version", tags=["meta"])
def api_version() -> dict:
    """Version courante du backend, pour healthcheck et diagnostic."""
    return {"version": __version__}

setup_observability(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(dashboard.router)
app.include_router(voice.router)
app.include_router(billing.router)
app.include_router(admin.router)
app.include_router(admin_users.router)
app.include_router(admin_emails.router)
app.include_router(admin_blog.router)
app.include_router(admin_cta.router)
app.include_router(admin_ai.router)
app.include_router(admin_leadmagnets.router)
app.include_router(admin_pages.router)
app.include_router(admin_analytics.router)
app.include_router(admin_seo.router)
app.include_router(public_content.router)

# Fichiers uploadés (images CMS) servis en lecture publique
from .services.uploads import ensure_uploads_dirs as _ensure_uploads_dirs  # noqa: E402

_ensure_uploads_dirs()
app.mount(
    "/api/public/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)
app.include_router(public_events.router)
app.include_router(public_newsletter.router)
app.include_router(templates.router)
app.include_router(feedback.router)
app.include_router(glossary.router)
app.include_router(longtail.router)
app.include_router(export_pdf.router)


@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "llm_configured": bool(settings.anthropic_api_key)}
