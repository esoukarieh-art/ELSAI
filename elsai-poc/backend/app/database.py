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


def _migrate_conversations() -> None:
    """Ajoute les colonnes `optional_account_id` et `department_code` sur conversations.

    Idempotent : no-op si les colonnes existent déjà. Supporte SQLite et Postgres.
    Pour Postgres, une FK est ajoutée vers optional_accounts(id) si la table existe.
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
                    "WHERE type='table' AND name='conversations'"
                )
            ).first()
            if not exists:
                return
            cols = {row[1] for row in conn.execute(text("PRAGMA table_info(conversations)"))}
        else:
            exists = conn.execute(
                text(
                    "SELECT 1 FROM information_schema.tables "
                    "WHERE table_name = 'conversations'"
                )
            ).first()
            if not exists:
                return
            cols = {
                row[0]
                for row in conn.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_name = 'conversations'"
                    )
                )
            }

        statements: list[str] = []
        if "optional_account_id" not in cols:
            statements.append(
                "ALTER TABLE conversations ADD COLUMN optional_account_id VARCHAR(36)"
            )
        if "department_code" not in cols:
            statements.append(
                "ALTER TABLE conversations ADD COLUMN department_code VARCHAR(3)"
            )
        for stmt in statements:
            conn.execute(text(stmt))

        if statements and is_postgres:
            # Index sur optional_account_id pour cohérence avec le mapping ORM
            try:
                conn.execute(
                    text(
                        "CREATE INDEX IF NOT EXISTS ix_conversations_optional_account_id "
                        "ON conversations (optional_account_id)"
                    )
                )
            except Exception:
                pass
            # FK vers optional_accounts si la table existe (best-effort, n'échoue
                # pas le boot si la table n'est pas encore là).
            try:
                has_oa = conn.execute(
                    text(
                        "SELECT 1 FROM information_schema.tables "
                        "WHERE table_name = 'optional_accounts'"
                    )
                ).first()
                has_fk = conn.execute(
                    text(
                        "SELECT 1 FROM information_schema.table_constraints "
                        "WHERE table_name = 'conversations' "
                        "AND constraint_name = 'fk_conversations_optional_account_id'"
                    )
                ).first()
                if has_oa and not has_fk:
                    conn.execute(
                        text(
                            "ALTER TABLE conversations "
                            "ADD CONSTRAINT fk_conversations_optional_account_id "
                            "FOREIGN KEY (optional_account_id) "
                            "REFERENCES optional_accounts(id) ON DELETE SET NULL"
                        )
                    )
            except Exception:
                pass

        if statements:
            conn.commit()


def init_db() -> None:
    from . import models  # noqa: F401 — import pour enregistrer les tables

    Base.metadata.create_all(bind=engine)
    _migrate_page_content()
    _migrate_blog_posts()
    _migrate_conversations()
