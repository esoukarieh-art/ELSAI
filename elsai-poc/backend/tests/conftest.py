"""Fixtures partagées : DB SQLite en mémoire + TestClient isolé par test."""
from __future__ import annotations

import os

os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import database as db_module
from app.database import Base, get_db
from app.main import app


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    original = db_module.SessionLocal
    db_module.SessionLocal = TestingSessionLocal
    try:
        yield TestingSessionLocal
    finally:
        db_module.SessionLocal = original
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def client(db_session):
    def _get_db():
        db = db_session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Crée une session adulte et renvoie les headers Authorization."""
    def _make(profile: str = "adult") -> dict:
        r = client.post("/api/auth/session", json={"profile": profile})
        assert r.status_code == 200, r.text
        return {"Authorization": f"Bearer {r.json()['token']}"}
    return _make
