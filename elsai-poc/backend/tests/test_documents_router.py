"""Tests du router /api/documents/analyze — OCR + explication LLM."""
import io

import pytest
from PIL import Image

from app.models import MetricEvent
from app.services import llm as llm_service
from app.services import ocr as ocr_service


def _png_bytes(size=(40, 40), color=(255, 255, 255)) -> bytes:
    img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture(autouse=True)
def stub_services(monkeypatch):
    monkeypatch.setattr(ocr_service, "extract_text", lambda data: "RSA notification texte")
    monkeypatch.setattr(
        llm_service,
        "explain_document",
        lambda text: {
            "document_type": "Notification RSA",
            "explanation": "Voici ce que dit ce document.",
            "suggested_actions": ["Prendre RDV CAF"],
        },
    )


def test_analyze_happy_path(client, auth_headers, db_session):
    files = {"file": ("test.png", _png_bytes(), "image/png")}
    resp = client.post("/api/documents/analyze", headers=auth_headers, files=files)
    assert resp.status_code == 200
    body = resp.json()
    assert body["ocr_text"] == "RSA notification texte"
    assert body["explanation"] == "Voici ce que dit ce document."
    assert body["suggested_actions"] == ["Prendre RDV CAF"]

    events = db_session.query(MetricEvent).all()
    assert len(events) == 1 and events[0].event_type == "ocr"


def test_analyze_type_non_supporte(client, auth_headers):
    files = {"file": ("test.pdf", b"%PDF-1.4", "application/pdf")}
    resp = client.post("/api/documents/analyze", headers=auth_headers, files=files)
    assert resp.status_code == 415


def test_analyze_fichier_trop_gros(client, auth_headers, monkeypatch):
    # 11 MB > limite 10 MB
    big = b"\x00" * (11 * 1024 * 1024)
    files = {"file": ("big.png", big, "image/png")}
    resp = client.post("/api/documents/analyze", headers=auth_headers, files=files)
    assert resp.status_code == 413


def test_analyze_ocr_vide_renvoie_422(client, auth_headers, monkeypatch):
    monkeypatch.setattr(ocr_service, "extract_text", lambda data: "")
    files = {"file": ("blank.png", _png_bytes(), "image/png")}
    resp = client.post("/api/documents/analyze", headers=auth_headers, files=files)
    assert resp.status_code == 422


def test_analyze_ocr_image_invalide_renvoie_400(client, auth_headers, monkeypatch):
    def bad(data):
        raise ValueError("Image illisible")
    monkeypatch.setattr(ocr_service, "extract_text", bad)
    files = {"file": ("bad.png", b"not-an-image", "image/png")}
    resp = client.post("/api/documents/analyze", headers=auth_headers, files=files)
    assert resp.status_code == 400


def test_analyze_ocr_indisponible_renvoie_503(client, auth_headers, monkeypatch):
    def missing(data):
        raise RuntimeError("Tesseract non installé")
    monkeypatch.setattr(ocr_service, "extract_text", missing)
    files = {"file": ("x.png", _png_bytes(), "image/png")}
    resp = client.post("/api/documents/analyze", headers=auth_headers, files=files)
    assert resp.status_code == 503


def test_analyze_llm_indisponible_renvoie_503(client, auth_headers, monkeypatch):
    def boom(text):
        raise RuntimeError("Claude indisponible")
    monkeypatch.setattr(llm_service, "explain_document", boom)
    files = {"file": ("x.png", _png_bytes(), "image/png")}
    resp = client.post("/api/documents/analyze", headers=auth_headers, files=files)
    assert resp.status_code == 503


def test_analyze_sans_token_refuse(client):
    files = {"file": ("x.png", _png_bytes(), "image/png")}
    resp = client.post("/api/documents/analyze", files=files)
    assert resp.status_code == 403
