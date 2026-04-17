"""Fixtures partagées : DB in-memory isolée par test + TestClient."""
import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def db_session():
    """SQLite in-memory partagée entre tous les connecteurs d'un même test
    (StaticPool) puis jetée. Isolation totale entre tests."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def _override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    yield TestingSession()
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    with TestClient(app) as c:
        yield c


def _create_session(client: TestClient, profile: str = "adult") -> dict:
    resp = client.post("/api/auth/session", json={"profile": profile})
    assert resp.status_code == 200, resp.text
    return resp.json()


@pytest.fixture
def adult_session(client):
    return _create_session(client, "adult")


@pytest.fixture
def minor_session(client):
    return _create_session(client, "minor")


@pytest.fixture
def auth_headers(adult_session):
    return {"Authorization": f"Bearer {adult_session['token']}"}
