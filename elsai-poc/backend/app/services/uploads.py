"""Helpers pour les uploads de fichiers admin (images de pages, etc.)."""

from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

UPLOADS_DIR = Path("./uploads")

_ALLOWED_MIME = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/svg+xml": "svg",
}
_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


def ensure_uploads_dirs() -> None:
    (UPLOADS_DIR / "pages").mkdir(parents=True, exist_ok=True)


def save_page_image(file: UploadFile) -> str:
    """Valide et sauvegarde un upload d'image dans uploads/pages/.

    Retourne l'URL publique (/api/public/uploads/pages/...).
    """
    ensure_uploads_dirs()
    content_type = (file.content_type or "").lower()
    ext = _ALLOWED_MIME.get(content_type)
    if ext is None:
        raise HTTPException(
            400, f"Type de fichier non autorisé ({content_type}). Attendu : jpeg/png/webp/svg."
        )

    data = file.file.read(_MAX_BYTES + 1)
    if len(data) > _MAX_BYTES:
        raise HTTPException(413, "Fichier trop volumineux (max 5 Mo).")
    if not data:
        raise HTTPException(400, "Fichier vide.")

    name = f"{uuid4().hex}.{ext}"
    path = UPLOADS_DIR / "pages" / name
    path.write_bytes(data)
    return f"/api/public/uploads/pages/{name}"
