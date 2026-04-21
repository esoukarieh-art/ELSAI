"""Définitions de schéma pour les pages éditoriales (CMS admin).

Chaque entrée PAGE_SCHEMAS[key] décrit les blocs autorisés et leurs champs.
L'UI admin génère dynamiquement le formulaire à partir de ce schéma ; le
backend le renvoie tel quel dans GET /api/admin/pages/{key}.

Types de champ supportés :
    - "text"      : input simple
    - "textarea"  : zone texte multi-ligne
    - "url"       : input type=url
    - "image"     : URL d'image (uploader disponible dans l'UI)
    - "list"      : liste répétable d'items (chaque item = sous-champs)
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any


HOME_SCHEMA: dict[str, Any] = {
    "label": "Page d'accueil",
    "seo": True,
    "blocks": [
        {
            "key": "hero",
            "label": "Hero (bandeau principal)",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre principal", "type": "text", "required": True},
                {"key": "subtitle", "label": "Sous-titre", "type": "textarea"},
                {"key": "note", "label": "Note (ligne grasse)", "type": "text"},
                {"key": "cta_primary_label", "label": "CTA principal - texte", "type": "text"},
                {"key": "cta_primary_href", "label": "CTA principal - lien", "type": "url"},
                {"key": "cta_secondary_label", "label": "CTA secondaire - texte", "type": "text"},
                {"key": "cta_secondary_href", "label": "CTA secondaire - lien", "type": "url"},
                {"key": "trust_line", "label": "Ligne de confiance (puces séparées par ·)", "type": "text"},
                {"key": "image_url", "label": "Image (SVG/PNG)", "type": "image"},
                {"key": "image_alt", "label": "Texte alternatif image", "type": "text"},
            ],
        },
        {
            "key": "differentiators",
            "label": "Différenciateurs",
            "max": 1,
            "fields": [
                {"key": "title", "label": "Titre de section", "type": "text"},
                {
                    "key": "items",
                    "label": "Items",
                    "type": "list",
                    "item_fields": [
                        {"key": "title", "label": "Titre", "type": "text", "required": True},
                        {"key": "body", "label": "Texte", "type": "textarea"},
                    ],
                },
            ],
        },
        {
            "key": "use_cases",
            "label": "Cas d'usage",
            "max": 1,
            "fields": [
                {"key": "title", "label": "Titre de section", "type": "text"},
                {"key": "link_label", "label": "Libellé lien « voir tous »", "type": "text"},
                {"key": "link_href", "label": "Lien « voir tous »", "type": "url"},
                {
                    "key": "items",
                    "label": "Items",
                    "type": "list",
                    "item_fields": [
                        {"key": "tag", "label": "Tag (badge)", "type": "text"},
                        {"key": "title", "label": "Titre", "type": "text", "required": True},
                        {"key": "body", "label": "Texte", "type": "textarea"},
                    ],
                },
            ],
        },
        {
            "key": "for_whom",
            "label": "Pour qui",
            "max": 1,
            "fields": [
                {"key": "adults_title", "label": "Adultes - Titre", "type": "text"},
                {"key": "adults_body", "label": "Adultes - Texte", "type": "textarea"},
                {"key": "adults_link_label", "label": "Adultes - Libellé lien", "type": "text"},
                {"key": "adults_link_href", "label": "Adultes - Lien", "type": "url"},
                {"key": "minors_title", "label": "12-18 ans - Titre", "type": "text"},
                {"key": "minors_body", "label": "12-18 ans - Texte", "type": "textarea"},
                {"key": "minors_link_label", "label": "12-18 ans - Libellé lien", "type": "text"},
                {"key": "minors_link_href", "label": "12-18 ans - Lien", "type": "url"},
            ],
        },
        {
            "key": "employer",
            "label": "Bloc employeurs",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text", "required": True},
                {"key": "body", "label": "Texte", "type": "textarea"},
                {"key": "cta_label", "label": "CTA - texte", "type": "text"},
                {"key": "cta_href", "label": "CTA - lien", "type": "url"},
            ],
        },
        {
            "key": "final_cta",
            "label": "CTA final",
            "max": 1,
            "fields": [
                {"key": "title", "label": "Titre", "type": "text", "required": True},
                {"key": "body", "label": "Texte", "type": "textarea"},
                {"key": "cta_label", "label": "CTA - texte", "type": "text"},
                {"key": "cta_href", "label": "CTA - lien", "type": "url"},
            ],
        },
    ],
}


# Seed : contenu actuellement hard-codé dans frontend/app/(site)/page.tsx.
# Ces blocks sont utilisés :
#   1) lors du seed initial de la BDD (content_seed)
#   2) en fallback côté frontend si l'API est down / 404.
_HOME_DEFAULT_BLOCKS: list[dict[str, Any]] = [
    {
        "type": "hero",
        "eyebrow": "Service social numérique de premier accueil",
        "title": "Assistant social numérique",
        "subtitle": (
            "Répond à toutes vos questions administratives, sociales, familiales "
            "ou juridiques et vous oriente vers le bon interlocuteur si besoin."
        ),
        "note": "Anonymement. Sans rendez-vous. Sans jugement.",
        "cta_primary_label": "Poser ma question →",
        "cta_primary_href": "/start",
        "cta_secondary_label": "Comment ça marche",
        "cta_secondary_href": "/comment-ca-marche",
        "trust_line": "✓ Sans inscription · ✓ Hébergé en France · ✓ Sans cookies",
        "image_url": "/logo-elsai.svg",
        "image_alt": "",
    },
    {
        "type": "differentiators",
        "title": "Un service accessible 24h/24h, créé par une assistante sociale diplômée.",
        "items": [
            {
                "title": "Anonyme par défaut",
                "body": (
                    "Aucun nom, aucun email requis. Vous pouvez tout effacer en un clic, "
                    "sans laisser de trace."
                ),
            },
            {
                "title": "Sans rendez-vous, sans déplacement",
                "body": (
                    "Pour une question simple ou un conseil, pas besoin de prendre "
                    "rendez-vous ni de vous déplacer. Vous posez votre question quand "
                    "vous pouvez, d'où vous voulez."
                ),
            },
            {
                "title": "Sans le regard de l'autre",
                "body": (
                    "Certaines situations sont difficiles à formuler en face d'un "
                    "professionnel. Ici, vous pouvez prendre le temps, sans être "
                    "jugé·e, sans avoir à justifier."
                ),
            },
            {
                "title": "Empathique et franc",
                "body": (
                    "On vous écoute vraiment. Et si un droit n'existe pas, on vous "
                    "le dit clairement — pas de faux espoirs."
                ),
            },
        ],
    },
    {
        "type": "use_cases",
        "title": "À quoi ça sert concrètement ?",
        "link_label": "Voir tous les exemples →",
        "link_href": "/exemples-concrets",
        "items": [
            {
                "tag": "À 18 ans",
                "title": "Comprendre mes droits quand je deviens majeur·e",
                "body": (
                    "Aide pour comprendre la CAF, la sécu, le logement étudiant, "
                    "les aides jeunesse."
                ),
            },
            {
                "tag": "RSA refusé",
                "title": "On m'a refusé le RSA, est-ce normal ?",
                "body": (
                    "On relit ensemble la lettre, on vérifie vos droits, on prépare "
                    "un recours."
                ),
            },
            {
                "tag": "Ado en difficulté",
                "title": "Ça ne va pas à la maison ou au collège",
                "body": "Un espace anonyme pour poser des mots. Sans jugement, sans dossier.",
            },
            {
                "tag": "Logement d'urgence",
                "title": "Je n'ai pas où dormir ce soir",
                "body": (
                    "Les numéros utiles, les démarches immédiates, les lieux près de "
                    "chez vous."
                ),
            },
        ],
    },
    {
        "type": "for_whom",
        "adults_title": "Pour les adultes",
        "adults_body": (
            "CAF, impôts, logement, emploi, surendettement, MDPH… On vous parle "
            "clairement, sans jargon, et on vous guide étape par étape."
        ),
        "adults_link_label": "Votre parcours →",
        "adults_link_href": "/pour-qui#adultes",
        "minors_title": "Pour les 12-18 ans",
        "minors_body": (
            "Vos droits, l'école, la famille, ce qui ne va pas. On vous écoute, "
            "et si vous préférez qu'on vous tutoie, il suffit de le dire. Si c'est "
            "grave, on vous oriente vers le 119 ou une Maison des Ados."
        ),
        "minors_link_label": "Votre espace →",
        "minors_link_href": "/pour-qui#mineurs",
    },
    {
        "type": "employer",
        "eyebrow": "Vous êtes employeur ?",
        "title": "Offrez ELSAI à vos salariés, à partir de 3 € par mois.",
        "body": (
            "Un avantage social concret, 100% confidentiel, qui soulage vos "
            "équipes sur leurs démarches personnelles — sans créer de service "
            "RH dédié."
        ),
        "cta_label": "Voir l'offre →",
        "cta_href": "/offre",
    },
    {
        "type": "final_cta",
        "title": "Vous pouvez tester ce service gratuitement.",
        "body": "Sans aucune inscription. Ce que vous écrivez peut s'effacer en un clic.",
        "cta_label": "Poser ma question",
        "cta_href": "/start",
    },
]


PAGE_SCHEMAS: dict[str, dict[str, Any]] = {"home": HOME_SCHEMA}

_DEFAULT_BLOCKS: dict[str, list[dict[str, Any]]] = {"home": _HOME_DEFAULT_BLOCKS}


def get_schema(page_key: str) -> dict[str, Any] | None:
    schema = PAGE_SCHEMAS.get(page_key)
    return deepcopy(schema) if schema else None


def default_blocks_for(page_key: str) -> list[dict[str, Any]]:
    return deepcopy(_DEFAULT_BLOCKS.get(page_key, []))
