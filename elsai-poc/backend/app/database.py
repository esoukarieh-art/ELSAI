from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _migrate_page_content() -> None:
    """Ajoute les colonnes draft/status/published_at sur page_contents (SQLite only).

    Idempotent : no-op si les colonnes existent déjà. On ne touche pas à la table
    si elle n'existe pas encore — `create_all` s'en charge avec le schéma à jour.
    """
    if not settings.database_url.startswith("sqlite"):
        return
    with engine.connect() as conn:
        exists = conn.execute(
            text(
                "SELECT name FROM sqlite_master "
                "WHERE type='table' AND name='page_contents'"
            )
        ).first()
        if not exists:
            return
        cols = {row[1] for row in conn.execute(text("PRAGMA table_info(page_contents)"))}
        statements: list[str] = []
        if "status" not in cols:
            statements.append(
                "ALTER TABLE page_contents ADD COLUMN status VARCHAR(16) "
                "NOT NULL DEFAULT 'published'"
            )
        if "draft_blocks_json" not in cols:
            statements.append(
                "ALTER TABLE page_contents ADD COLUMN draft_blocks_json TEXT"
            )
        if "published_at" not in cols:
            statements.append(
                "ALTER TABLE page_contents ADD COLUMN published_at DATETIME"
            )
        for stmt in statements:
            conn.execute(text(stmt))
        if statements:
            conn.commit()


def init_db() -> None:
    from . import models  # noqa: F401 — import pour enregistrer les tables

    Base.metadata.create_all(bind=engine)
    _migrate_page_content()
