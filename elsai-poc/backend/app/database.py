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
    """Ajoute les colonnes draft/status/published_at sur page_contents.

    Supporte SQLite et Postgres. Idempotent : no-op si colonnes déjà présentes.
    On ne touche pas à la table si elle n'existe pas — `create_all` s'en
    charge avec le schéma complet.
    """
    url = settings.database_url
    is_sqlite = url.startswith("sqlite")
    is_postgres = url.startswith("postgres")
    if not (is_sqlite or is_postgres):
        return

    timestamp_type = "DATETIME" if is_sqlite else "TIMESTAMP"

    with engine.connect() as conn:
        if is_sqlite:
            exists = conn.execute(
                text(
                    "SELECT name FROM sqlite_master "
                    "WHERE type='table' AND name='page_contents'"
                )
            ).first()
            if not exists:
                return
            cols = {row[1] for row in conn.execute(text("PRAGMA table_info(page_contents)"))}
        else:
            exists = conn.execute(
                text(
                    "SELECT 1 FROM information_schema.tables "
                    "WHERE table_name = 'page_contents'"
                )
            ).first()
            if not exists:
                return
            cols = {
                row[0]
                for row in conn.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_name = 'page_contents'"
                    )
                )
            }

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
                f"ALTER TABLE page_contents ADD COLUMN published_at {timestamp_type}"
            )
        for stmt in statements:
            conn.execute(text(stmt))
        if statements:
            conn.commit()


def _migrate_blog_posts() -> None:
    """Ajoute la colonne `kind` sur blog_posts.

    Idempotent : no-op si la colonne existe déjà. Supporte SQLite et Postgres.
    """
    url = settings.database_url
    is_sqlite = url.startswith("sqlite")
    is_postgres = url.startswith("postgres")
    if not (is_sqlite or is_postgres):
        return

    with engine.connect() as conn:
        if is_sqlite:
            exists = conn.execute(
                text(
                    "SELECT name FROM sqlite_master "
                    "WHERE type='table' AND name='blog_posts'"
                )
            ).first()
            if not exists:
                return
            cols = {row[1] for row in conn.execute(text("PRAGMA table_info(blog_posts)"))}
        else:
            exists = conn.execute(
                text(
                    "SELECT 1 FROM information_schema.tables "
                    "WHERE table_name = 'blog_posts'"
                )
            ).first()
            if not exists:
                return
            cols = {
                row[0]
                for row in conn.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_name = 'blog_posts'"
                    )
                )
            }

        if "kind" not in cols:
            conn.execute(
                text(
                    "ALTER TABLE blog_posts ADD COLUMN kind VARCHAR(16) "
                    "NOT NULL DEFAULT 'article'"
                )
            )
            # Index non-unique sur kind pour accélérer les filtres listing
            try:
                conn.execute(
                    text("CREATE INDEX IF NOT EXISTS ix_blog_posts_kind ON blog_posts (kind)")
                )
            except Exception:
                pass
            conn.commit()


def init_db() -> None:
    from . import models  # noqa: F401 — import pour enregistrer les tables

    Base.metadata.create_all(bind=engine)
    _migrate_page_content()
    _migrate_blog_posts()
