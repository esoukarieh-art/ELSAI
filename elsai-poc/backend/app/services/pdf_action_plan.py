"""Génération PDF d'un plan d'action à partir d'une conversation.

Le PDF n'est jamais stocké côté serveur (anonymat préservé).
"""

from __future__ import annotations

import io
import json
from dataclasses import dataclass

from anthropic import Anthropic
from sqlalchemy.orm import Session as DBSession

from ..config import settings
from ..models import Conversation, Message

EXTRACT_SYSTEM = """Tu es un assistant qui extrait un plan d'action à partir d'une
conversation entre un utilisateur et ESLAÏ (assistant social numérique).

Lis l'historique de la conversation et produis EXCLUSIVEMENT un JSON valide :
{
  "title": "titre court du plan",
  "summary": "résumé en 1-2 phrases",
  "steps": [
    {
      "title": "étape courte",
      "why": "pourquoi cette étape",
      "documents": ["doc1", "doc2"],
      "contact": "interlocuteur (CAF, MDPH, Mission Locale, 115...)"
    }
  ]
}
Maximum 6 étapes. Tutoyer. Pas de texte hors JSON. Aucun PII inventé."""


@dataclass
class ActionPlan:
    title: str
    summary: str
    steps: list[dict]


def _client() -> Anthropic:
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY non définie dans .env")
    return Anthropic(api_key=settings.anthropic_api_key)


def extract_action_plan(db: DBSession, conversation_id: str) -> ActionPlan:
    msgs = (
        db.query(Message)
        .filter_by(conversation_id=conversation_id)
        .order_by(Message.created_at)
        .all()
    )
    if not msgs:
        raise ValueError("Conversation vide")

    transcript = "\n".join(f"{m.role.upper()}: {m.content}" for m in msgs)
    response = _client().messages.create(
        model=settings.claude_model,
        max_tokens=1500,
        system=EXTRACT_SYSTEM,
        messages=[{"role": "user", "content": transcript}],
    )
    raw = "".join(b.text for b in response.content if hasattr(b, "text")).strip()
    # tolère ```json ... ```
    if raw.startswith("```"):
        raw = raw.strip("`")
        first_newline = raw.find("\n")
        if first_newline >= 0:
            raw = raw[first_newline + 1 :]
        if raw.endswith("```"):
            raw = raw[:-3]
    data = json.loads(raw)
    return ActionPlan(
        title=data.get("title", "Plan d'action"),
        summary=data.get("summary", ""),
        steps=list(data.get("steps", []))[:6],
    )


def render_pdf(plan: ActionPlan) -> bytes:
    """Génère un PDF mis en page (charte ELSAÏ : Vert Pin, Vieux Rose, Crème)."""
    try:
        from weasyprint import HTML
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("weasyprint non installé — lancer pip install -r requirements.txt") from exc

    steps_html = "".join(
        f"""
        <li>
          <h3>{i + 1}. {esc(s.get('title', ''))}</h3>
          <p class="why"><strong>Pourquoi :</strong> {esc(s.get('why', ''))}</p>
          {('<p class="contact"><strong>Interlocuteur :</strong> ' + esc(s.get('contact', '')) + '</p>') if s.get('contact') else ''}
          {render_docs(s.get('documents', []))}
        </li>
        """
        for i, s in enumerate(plan.steps)
    )

    html = f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/><title>{esc(plan.title)}</title>
<style>
  @page {{ size: A4; margin: 18mm; }}
  body {{ font-family: 'Helvetica', sans-serif; color: #2A3D32; line-height: 1.5; }}
  h1 {{ color: #3F5A4E; font-size: 26pt; margin: 0 0 6pt; }}
  .summary {{ color: #5A7E6B; font-size: 12pt; margin-bottom: 18pt; font-style: italic; }}
  ol {{ list-style: none; padding: 0; }}
  ol li {{ background: #F5F5ED; border-left: 4px solid #5A7E6B; padding: 12pt 14pt; margin-bottom: 10pt; border-radius: 6pt; }}
  ol li h3 {{ color: #3F5A4E; font-size: 13pt; margin: 0 0 6pt; }}
  .why, .contact, .docs {{ font-size: 10pt; margin: 4pt 0; }}
  .docs ul {{ margin: 4pt 0 0 18pt; padding: 0; }}
  .footer {{ margin-top: 22pt; padding-top: 10pt; border-top: 1px solid #9B7F7F; font-size: 9pt; color: #9B7F7F; text-align: center; }}
</style></head>
<body>
  <h1>{esc(plan.title)}</h1>
  <p class="summary">{esc(plan.summary)}</p>
  <ol>{steps_html}</ol>
  <div class="footer">
    Généré par ESLAÏ — elsai.fr — N'est pas un document officiel.
    Vos données ne sont pas conservées côté serveur.
  </div>
</body></html>"""

    buf = io.BytesIO()
    HTML(string=html).write_pdf(buf)
    return buf.getvalue()


def render_docs(docs: list) -> str:
    if not docs:
        return ""
    items = "".join(f"<li>{esc(str(d))}</li>" for d in docs)
    return f'<div class="docs"><strong>Documents à préparer :</strong><ul>{items}</ul></div>'


def esc(s: str) -> str:
    return (
        str(s)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
