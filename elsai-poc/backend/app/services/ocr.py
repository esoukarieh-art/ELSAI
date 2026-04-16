"""Service OCR basé sur Tesseract."""
from io import BytesIO

import pytesseract
from PIL import Image

from ..config import settings

if settings.tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd


def extract_text(image_bytes: bytes, lang: str = "fra") -> str:
    """Extrait le texte d'une image. Lève RuntimeError si Tesseract absent."""
    try:
        image = Image.open(BytesIO(image_bytes))
    except Exception as exc:
        raise ValueError(f"Image invalide: {exc}") from exc

    try:
        text = pytesseract.image_to_string(image, lang=lang)
    except pytesseract.TesseractNotFoundError as exc:
        raise RuntimeError(
            "Tesseract non trouvé. Installez-le et renseignez TESSERACT_CMD dans .env"
        ) from exc
    except pytesseract.TesseractError:
        # Fallback en anglais si pack français manquant
        text = pytesseract.image_to_string(image)

    return text.strip()
