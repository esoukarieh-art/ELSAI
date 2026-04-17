"""Point d'entrée FastAPI — monolithe ELSAI POC."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import auth, chat, dashboard, documents, voice


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="ELSAI POC API",
    description="Assistant social numérique — POC monolithe web",
    version="0.1.0",
    lifespan=lifespan,
)

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


@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "llm_configured": bool(settings.anthropic_api_key)}
