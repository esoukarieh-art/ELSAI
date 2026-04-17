"""Tests /api/documents/analyze — validation type, taille, OCR, LLM."""
from __future__ import annotations

import io

import pytest

from app.models import MetricEvent
from app.services import llm as llm_module, ocr as ocr_module


@pytest.fixture
def stub_pipeline(monkeypatch):
    """Remplace OCR + LLM par des stubs pilotables."""
    def _apply(ocr_text: str = "Texte OCR factice", explanation: dict | None = None):
        monkeypatch.setattr(ocr_module, "extract_text", lambda _data: ocr_text)
        monkeypatch.setattr(
            llm_module,
            "explain_document",
            lambda _t: explanation or {
                "document_type": "Courrier CAF",
                "explanation": "Ce document est une notification.",
                "suggested_actions": ["Répondre sous 15 jours"],
            },
        )
    return _apply


def _png_bytes() -> bytes:
    # PNG 1×1 valide minimal — suffisant pour la vérif de content-type + taille
    return (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00"
        b"\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )


def test_analyze_happy_path(client, auth_headers, stub_pipeline, db_session):
    stub_pipeline()
    headers = auth_headers("adult")

    files = {"file": ("doc.png", _png_bytes(), "image/png")}
    r = client.post("/api/documents/analyze", files=files, headers=headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ocr_text"] == "Texte OCR factice"
    assert body["explanation"]
    assert body["suggested_actions"] == ["Répondre sous 15 jours"]

    with db_session() as db:
        assert db.query(MetricEvent).filter_by(event_type="ocr").count() == 1


def test_analyze_rejects_pdf(client, auth_headers):
    headers = auth_headers("adult")
    files = {"file": ("doc.pdf", b"%PDF-1.4", "application/pdf")}
    r = client.post("/api/documents/analyze", files=files, headers=headers)
    assert r.status_code == 415


def test_analyze_rejects_oversized(client, auth_headers, stub_pipeline):
    stub_pipeline()
    headers = auth_headers("adult")
    big = b"\x00" * (11 * 1024 * 1024)
    files = {"file": ("huge.png", big, "image/png")}
    r = client.post("/api/documents/analyze", files=files, headers=headers)
    assert r.status_code == 413


def test_analyze_empty_ocr_returns_422(client, auth_headers, stub_pipeline):
    stub_pipeline(ocr_text="")
    headers = auth_headers("adult")
    files = {"file": ("doc.png", _png_bytes(), "image/png")}
    r = client.post("/api/documents/analyze", files=files, headers=headers)
    assert r.status_code == 422


def test_analyze_requires_auth(client):
    files = {"file": ("doc.png", _png_bytes(), "image/png")}
    r = client.post("/api/documents/analyze", files=files)
    assert r.status_code in (401, 403)


def test_analyze_ocr_runtime_error_returns_503(client, auth_headers, monkeypatch):
    def _boom(_data):
        raise RuntimeError("tesseract introuvable")
    monkeypatch.setattr(ocr_module, "extract_text", _boom)
    headers = auth_headers("adult")
    files = {"file": ("doc.png", _png_bytes(), "image/png")}
    r = client.post("/api/documents/analyze", files=files, headers=headers)
    assert r.status_code == 503
