"""Prompts système ELSAI - chargés depuis les fichiers markdown."""
from pathlib import Path

_DIR = Path(__file__).parent


def load(name: str) -> str:
    return (_DIR / f"{name}.md").read_text(encoding="utf-8")


SYSTEM_ADULT = load("system_adult")
SYSTEM_MINOR = load("system_minor")
OCR_EXPLAIN = load("ocr_explain")
