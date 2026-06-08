"""Génération de pages SEO longue traîne (droit × situation × département)."""

from anthropic import Anthropic
from sqlalchemy.orm import Session as DBSession

from ..config import settings
from ..models import Department, LifeSituation, LongTailPage, Right

LONGTAIL_SYSTEM = """Tu es un rédacteur expert du droit social français.
Tu rédiges des pages d'information factuelles et utiles, dans un ton clair et empathique,
en tutoyant le lecteur. Pas de promesses, pas de faux espoirs.
Format markdown. Inclure :
- Une intro contextualisée à la situation et au département (3-4 phrases)
- Les critères d'éligibilité principaux
- Les démarches concrètes étape par étape
- Les contacts locaux (préfecture, CAF, MDPH, mairie selon pertinence)
- Une conclusion qui invite à poser sa question dans le chat ESLAÏ

Longueur cible : 500-700 mots. Pas de méta-commentaire, juste le contenu utile."""


def _client() -> Anthropic:
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY non définie dans .env")
    return Anthropic(api_key=settings.anthropic_api_key)


def composite_slug(right_slug: str, situation_slug: str, dept_slug: str) -> str:
    return f"{right_slug}-{situation_slug}-{dept_slug}"


def composite_title(right: Right, situation: LifeSituation, dept: Department) -> str:
    return f"{right.name} pour {situation.name.lower()} dans le {dept.name} ({dept.code})"


def generate_one(
    db: DBSession,
    right_slug: str,
    situation_slug: str,
    department_code: str,
    *,
    publish: bool = False,
) -> LongTailPage:
    right = db.query(Right).filter_by(slug=right_slug).first()
    situation = db.query(LifeSituation).filter_by(slug=situation_slug).first()
    dept = db.query(Department).filter_by(code=department_code).first()
    if not (right and situation and dept):
        raise ValueError("Right, situation ou département introuvable")

    cslug = composite_slug(right.slug, situation.slug, dept.slug)
    page = db.query(LongTailPage).filter_by(composite_slug=cslug).first()

    user_prompt = (
        f"Rédige la page d'information sur le droit '{right.name}' pour la situation "
        f"'{situation.name}' dans le département '{dept.name}' (préfecture : {dept.prefecture}, "
        f"région : {dept.region}).\n\n"
        f"Contexte droit : {right.description_md}\n"
        f"Contexte situation : {situation.context_md}\n"
    )

    response = _client().messages.create(
        model=settings.claude_model,
        max_tokens=2000,
        system=LONGTAIL_SYSTEM,
        messages=[{"role": "user", "content": user_prompt}],
    )
    content_md = "".join(block.text for block in response.content if hasattr(block, "text")).strip()
    word_count = len(content_md.split())

    title = composite_title(right, situation, dept)
    seo_description = (
        f"Tout savoir sur le {right.name} ({right.slug.upper()}) quand on est "
        f"dans la situation : {situation.name.lower()}, dans le {dept.name}. "
        f"Conditions, démarches, contacts."
    )[:280]

    status = "published" if (publish and word_count >= 350) else "draft"
    if status != "published" and word_count < 350:
        status = "noindex"

    if page is None:
        page = LongTailPage(
            right_slug=right.slug,
            situation_slug=situation.slug,
            department_code=dept.code,
            composite_slug=cslug,
            title=title,
            seo_description=seo_description,
            content_md=content_md,
            word_count=word_count,
            status=status,
        )
        db.add(page)
    else:
        page.title = title
        page.seo_description = seo_description
        page.content_md = content_md
        page.word_count = word_count
        page.status = status
    db.commit()
    db.refresh(page)
    return page


def generate_batch(
    db: DBSession,
    combinations: list[tuple[str, str, str]],
    *,
    publish: bool = False,
) -> list[LongTailPage]:
    """combinations : liste de (right_slug, situation_slug, department_code)."""
    out: list[LongTailPage] = []
    for r, s, d in combinations:
        try:
            out.append(generate_one(db, r, s, d, publish=publish))
        except Exception as exc:  # noqa: BLE001
            import logging

            logging.getLogger(__name__).warning(
                "longtail.generate_one failed: %s/%s/%s — %s", r, s, d, exc
            )
    return out
