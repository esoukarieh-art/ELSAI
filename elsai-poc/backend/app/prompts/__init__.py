"""Prompts système ELSAI — fichiers markdown par défaut + override DB (admin)."""

from pathlib import Path

_DIR = Path(__file__).parent

PROMPT_NAMES = ("system_adult", "system_minor", "ocr_explain")


def load_file(name: str) -> str:
    """Charge un prompt depuis son fichier .md (valeur par défaut immuable)."""
    return (_DIR / f"{name}.md").read_text(encoding="utf-8")


def get_active(name: str) -> str:
    """Retourne la version active en DB (tirage pondéré si A/B), sinon fichier .md.

    Compat : ne renvoie que le contenu. Préférer `pick_active()` pour tracer
    quel `version_id` a servi.
    """
    picked = pick_active(name)
    return picked[1] if picked else load_file(name)


def pick_active(name: str) -> tuple[int, str] | None:
    """Tirage pondéré parmi les versions actives (weight > 0).

    Retourne (version_id, content) ou None si rien en DB.
    Import local pour éviter un cycle avec database/models au démarrage.
    """
    import random

    try:
        from sqlalchemy import select

        from ..database import SessionLocal
        from ..models import PromptVersion

        with SessionLocal() as db:
            rows = (
                db.execute(
                    select(PromptVersion)
                    .where(
                        PromptVersion.name == name,
                        PromptVersion.active.is_(True),
                        PromptVersion.weight > 0,
                    )
                    .order_by(PromptVersion.created_at.desc())
                )
                .scalars()
                .all()
            )
            if not rows:
                return None
            if len(rows) == 1:
                return rows[0].id, rows[0].content
            weights = [r.weight for r in rows]
            pick = random.choices(rows, weights=weights, k=1)[0]
            return pick.id, pick.content
    except Exception:
        return None


# Constantes historiques (compat) — utiliser get_active() pour récupérer l'override.
SYSTEM_ADULT = load_file("system_adult")
SYSTEM_MINOR = load_file("system_minor")
OCR_EXPLAIN = load_file("ocr_explain")
