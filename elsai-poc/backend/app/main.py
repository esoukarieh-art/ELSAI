"""Point d'entrée FastAPI — monolithe ELSAI POC."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .observability import setup_observability
from .routers import (
    admin,
    admin_emails,
    admin_users,
    auth,
    billing,
    chat,
    dashboard,
    documents,
    templates,
    voice,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Seed super_admin initial si ADMIN_BOOTSTRAP_EMAIL/PASSWORD définis
    from .admin_auth import ensure_initial_admin
    from .database import SessionLocal

    with SessionLocal() as db:
        ensure_initial_admin(db)
        from .services.email_templates_seed import seed_email_templates

        seed_email_templates(db)

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
    title="ELSAI POC API",
    description="Assistant social numérique — POC monolithe web",
    version="0.1.0",
    lifespan=lifespan,
)

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
app.include_router(templates.router)


@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "llm_configured": bool(settings.anthropic_api_key)}
