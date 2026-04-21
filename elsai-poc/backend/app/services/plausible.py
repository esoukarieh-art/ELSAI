"""Wrapper minimal autour de Plausible Stats API v2.

Tout est optionnel : si ni `plausible_site_id` ni `plausible_api_key` ne sont
configurés, le wrapper retourne `{"configured": False}` et la UI affiche un
fallback. Aucun PII n'est envoyé : on exploite uniquement les events
Plausible agrégés (anonymes, sans cookies).
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from ..config import settings

logger = logging.getLogger(__name__)


PERIOD_MAP = {
    "7d": "7d",
    "30d": "30d",
    "90d": "30d",  # Plausible v2 ne propose pas 90d natif, on retombera sur 30d
}


def is_configured() -> bool:
    return bool(settings.plausible_site_id and settings.plausible_api_key)


def query_plausible(
    metrics: list[str],
    filters: list[list[Any]] | None = None,
    dimensions: list[str] | None = None,
    period: str = "30d",
    timeout: float = 6.0,
) -> dict:
    """Appelle Plausible Stats API v2. Retourne {configured: False} sinon.

    metrics : ex. ["visitors", "pageviews", "events"]
    filters : liste d'ops Plausible, ex. [["is", "event:goal", ["pwa_start"]]]
    dimensions : ex. ["event:props:post_slug"]
    """

    if not is_configured():
        return {"configured": False}

    payload: dict[str, Any] = {
        "site_id": settings.plausible_site_id,
        "metrics": metrics,
        "date_range": PERIOD_MAP.get(period, "30d"),
    }
    if filters:
        payload["filters"] = filters
    if dimensions:
        payload["dimensions"] = dimensions

    headers = {
        "Authorization": f"Bearer {settings.plausible_api_key}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(settings.plausible_api_url, json=payload, headers=headers)
            if resp.status_code >= 400:
                logger.warning(
                    "plausible query failed status=%s body=%s", resp.status_code, resp.text[:300]
                )
                return {"configured": True, "ok": False, "error": f"status_{resp.status_code}"}
            return {"configured": True, "ok": True, "data": resp.json()}
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("plausible query exception: %s", exc)
        return {"configured": True, "ok": False, "error": str(exc)}


def extract_rows(result: dict) -> list[dict]:
    """Normalise la réponse Plausible v2 en liste de dicts {dimensions, metrics}."""
    if not result.get("ok"):
        return []
    data = result.get("data") or {}
    rows = data.get("results") or []
    out: list[dict] = []
    for r in rows:
        out.append({"dimensions": r.get("dimensions", []), "metrics": r.get("metrics", [])})
    return out
