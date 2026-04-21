"""Seed du contenu éditorial initial (blog, CTA, lead magnets).

Idempotent : ne recrée rien si les entrées existent déjà.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from ..models import BlogPost, CTABlock, LeadMagnet, PageContent
from ..page_schemas import default_blocks_for

# --- Article initial (recopié depuis frontend/lib/blog.ts) -------------------

_INITIAL_POST = {
    "slug": "10-milliards-aides-sociales-non-reclamees",
    "title": (
        "10 milliards d'euros d'aides sociales non réclamées chaque année : "
        "comprendre le non-recours"
    ),
    "description": (
        "Chaque année en France, près de 10 milliards d'euros d'aides sociales "
        "ne sont pas réclamés. Derrière ce chiffre de la DREES, un problème "
        "massif d'accès aux droits — et des leviers concrets pour l'entreprise "
        "comme pour les personnes concernées."
    ),
    "hero_eyebrow": "Droits sociaux",
    "tags": ["Non-recours", "DREES", "Droits sociaux"],
    "reading_minutes": 8,
    "date": "2026-04-17",
    "author_display": "L'équipe ELSAI",
}

_INITIAL_MDX = """# {title}

{description}

> TODO: importer corps depuis posts.tsx (refactor en P0.8).
""".strip()


# --- Bibliothèque CTA (17 composants) ---------------------------------------

# (key, component, label, audience)
_CTA_BLOCKS: list[tuple[str, str, str, str]] = [
    # 🎯 Conv. PWA
    ("chat_anonyme", "CTAChatAnonyme", "Pose ta question → /start", "all"),
    ("scan_document", "CTAScanDocument", "Envoie ton courrier → /scan", "all"),
    ("courrier_type", "CTACourrierType", "Génère ton courrier", "all"),
    # 📋 B2B
    ("demo_entreprise", "CTADemoEntreprise", "Démo entreprise", "b2b"),
    ("plaquette_b2b", "CTAPlaquetteB2B", "Télécharger la plaquette B2B", "b2b"),
    ("booking_rdv", "CTABookingRDV", "Prendre RDV 15 min", "b2b"),
    # 📬 Email
    ("newsletter_inline", "CTANewsletterInline", "Opt-in newsletter", "all"),
    ("lead_magnet", "CTALeadMagnet", "Guide PDF — déclenche séquence", "all"),
    ("alert_mise_a_jour", "CTAAlertMiseAJour", "Alerte obsolescence barème", "all"),
    # 🆘 Urgences
    ("urgence_119", "CTAUrgence119", "Mineurs en danger — 119", "minor"),
    ("urgence_3919", "CTAUrgence3919", "Violences conjugales — 3919", "all"),
    ("urgence_115", "CTAUrgence115", "Hébergement d'urgence — 115", "all"),
    ("urgence_3114", "CTAUrgence3114", "Prévention suicide — 3114", "all"),
    # 🔗 Maillage
    ("article_lie", "CTAArticleLie", "Article du même cluster", "all"),
    ("pillar_hub", "CTAPillarHub", "Lien vers pillar page", "all"),
    ("faq_inline", "CTAFAQInline", "FAQ expandable", "all"),
    # 📍 Action
    ("annuaire_geo", "CTAAnnuaireGeo", "Trouve un CCAS — annuaire géolocalisé", "all"),
]


# --- Lead magnets placeholder ------------------------------------------------

_LEAD_MAGNETS: list[dict] = [
    {
        "key": "guide_droits_18_ans",
        "title": "Guide : tes droits à 18 ans",
        "description": "Checklist des démarches sociales à l'entrée dans la majorité.",
        "audience": "adult",
        "trigger_sequence_key": None,
        "active": False,
    },
    {
        "key": "guide_b2b_non_recours",
        "title": "Guide B2B : lutter contre le non-recours",
        "description": "Leviers RH pour les entreprises face aux 10 Md€ d'aides non réclamées.",
        "audience": "b2b",
        "trigger_sequence_key": None,
        "active": False,
    },
]


def seed_content(db: Session) -> None:
    """Seed idempotent du contenu initial (blog, CTA, lead magnets)."""

    # 1. Blog post initial ---------------------------------------------------
    if db.query(BlogPost).count() == 0:
        published_at = datetime.fromisoformat(_INITIAL_POST["date"])
        post = BlogPost(
            slug=_INITIAL_POST["slug"],
            title=_INITIAL_POST["title"],
            description=_INITIAL_POST["description"],
            hero_eyebrow=_INITIAL_POST["hero_eyebrow"],
            content_mdx=_INITIAL_MDX.format(
                title=_INITIAL_POST["title"],
                description=_INITIAL_POST["description"],
            ),
            tags_json=json.dumps(_INITIAL_POST["tags"], ensure_ascii=False),
            reading_minutes=_INITIAL_POST["reading_minutes"],
            audience="adult",
            status="published",
            published_at=published_at,
            schema_type="Article",
            readability_level="B1",
            author_display=_INITIAL_POST["author_display"],
            seo_title=_INITIAL_POST["title"],
            seo_description=_INITIAL_POST["description"],
        )
        db.add(post)

    # 2. CTA blocks ----------------------------------------------------------
    for key, component, label, audience in _CTA_BLOCKS:
        exists = (
            db.query(CTABlock)
            .filter(CTABlock.key == key, CTABlock.variant == "control")
            .first()
        )
        if exists is None:
            db.add(
                CTABlock(
                    key=key,
                    label=label,
                    variant="control",
                    component=component,
                    audience=audience,
                    props_json="{}",
                    auto_inject_rules_json="{}",
                    weight=100,
                    active=True,
                )
            )

    # 3. Lead magnets --------------------------------------------------------
    for lm in _LEAD_MAGNETS:
        exists = db.query(LeadMagnet).filter(LeadMagnet.key == lm["key"]).first()
        if exists is None:
            db.add(LeadMagnet(**lm))

    # 4. Page d'accueil (CMS) -----------------------------------------------
    home = db.query(PageContent).filter(PageContent.page_key == "home").first()
    if home is None:
        db.add(
            PageContent(
                page_key="home",
                title="ELSAI – Assistant social numérique",
                blocks_json=json.dumps(default_blocks_for("home"), ensure_ascii=False),
                audience="all",
                status="published",
                published_at=datetime.now(UTC),
                seo_title="ELSAI — Service social numérique de premier accueil",
                seo_description=(
                    "Assistant social numérique qui répond à vos questions "
                    "administratives, sociales, familiales ou juridiques. "
                    "Anonymement, sans rendez-vous, sans jugement."
                ),
            )
        )

    # 5. Autres pages vitrine (CMS) -----------------------------------------
    other_pages: list[dict] = [
        {
            "page_key": "pour-qui",
            "title": "ELSAI – Pour qui ?",
            "seo_title": "Pour qui ? Adultes, 12-18 ans & employeurs",
            "seo_description": (
                "ELSAI accompagne trois publics : les adultes (CAF, impôts, logement, "
                "MDPH…), les mineurs de 12 à 18 ans avec un protocole de sécurité, et "
                "les employeurs qui souhaitent équiper leurs salariés."
            ),
        },
        {
            "page_key": "comment-ca-marche",
            "title": "ELSAI – Comment ça marche",
            "seo_title": "Comment ça marche",
            "seo_description": (
                "Le fonctionnement d'ELSAI en 4 étapes : vous posez votre question, "
                "ELSAI comprend, vous guide étape par étape, vous gardez la main sur "
                "vos données."
            ),
        },
        {
            "page_key": "ethique",
            "title": "ELSAI – Éthique & confidentialité",
            "seo_title": "Éthique & confidentialité",
            "seo_description": (
                "Anonymat par défaut, droit à l'oubli, hébergement en France, "
                "protection des mineurs avec orientation 119. Nos engagements "
                "éthiques détaillés."
            ),
        },
        {
            "page_key": "faq",
            "title": "ELSAI – FAQ",
            "seo_title": "Questions fréquentes",
            "seo_description": (
                "Réponses aux questions fréquentes sur ELSAI : anonymat, fiabilité "
                "des réponses, données personnelles, situations d'urgence, "
                "accompagnement humain."
            ),
        },
        {
            "page_key": "contact",
            "title": "ELSAI – Contact",
            "seo_title": "Contact",
            "seo_description": (
                "Une question sur le projet, un partenariat, une offre entreprise, une "
                "remarque ? Écrivez-nous. ELSAI est un projet à taille humaine et "
                "chaque message est lu."
            ),
        },
        {
            "page_key": "exemples-concrets",
            "title": "ELSAI – Exemples concrets",
            "seo_title": "Exemples concrets",
            "seo_description": (
                "Des situations concrètes où ELSAI peut vous aider : ouverture de "
                "droits, refus de RSA, surendettement, violences, logement d'urgence."
            ),
        },
        {
            "page_key": "offre",
            "title": "ELSAI – Offre entreprises",
            "seo_title": "Offre entreprises — Un service social pour vos salariés",
            "seo_description": (
                "Offrez à vos équipes un accueil social confidentiel, disponible "
                "24h/24h. À partir de 3 € par salarié et par mois. Anonymat garanti, "
                "hébergé en France."
            ),
        },
        {
            "page_key": "partenariats",
            "title": "ELSAI – Partenariats",
            "seo_title": "Partenariats — Construisons l'impact ensemble",
            "seo_description": (
                "ELSAI se déploie en complémentarité des services sociaux publics. "
                "CCAS, collectivités, associations, France Services : construisons "
                "ensemble un relais numérique utile à vos usagers."
            ),
        },
    ]

    for page in other_pages:
        key = page["page_key"]
        exists = db.query(PageContent).filter(PageContent.page_key == key).first()
        if exists is None:
            db.add(
                PageContent(
                    page_key=key,
                    title=page["title"],
                    blocks_json=json.dumps(default_blocks_for(key), ensure_ascii=False),
                    audience="all",
                    status="published",
                    published_at=datetime.now(UTC),
                    seo_title=page["seo_title"],
                    seo_description=page["seo_description"],
                )
            )

    db.commit()
