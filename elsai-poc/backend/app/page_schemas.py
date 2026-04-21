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


# ============================================================================
# POUR QUI
# ============================================================================

POUR_QUI_SCHEMA: dict[str, Any] = {
    "label": "Page « Pour qui »",
    "seo": True,
    "blocks": [
        {
            "key": "hero",
            "label": "Hero",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text", "required": True},
                {"key": "subtitle", "label": "Sous-titre", "type": "textarea"},
            ],
        },
        {
            "key": "adults",
            "label": "Parcours adultes",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre (badge)", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text"},
                {"key": "intro", "label": "Intro (carte sticky)", "type": "textarea"},
                {"key": "cta_label", "label": "CTA - texte", "type": "text"},
                {"key": "cta_href", "label": "CTA - lien", "type": "url"},
                {"key": "heading", "label": "Titre liste", "type": "text"},
                {
                    "key": "items",
                    "label": "Items (demandes possibles)",
                    "type": "list",
                    "item_fields": [
                        {"key": "label", "label": "Libellé", "type": "text", "required": True},
                    ],
                },
                {"key": "footer", "label": "Note de bas", "type": "textarea"},
            ],
        },
        {
            "key": "minors",
            "label": "Parcours 12-18 ans",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre (badge)", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text"},
                {"key": "intro", "label": "Intro (carte sticky)", "type": "textarea"},
                {"key": "cta_label", "label": "CTA - texte", "type": "text"},
                {"key": "cta_href", "label": "CTA - lien", "type": "url"},
                {"key": "heading", "label": "Titre liste", "type": "text"},
                {
                    "key": "items",
                    "label": "Items (sujets possibles)",
                    "type": "list",
                    "item_fields": [
                        {"key": "label", "label": "Libellé", "type": "text", "required": True},
                    ],
                },
                {"key": "danger_title", "label": "Encadré danger - titre", "type": "text"},
                {"key": "danger_body", "label": "Encadré danger - texte", "type": "textarea"},
            ],
        },
        {
            "key": "employers",
            "label": "Parcours employeurs",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre (badge)", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text"},
                {"key": "intro", "label": "Intro (carte sticky)", "type": "textarea"},
                {"key": "cta_label", "label": "CTA - texte", "type": "text"},
                {"key": "cta_href", "label": "CTA - lien", "type": "url"},
                {"key": "heading", "label": "Titre liste", "type": "text"},
                {
                    "key": "items",
                    "label": "Items (besoins employeurs)",
                    "type": "list",
                    "item_fields": [
                        {"key": "label", "label": "Libellé", "type": "text", "required": True},
                    ],
                },
                {"key": "footer", "label": "Note de bas", "type": "textarea"},
            ],
        },
    ],
}

_POUR_QUI_DEFAULT_BLOCKS: list[dict[str, Any]] = [
    {
        "type": "hero",
        "eyebrow": "Pour qui\u00a0?",
        "title": "Trois parcours, une même promesse\u00a0: personne ne reste seul.",
        "subtitle": (
            "ELSAI parle différemment aux adultes, aux jeunes et aux entreprises qui "
            "veulent équiper leurs salariés. Chacun avec la bonne posture."
        ),
    },
    {
        "type": "adults",
        "eyebrow": "Parcours",
        "title": "Adultes (18+)",
        "intro": "Vouvoiement, ton clair et précis, priorité à l'action.",
        "cta_label": "Commencer →",
        "cta_href": "/start",
        "heading": "Ce que vous pouvez nous demander",
        "items": [
            {"label": "CAF, APL, RSA, prime d'activité"},
            {"label": "Impôts, déclaration, contentieux"},
            {"label": "Logement, expulsion, impayés"},
            {"label": "Emploi, France Travail, formation"},
            {"label": "Santé, CSS, AME, CPAM"},
            {"label": "Surendettement, Banque de France"},
            {"label": "Handicap, MDPH, AAH, RQTH"},
            {"label": "Retraite, minimum vieillesse (ASPA)"},
        ],
        "footer": (
            "Les situations d'urgence sont détectées et orientées vers le 115, le 3919, "
            "ou le 3114 selon le contexte."
        ),
    },
    {
        "type": "minors",
        "eyebrow": "Parcours",
        "title": "12 → 18 ans",
        "intro": (
            "Vouvoiement par défaut, tutoiement si vous préférez. Espace bienveillant. "
            "On ne dit rien à vos parents — sauf si vous êtes en danger."
        ),
        "cta_label": "Parler à ELSAI →",
        "cta_href": "/start",
        "heading": "Vous pouvez nous parler de…",
        "items": [
            {"label": "Ce qui se passe à la maison"},
            {"label": "L'école, le harcèlement, les notes"},
            {"label": "Les amitiés, l'amour, les réseaux"},
            {"label": "Votre corps, la santé, la contraception"},
            {"label": "Vos droits (vous en avez plein\u00a0!)"},
            {"label": "Quand ça ne va pas dans votre tête"},
            {"label": "Les violences que vous subissez ou voyez"},
            {"label": "Comment trouver de l'aide humaine"},
        ],
        "danger_title": "Si vous êtes en danger maintenant\u00a0:",
        "danger_body": (
            "Appelez le 119 (Enfance en danger, 24h/24h, gratuit, anonyme). ELSAI vous "
            "le rappellera aussi si besoin."
        ),
    },
    {
        "type": "employers",
        "eyebrow": "Parcours",
        "title": "Employeurs",
        "intro": (
            "Vouvoiement, ton business, orienté décision. Une offre claire pour équiper "
            "vos salariés d'un accueil social confidentiel."
        ),
        "cta_label": "Voir l'offre entreprises →",
        "cta_href": "/offre",
        "heading": "Ce que vous cherchez probablement",
        "items": [
            {"label": "Un avantage social différenciant"},
            {"label": "Une alternative aux EAP classiques"},
            {"label": "Réduire l'absentéisme lié aux démarches"},
            {"label": "Soigner la marque employeur"},
            {"label": "Une solution rapide à déployer"},
            {"label": "Une confidentialité totale salariés"},
            {"label": "Un coût maîtrisé (à partir de 3 €/mois)"},
            {"label": "Un reporting anonymisé exploitable"},
        ],
        "footer": (
            "Trois formules (Essentiel, Premium, Sur mesure) selon la taille de votre "
            "structure. Tarification au siège, engagement 12 mois, facturation mensuelle "
            "ou annuelle."
        ),
    },
]


# ============================================================================
# COMMENT CA MARCHE
# ============================================================================

COMMENT_CA_MARCHE_SCHEMA: dict[str, Any] = {
    "label": "Page « Comment ça marche »",
    "seo": True,
    "blocks": [
        {
            "key": "hero",
            "label": "Hero",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text", "required": True},
                {"key": "subtitle", "label": "Sous-titre", "type": "textarea"},
            ],
        },
        {
            "key": "steps",
            "label": "Étapes (processus)",
            "max": 1,
            "fields": [
                {
                    "key": "items",
                    "label": "Étapes",
                    "type": "list",
                    "item_fields": [
                        {"key": "number", "label": "Numéro (ex : 01)", "type": "text"},
                        {"key": "title", "label": "Titre", "type": "text", "required": True},
                        {"key": "body", "label": "Description", "type": "textarea"},
                    ],
                },
            ],
        },
        {
            "key": "capabilities",
            "label": "Ce qu'ELSAI fait / ne fait pas",
            "max": 1,
            "fields": [
                {"key": "title", "label": "Titre de section", "type": "text"},
                {"key": "can_title", "label": "Colonne « peut » - titre", "type": "text"},
                {
                    "key": "can_items",
                    "label": "Colonne « peut » - items",
                    "type": "list",
                    "item_fields": [
                        {"key": "label", "label": "Libellé", "type": "text", "required": True},
                    ],
                },
                {"key": "cant_title", "label": "Colonne « ne peut pas » - titre", "type": "text"},
                {
                    "key": "cant_items",
                    "label": "Colonne « ne peut pas » - items",
                    "type": "list",
                    "item_fields": [
                        {"key": "label", "label": "Libellé", "type": "text", "required": True},
                    ],
                },
            ],
        },
        {
            "key": "final_cta",
            "label": "CTA final",
            "max": 1,
            "fields": [
                {"key": "cta_label", "label": "CTA - texte", "type": "text"},
                {"key": "cta_href", "label": "CTA - lien", "type": "url"},
            ],
        },
    ],
}

_COMMENT_CA_MARCHE_DEFAULT_BLOCKS: list[dict[str, Any]] = [
    {
        "type": "hero",
        "eyebrow": "Comment ça marche",
        "title": "Simple et anonyme.",
        "subtitle": "Un échange en 4 étapes, 24h/24h. Vous gardez la main à chaque instant.",
    },
    {
        "type": "steps",
        "items": [
            {
                "number": "01",
                "title": "Vous posez votre question",
                "body": (
                    "En français courant. Pas besoin de connaître le nom des dispositifs. "
                    "Vous pouvez aussi déposer un courrier ou un document."
                ),
            },
            {
                "number": "02",
                "title": "ELSAI reformule et vous oriente",
                "body": (
                    "On vous répond clairement, avec des étapes concrètes et des liens "
                    "utiles. On vous dit aussi ce qu'ELSAI ne peut pas faire."
                ),
            },
            {
                "number": "03",
                "title": "Vous décidez, vous gardez la main",
                "body": (
                    "Vous pouvez poursuivre avec ELSAI, appeler un numéro, ou aller "
                    "rencontrer un travailleur social."
                ),
            },
            {
                "number": "04",
                "title": "Vous effacez si vous voulez",
                "body": (
                    "Un clic, tout disparaît. On ne conserve ni votre historique, ni vos "
                    "documents, ni votre profil."
                ),
            },
        ],
    },
    {
        "type": "capabilities",
        "title": "Ce qu'ELSAI fait — et ce qu'il ne fait pas",
        "can_title": "✓ ELSAI peut",
        "can_items": [
            {"label": "Expliquer un courrier administratif (CAF, CPAM, impôts, banque…)"},
            {"label": "Vous indiquer quels droits vous pouvez ouvrir"},
            {"label": "Rédiger un modèle de courrier ou de recours"},
            {"label": "Trouver le service social ou la Maison France Services la plus proche de chez vous"},
            {"label": "Vous orienter vers des numéros ou des lieux d'urgence"},
        ],
        "cant_title": "✗ ELSAI ne peut pas",
        "cant_items": [
            {"label": "Remplacer un travailleur social humain"},
            {"label": "Effectuer une démarche à votre place"},
            {"label": "Vous garantir l'obtention d'un droit"},
            {"label": "Intervenir en urgence vitale (→ 15, 17, 18, 112)"},
            {"label": "Conserver votre historique à votre insu"},
        ],
    },
    {
        "type": "final_cta",
        "cta_label": "Essayer maintenant →",
        "cta_href": "/start",
    },
]


# ============================================================================
# ETHIQUE
# ============================================================================

ETHIQUE_SCHEMA: dict[str, Any] = {
    "label": "Page « Éthique »",
    "seo": True,
    "blocks": [
        {
            "key": "hero",
            "label": "Hero",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text", "required": True},
                {"key": "subtitle", "label": "Sous-titre", "type": "textarea"},
            ],
        },
        {
            "key": "principles",
            "label": "Principes éthiques",
            "max": 1,
            "fields": [
                {
                    "key": "items",
                    "label": "Principes",
                    "type": "list",
                    "item_fields": [
                        {"key": "title", "label": "Titre", "type": "text", "required": True},
                        {"key": "body", "label": "Texte", "type": "textarea"},
                    ],
                },
            ],
        },
        {
            "key": "business_model",
            "label": "Modèle économique",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text"},
                {"key": "body1", "label": "Paragraphe 1", "type": "textarea"},
                {"key": "body2", "label": "Paragraphe 2", "type": "textarea"},
                {"key": "body3", "label": "Paragraphe 3", "type": "textarea"},
                {"key": "link_label", "label": "Lien - texte", "type": "text"},
                {"key": "link_href", "label": "Lien - URL", "type": "url"},
            ],
        },
        {
            "key": "posture",
            "label": "Posture éditoriale",
            "max": 1,
            "fields": [
                {"key": "title", "label": "Titre", "type": "text"},
                {"key": "body1", "label": "Paragraphe 1", "type": "textarea"},
                {"key": "body2", "label": "Paragraphe 2", "type": "textarea"},
                {"key": "body3", "label": "Paragraphe 3", "type": "textarea"},
            ],
        },
    ],
}

_ETHIQUE_DEFAULT_BLOCKS: list[dict[str, Any]] = [
    {
        "type": "hero",
        "eyebrow": "Notre éthique",
        "title": "Vous comptez plus que vos données.",
        "subtitle": (
            "ELSAI a été conçu pour des publics vulnérables. Chaque décision technique "
            "a été guidée par ce principe."
        ),
    },
    {
        "type": "principles",
        "items": [
            {
                "title": "Accessible sans se déplacer, sans rendez-vous",
                "body": (
                    "Pour une question simple ou un conseil, pas besoin de prendre "
                    "rendez-vous ni de vous déplacer dans une permanence. Et sans avoir "
                    "à formuler votre situation en face de quelqu'un — on sait que c'est "
                    "parfois le plus dur."
                ),
            },
            {
                "title": "Anonymat par défaut",
                "body": (
                    "Aucun nom, aucun email, aucune adresse. Vous pouvez utiliser ELSAI "
                    "sans créer de compte. Votre seul identifiant est une session "
                    "temporaire."
                ),
            },
            {
                "title": "Droit à l'oubli instantané",
                "body": (
                    "Un bouton, et tout disparaît\u00a0: l'historique, les documents, "
                    "les échanges. Sans délai, sans condition, sans justification."
                ),
            },
            {
                "title": "Hébergement souverain",
                "body": (
                    "Toutes les données transitent sur des serveurs hébergés en France "
                    "par un prestataire français (Scaleway / Clever Cloud)."
                ),
            },
            {
                "title": "Transparence sur les limites",
                "body": (
                    "ELSAI dit ce qu'il ne sait pas. Il n'invente pas de droits, ne "
                    "promet rien, n'imite pas un professionnel humain."
                ),
            },
            {
                "title": "Conçu par une assistante sociale diplômée",
                "body": (
                    "ELSAI a été pensé et co-conçu par une assistante sociale diplômée "
                    "d'État, pour garantir la justesse de la posture, du vocabulaire et "
                    "des orientations."
                ),
            },
            {
                "title": "Pas de profilage, pas de pub",
                "body": (
                    "ELSAI est un projet d'intérêt général. Aucun ciblage publicitaire, "
                    "aucun tracker, aucun cookie non-essentiel."
                ),
            },
        ],
    },
    {
        "type": "business_model",
        "eyebrow": "Modèle économique",
        "title": "Gratuit pour vous. Financé par les entreprises.",
        "body1": (
            "Le service est entièrement gratuit pour les particuliers, sans palier "
            "payant, sans abonnement, sans publicité. C'est un principe fondateur\u00a0: "
            "le coût ne doit jamais être un obstacle pour une personne en difficulté "
            "sociale."
        ),
        "body2": (
            "Le fonctionnement de la plateforme est financé par des entreprises clientes "
            "qui souscrivent un abonnement pour offrir ELSAI à leurs salariés, ainsi "
            "que par des subventions et fonds dédiés à l'économie sociale et solidaire "
            "(BPI, fonds ESS, appels à projets publics)."
        ),
        "body3": (
            "ELSAI est porté par une SAS en cours d'agrément ESUS (Entreprise Solidaire "
            "d'Utilité Sociale), un statut reconnu par l'État qui engage l'entreprise "
            "sur un objectif d'intérêt général."
        ),
        "link_label": "Voir l'offre entreprises",
        "link_href": "/offre",
    },
    {
        "type": "posture",
        "title": "Notre posture éditoriale",
        "body1": (
            "ELSAI parle empathiquement, mais aussi franchement. Si un droit n'existe "
            "pas, on vous le dit. Si une démarche est complexe, on ne le cache pas. Si "
            "ELSAI ne sait pas, il le dit aussi."
        ),
        "body2": (
            "Nous refusons la posture du «\u00a0coach motivationnel\u00a0» qui voudrait "
            "faire croire que tout se résout par la bonne attitude. Les droits sociaux "
            "sont un labyrinthe administratif — on peut vous y aider, pas le réécrire."
        ),
        "body3": (
            "ELSAI n'est pas un substitut à un travailleur social humain. C'est un sas, "
            "une première porte, un repère quand les permanences sont fermées."
        ),
    },
]


# ============================================================================
# FAQ
# ============================================================================

FAQ_SCHEMA: dict[str, Any] = {
    "label": "Page « FAQ »",
    "seo": True,
    "blocks": [
        {
            "key": "hero",
            "label": "Hero",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text", "required": True},
                {"key": "subtitle", "label": "Sous-titre (accepte HTML simple)", "type": "textarea"},
            ],
        },
        {
            "key": "faq",
            "label": "Questions / réponses",
            "max": 1,
            "fields": [
                {
                    "key": "items",
                    "label": "Items",
                    "type": "list",
                    "item_fields": [
                        {"key": "question", "label": "Question", "type": "text", "required": True},
                        {"key": "answer", "label": "Réponse", "type": "textarea", "required": True},
                    ],
                },
            ],
        },
    ],
}

_FAQ_DEFAULT_BLOCKS: list[dict[str, Any]] = [
    {
        "type": "hero",
        "eyebrow": "FAQ",
        "title": "Les questions qu'on nous pose.",
        "subtitle": "Pas la réponse que vous cherchez\u00a0? Écrivez-nous via /contact.",
    },
    {
        "type": "faq",
        "items": [
            {
                "question": "ELSAI, c'est gratuit\u00a0?",
                "answer": (
                    "Oui, totalement pour les particuliers. Sans palier payant, sans "
                    "abonnement, sans publicité, sans vente de données. Le service est "
                    "financé par des entreprises qui l'offrent à leurs salariés et par "
                    "des subventions dédiées à l'économie sociale et solidaire. Ce "
                    "modèle nous permet de garantir un accès libre et gratuit à toutes "
                    "et tous."
                ),
            },
            {
                "question": "Je suis employeur, est-ce qu'il y a une offre pour mon entreprise\u00a0?",
                "answer": (
                    "Oui. Nous proposons trois formules (Essentiel à 3 €/salarié/mois, "
                    "Premium à 5 €, Sur mesure) pour équiper vos équipes d'un accueil "
                    "social confidentiel. Les détails sont sur la page Offre entreprises."
                ),
            },
            {
                "question": "Est-ce que vous gardez ce que j'écris\u00a0?",
                "answer": (
                    "Par défaut, votre session est conservée temporairement pour que la "
                    "conversation reste cohérente. Vous pouvez tout effacer instantanément, "
                    "à n'importe quel moment. Nous ne revendons rien, jamais."
                ),
            },
            {
                "question": "Est-ce qu'ELSAI remplace un travailleur social\u00a0?",
                "answer": (
                    "Non. ELSAI est un premier point de contact\u00a0: il vous aide à y "
                    "voir clair, à comprendre vos droits, à préparer une démarche. Pour "
                    "un accompagnement approfondi, un humain (CCAS, France Services, "
                    "assistante sociale) reste indispensable."
                ),
            },
            {
                "question": "Est-ce fiable\u00a0? Comment savoir si l'info est juste\u00a0?",
                "answer": (
                    "ELSAI s'appuie sur des sources officielles françaises "
                    "(service-public.fr, CAF, CNAM, Légifrance). En cas de doute, il "
                    "vous dit «\u00a0je ne suis pas sûr\u00a0» et vous oriente vers la "
                    "source humaine adaptée."
                ),
            },
            {
                "question": "J'ai moins de 18 ans, est-ce que mes parents peuvent savoir\u00a0?",
                "answer": (
                    "Non. ELSAI est anonyme, même pour les mineurs. Seule exception\u00a0: "
                    "si vous êtes en danger grave, nous vous orienterons fermement vers "
                    "le 119 — mais ce sont eux qui gèrent le relais, pas nous."
                ),
            },
            {
                "question": "Et si je veux parler à un humain\u00a0?",
                "answer": (
                    "ELSAI vous donne les coordonnées du CCAS, de France Services ou de "
                    "l'association la plus proche de chez vous. Il peut aussi vous aider "
                    "à appeler un numéro d'urgence si vous le souhaitez."
                ),
            },
            {
                "question": "Qui est derrière ELSAI\u00a0?",
                "answer": (
                    "Un collectif d'acteurs du travail social et du numérique d'intérêt "
                    "général. Plus d'infos sur la page Partenariats, ou en nous écrivant "
                    "via la page Contact."
                ),
            },
            {
                "question": "Et les langues autres que le français\u00a0?",
                "answer": (
                    "La V1 est en français uniquement. Des versions simplifiées (FALC) "
                    "et multilingues sont prévues pour les versions suivantes."
                ),
            },
        ],
    },
]


# ============================================================================
# CONTACT
# ============================================================================

CONTACT_SCHEMA: dict[str, Any] = {
    "label": "Page « Contact »",
    "seo": True,
    "blocks": [
        {
            "key": "hero",
            "label": "Hero",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text", "required": True},
                {"key": "subtitle", "label": "Sous-titre", "type": "textarea"},
            ],
        },
        {
            "key": "form_notes",
            "label": "Notes autour du formulaire",
            "max": 1,
            "fields": [
                {"key": "entreprise_title", "label": "Bandeau entreprise - titre", "type": "text"},
                {"key": "entreprise_body", "label": "Bandeau entreprise - texte", "type": "textarea"},
                {"key": "privacy_note", "label": "Mention RGPD sous bouton", "type": "textarea"},
            ],
        },
        {
            "key": "aside_offer",
            "label": "Encadré « À propos de l'offre »",
            "max": 1,
            "fields": [
                {"key": "title", "label": "Titre", "type": "text"},
                {
                    "key": "items",
                    "label": "Points clés",
                    "type": "list",
                    "item_fields": [
                        {"key": "label", "label": "Libellé", "type": "text", "required": True},
                    ],
                },
                {"key": "link_label", "label": "Lien - texte", "type": "text"},
                {"key": "link_href", "label": "Lien - URL", "type": "url"},
            ],
        },
        {
            "key": "aside_difficulty",
            "label": "Encadré « Vous êtes en difficulté »",
            "max": 1,
            "fields": [
                {"key": "title", "label": "Titre", "type": "text"},
                {"key": "body", "label": "Texte (mentionne /start)", "type": "textarea"},
            ],
        },
        {
            "key": "aside_urgence",
            "label": "Encadré « Urgence vitale »",
            "max": 1,
            "fields": [
                {"key": "title", "label": "Titre", "type": "text"},
                {
                    "key": "items",
                    "label": "Numéros",
                    "type": "list",
                    "item_fields": [
                        {"key": "label", "label": "Ligne", "type": "text", "required": True},
                    ],
                },
            ],
        },
    ],
}

_CONTACT_DEFAULT_BLOCKS: list[dict[str, Any]] = [
    {
        "type": "hero",
        "eyebrow": "Contact",
        "title": "Nous écrire.",
        "subtitle": (
            "Cette page est réservée aux professionnels, partenaires, entreprises, "
            "journalistes et contributeurs. Pour une demande d'aide personnelle, "
            "rendez-vous sur le service (/start)."
        ),
    },
    {
        "type": "form_notes",
        "entreprise_title": "Demande pré-remplie",
        "entreprise_body": (
            "Nous vous répondrons sous 48h ouvrées avec une proposition adaptée à votre "
            "effectif."
        ),
        "privacy_note": (
            "En nous écrivant, vous acceptez que nous conservions votre email le temps "
            "nécessaire pour répondre."
        ),
    },
    {
        "type": "aside_offer",
        "title": "À propos de l'offre entreprises",
        "items": [
            {"label": "À partir de 3 € par salarié et par mois HT"},
            {"label": "Anonymat total vis-à-vis de l'employeur"},
            {"label": "Mise en place en moins de 2 semaines"},
            {"label": "Engagement 12 mois, facturation mensuelle ou annuelle"},
        ],
        "link_label": "Revoir le détail de l'offre →",
        "link_href": "/offre",
    },
    {
        "type": "aside_difficulty",
        "title": "Vous êtes en difficulté\u00a0?",
        "body": (
            "Cette page n'est pas un service d'assistance. Pour une demande d'aide, "
            "rendez-vous sur le service ELSAI (/start) — anonyme et disponible 24/7."
        ),
    },
    {
        "type": "aside_urgence",
        "title": "Urgence vitale",
        "items": [
            {"label": "15 — SAMU"},
            {"label": "17 — Police"},
            {"label": "18 — Pompiers"},
            {"label": "112 — Urgences UE"},
            {"label": "119 — Enfance en danger"},
            {"label": "3114 — Prévention du suicide"},
        ],
    },
]


# ============================================================================
# EXEMPLES CONCRETS
# ============================================================================

EXEMPLES_SCHEMA: dict[str, Any] = {
    "label": "Page « Exemples concrets »",
    "seo": True,
    "blocks": [
        {
            "key": "hero",
            "label": "Hero",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text", "required": True},
                {"key": "subtitle", "label": "Sous-titre", "type": "textarea"},
            ],
        },
        {
            "key": "cases",
            "label": "Cas concrets",
            "max": 1,
            "fields": [
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
    ],
}

_EXEMPLES_DEFAULT_BLOCKS: list[dict[str, Any]] = [
    {
        "type": "hero",
        "eyebrow": "Exemples concrets",
        "title": "Des situations concrètes où ELSAI peut vous aider.",
        "subtitle": "On ne remplace pas un humain. On vous aide à y voir plus clair.",
    },
    {
        "type": "cases",
        "items": [
            {
                "title": "Je ne sais pas quels sont mes droits",
                "body": (
                    "CAF, aides au logement, sécurité sociale, bourse… ELSAI fait un "
                    "diagnostic de votre situation et vous oriente vers les droits "
                    "auxquels vous pouvez éventuellement prétendre."
                ),
            },
            {
                "title": "On m'a refusé le RSA",
                "body": (
                    "On relit ensemble la lettre de refus, on vérifie si c'est justifié, "
                    "et on prépare un recours si justifié."
                ),
            },
            {
                "title": "Je ne me sens pas bien au collège ou à la maison",
                "body": (
                    "Famille, école, relations\u00a0: un espace anonyme pour poser des "
                    "mots. Si ELSAI perçoit un danger, elle vous orientera vers le bon "
                    "interlocuteur."
                ),
            },
            {
                "title": "Je ne sais pas où dormir ce soir",
                "body": (
                    "ELSAI vous explique les numéros à contacter et les démarches à "
                    "engager en fonction de votre lieu de vie."
                ),
            },
            {
                "title": "J'ai des problèmes financiers importants",
                "body": (
                    "Diagnostic de la situation, conseils financiers, et aide à la "
                    "constitution d'une déclaration de surendettement auprès de la "
                    "Banque de France si besoin."
                ),
            },
            {
                "title": "Je subis des violences",
                "body": (
                    "ELSAI vous explique les démarches que vous pouvez engager pour vous "
                    "protéger, et vous oriente vers les bons interlocuteurs (3919, 119, "
                    "Ligne Azur, dépôt de plainte, main courante, hébergement)."
                ),
            },
        ],
    },
]


# ============================================================================
# OFFRE (entreprises)
# ============================================================================

OFFRE_SCHEMA: dict[str, Any] = {
    "label": "Page « Offre entreprises »",
    "seo": True,
    "blocks": [
        {
            "key": "hero",
            "label": "Hero",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text", "required": True},
                {"key": "subtitle", "label": "Sous-titre", "type": "textarea"},
            ],
        },
        {
            "key": "constat",
            "label": "Constat (DREES)",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text"},
                {"key": "body", "label": "Texte d'intro", "type": "textarea"},
                {"key": "source", "label": "Source (ligne de bas)", "type": "text"},
                {
                    "key": "stats",
                    "label": "Chiffres clés",
                    "type": "list",
                    "item_fields": [
                        {"key": "chiffre", "label": "Chiffre", "type": "text", "required": True},
                        {"key": "label", "label": "Libellé", "type": "text"},
                    ],
                },
            ],
        },
        {
            "key": "salaries",
            "label": "Bénéfices salariés",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text"},
                {
                    "key": "items",
                    "label": "Bénéfices",
                    "type": "list",
                    "item_fields": [
                        {"key": "title", "label": "Titre", "type": "text", "required": True},
                        {"key": "body", "label": "Texte", "type": "textarea"},
                    ],
                },
            ],
        },
        {
            "key": "entreprise",
            "label": "Bénéfices entreprise",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text"},
                {
                    "key": "items",
                    "label": "Bénéfices",
                    "type": "list",
                    "item_fields": [
                        {"key": "title", "label": "Titre", "type": "text", "required": True},
                        {"key": "body", "label": "Texte", "type": "textarea"},
                    ],
                },
            ],
        },
        {
            "key": "tarifs",
            "label": "Tarifs (offres)",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text"},
                {"key": "intro", "label": "Intro", "type": "textarea"},
                {"key": "footer", "label": "Note facturation", "type": "textarea"},
                {
                    "key": "items",
                    "label": "Formules",
                    "type": "list",
                    "item_fields": [
                        {"key": "nom", "label": "Nom", "type": "text", "required": True},
                        {"key": "cible", "label": "Cible", "type": "text"},
                        {"key": "prix", "label": "Prix", "type": "text"},
                        {"key": "prix_unit", "label": "Unité prix", "type": "text"},
                        {"key": "highlight", "label": "Mise en avant (true/false)", "type": "text"},
                        {"key": "engagement", "label": "Engagement", "type": "text"},
                        {"key": "cta_label", "label": "CTA - texte", "type": "text"},
                        {"key": "cta_href", "label": "CTA - lien", "type": "url"},
                        {"key": "inclus", "label": "Inclus (un par ligne)", "type": "textarea"},
                    ],
                },
            ],
        },
        {
            "key": "deploiement",
            "label": "Déploiement (étapes)",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text"},
                {
                    "key": "items",
                    "label": "Étapes",
                    "type": "list",
                    "item_fields": [
                        {"key": "num", "label": "Numéro", "type": "text"},
                        {"key": "titre", "label": "Titre", "type": "text", "required": True},
                        {"key": "texte", "label": "Texte", "type": "textarea"},
                    ],
                },
            ],
        },
        {
            "key": "faq",
            "label": "FAQ employeur",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text"},
                {
                    "key": "items",
                    "label": "Questions / réponses",
                    "type": "list",
                    "item_fields": [
                        {"key": "question", "label": "Question", "type": "text", "required": True},
                        {"key": "answer", "label": "Réponse", "type": "textarea"},
                    ],
                },
            ],
        },
        {
            "key": "final_cta",
            "label": "CTA final (demande devis)",
            "max": 1,
            "fields": [
                {"key": "title", "label": "Titre", "type": "text"},
                {"key": "body", "label": "Texte", "type": "textarea"},
                {"key": "cta_label", "label": "CTA - texte", "type": "text"},
                {"key": "cta_href", "label": "CTA - lien", "type": "url"},
            ],
        },
    ],
}

_OFFRE_DEFAULT_BLOCKS: list[dict[str, Any]] = [
    {
        "type": "hero",
        "eyebrow": "Offre entreprises",
        "title": "Un service social pour vos salariés, sans service RH dédié.",
        "subtitle": (
            "ELSAI équipe vos équipes d'un accueil social confidentiel, disponible "
            "24h/24h. Un avantage social concret, à partir de 3 € par salarié et par "
            "mois."
        ),
    },
    {
        "type": "constat",
        "eyebrow": "Le constat",
        "title": "Vos salariés aussi passent à côté de leurs droits.",
        "body": (
            "Un collaborateur sur trois renonce à des aides sociales auxquelles il a "
            "droit, faute d'information ou par manque de temps pour faire les démarches. "
            "Ces difficultés pèsent sur la sérénité au travail — et finissent par vous "
            "coûter."
        ),
        "source": "Source\u00a0: DREES, enquête 2022 sur le non-recours aux prestations sociales.",
        "stats": [
            {"chiffre": "10 Md€", "label": "d'aides sociales non réclamées chaque année en France"},
            {"chiffre": "37 %", "label": "des non-recours sont dus au manque d'information"},
            {"chiffre": "34 %", "label": "des ayants droit au RSA ne le demandent pas"},
            {"chiffre": "44 %", "label": "des ayants droit à la Complémentaire Santé Solidaire non plus"},
        ],
    },
    {
        "type": "salaries",
        "eyebrow": "Pour vos salariés",
        "title": "Un accueil social qu'ils n'auront trouvé nulle part ailleurs.",
        "items": [
            {"title": "Accessible 24h/24h, 7j/7", "body": "Une question administrative à 22h un dimanche\u00a0? Vos salariés obtiennent une réponse tout de suite, sans attendre un rendez-vous."},
            {"title": "Anonymat total", "body": "Vos salariés utilisent un code d'accès personnel. Ni vous ni nous ne savons qui pose quelle question."},
            {"title": "IA supervisée par des assistantes sociales", "body": "Ce n'est pas un chatbot générique. Les réponses sont construites et vérifiées par des professionnelles diplômées d'État."},
            {"title": "Orientation vers les services publics", "body": "ELSAI ne remplace pas le service social\u00a0: elle clarifie la situation et oriente vers le bon interlocuteur (CAF, CPAM, CCAS, MDPH…)."},
        ],
    },
    {
        "type": "entreprise",
        "eyebrow": "Pour votre entreprise",
        "title": "Un bénéfice concret, mesurable, différenciant.",
        "items": [
            {"title": "Moins d'absentéisme", "body": "Les soucis de logement, de dette ou de famille sont une cause majeure d'arrêts et de baisse de productivité. ELSAI aide à les résoudre plus vite."},
            {"title": "Un avantage social différenciant", "body": "Rare dans les PME. Un signal fort pour la marque employeur, au même titre qu'une mutuelle renforcée ou un programme QVT."},
            {"title": "Confidentialité totale", "body": "Vous recevez uniquement des statistiques agrégées anonymisées. Aucun salarié n'est identifiable, jamais."},
            {"title": "Coût maîtrisé", "body": "À partir de 3 € par salarié et par mois, sans surprise. Bien en deçà du coût d'un service social interne."},
        ],
    },
    {
        "type": "tarifs",
        "eyebrow": "Tarifs",
        "title": "Trois formules, un principe\u00a0: la transparence.",
        "intro": "Tarification au siège salarié, sans frais cachés. Tous les prix sont hors taxes.",
        "footer": (
            "Facturation mensuelle ou annuelle (remise −10% en annuel). Paiement par "
            "virement SEPA ou prélèvement. TVA 20% en sus."
        ),
        "items": [
            {
                "nom": "Essentiel",
                "cible": "PME de 10 à 49 salariés",
                "prix": "3 €",
                "prix_unit": "par salarié / mois HT",
                "highlight": "false",
                "engagement": "Engagement 12 mois",
                "cta_label": "Souscrire",
                "cta_href": "/offre/souscrire?plan=essentiel",
                "inclus": (
                    "Accès illimité au chatbot IA (codes salariés)\n"
                    "2 consultations humaines par salarié / an\n"
                    "Reporting anonymisé trimestriel\n"
                    "Kit de communication interne fourni"
                ),
            },
            {
                "nom": "Premium",
                "cible": "PME & ETI de 50 à 499 salariés",
                "prix": "5 €",
                "prix_unit": "par salarié / mois HT",
                "highlight": "true",
                "engagement": "Engagement 12 mois",
                "cta_label": "Souscrire",
                "cta_href": "/offre/souscrire?plan=premium",
                "inclus": (
                    "Accès illimité au chatbot IA (codes salariés)\n"
                    "6 consultations humaines par salarié / an\n"
                    "Reporting anonymisé mensuel\n"
                    "1 demi-journée de permanence sur site / mois\n"
                    "2 ateliers collectifs / an (droits, budget, parentalité…)"
                ),
            },
            {
                "nom": "Sur mesure",
                "cible": "ETI & grands groupes (500+)",
                "prix": "Sur devis",
                "prix_unit": "tarification négociée",
                "highlight": "false",
                "engagement": "Engagement 24 mois",
                "cta_label": "Parlons-en",
                "cta_href": "/contact?sujet=offre-sur-mesure",
                "inclus": (
                    "Accès illimité au chatbot IA (codes salariés)\n"
                    "Consultations humaines selon besoin\n"
                    "Reporting anonymisé temps réel\n"
                    "Permanence sur site selon besoin\n"
                    "Ateliers collectifs illimités\n"
                    "Intégration SIRH possible"
                ),
            },
        ],
    },
    {
        "type": "deploiement",
        "eyebrow": "Déploiement",
        "title": "Opérationnel en moins de deux semaines.",
        "items": [
            {"num": "01", "titre": "Contrat & codes d'accès", "texte": "Nous signons le contrat, vous recevez un lot de codes d'accès personnels à distribuer à vos équipes."},
            {"num": "02", "titre": "Communication interne", "texte": "Nous vous fournissons un kit prêt à l'emploi (affiche, email type, message Slack/Teams) pour annoncer le service."},
            {"num": "03", "titre": "Vos salariés utilisent ELSAI", "texte": "Depuis leur téléphone ou leur ordinateur, à tout moment, en toute confidentialité. Vous recevez un reporting anonymisé."},
        ],
    },
    {
        "type": "faq",
        "eyebrow": "Questions fréquentes",
        "title": "Ce que les DRH nous demandent souvent.",
        "items": [
            {"question": "Comment est garantie la confidentialité vis-à-vis de l'employeur\u00a0?", "answer": "Chaque salarié dispose d'un code d'accès personnel. Aucune donnée nominative n'est transmise à l'employeur. Le reporting que vous recevez ne contient que des statistiques agrégées (thématiques les plus consultées, taux d'utilisation global)."},
            {"question": "Où sont hébergées les données\u00a0?", "answer": "En France, chez un hébergeur souverain. Aucune donnée n'est transférée hors de l'Union européenne. Nos pratiques sont conformes au RGPD et détaillées sur notre page éthique."},
            {"question": "Quelle est la différence avec un EAP (Employee Assistance Program) classique\u00a0?", "answer": "Les EAP sont centrés sur le soutien psychologique. ELSAI est spécialisée sur les droits sociaux et les démarches administratives\u00a0: logement, CAF, surendettement, santé, handicap, parentalité. C'est complémentaire."},
            {"question": "Que se passe-t-il si un salarié a besoin d'un suivi long\u00a0?", "answer": "ELSAI est un service de premier accueil. Pour les situations qui nécessitent un accompagnement dans la durée, nous orientons systématiquement vers le service compétent (CCAS, service social départemental, association spécialisée)."},
            {"question": "Comment se passe la facturation\u00a0?", "answer": "Facturation mensuelle ou annuelle, par virement SEPA ou prélèvement. Vous recevez une facture conforme chaque mois, exploitable directement par votre service comptable."},
            {"question": "Peut-on tester avant de s'engager\u00a0?", "answer": "Oui. Nous proposons une phase pilote de 3 mois sur un périmètre réduit (un service, un site) pour évaluer l'adoption et l'impact avant déploiement plus large."},
        ],
    },
    {
        "type": "final_cta",
        "title": "Discutons de votre besoin en 20 minutes.",
        "body": (
            "Chaque entreprise a ses spécificités\u00a0: taille, métiers, contraintes RH. "
            "Nous adaptons l'offre et démarrons souvent par une phase pilote sur un "
            "périmètre réduit."
        ),
        "cta_label": "Demander un devis →",
        "cta_href": "/contact?sujet=offre-entreprise",
    },
]


# ============================================================================
# PARTENARIATS
# ============================================================================

PARTENARIATS_SCHEMA: dict[str, Any] = {
    "label": "Page « Partenariats »",
    "seo": True,
    "blocks": [
        {
            "key": "hero",
            "label": "Hero",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text", "required": True},
                {"key": "subtitle", "label": "Sous-titre", "type": "textarea"},
            ],
        },
        {
            "key": "positionnement",
            "label": "Positionnement + Engagements",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text"},
                {"key": "body", "label": "Texte intro", "type": "textarea"},
                {
                    "key": "items",
                    "label": "Engagements",
                    "type": "list",
                    "item_fields": [
                        {"key": "title", "label": "Titre", "type": "text", "required": True},
                        {"key": "body", "label": "Texte", "type": "textarea"},
                    ],
                },
            ],
        },
        {
            "key": "cibles",
            "label": "Structures cibles",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text"},
                {
                    "key": "items",
                    "label": "Structures",
                    "type": "list",
                    "item_fields": [
                        {"key": "title", "label": "Titre", "type": "text", "required": True},
                        {"key": "body", "label": "Texte", "type": "textarea"},
                    ],
                },
            ],
        },
        {
            "key": "formats",
            "label": "Formats de partenariat",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text"},
                {
                    "key": "items",
                    "label": "Formats",
                    "type": "list",
                    "item_fields": [
                        {"key": "title", "label": "Titre", "type": "text", "required": True},
                        {"key": "body", "label": "Texte", "type": "textarea"},
                        {"key": "cost", "label": "Coût", "type": "text"},
                    ],
                },
            ],
        },
        {
            "key": "entreprise_cta",
            "label": "Encadré « Vous êtes une entreprise »",
            "max": 1,
            "fields": [
                {"key": "eyebrow", "label": "Sur-titre", "type": "text"},
                {"key": "title", "label": "Titre", "type": "text"},
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
                {"key": "title", "label": "Titre", "type": "text"},
                {"key": "body", "label": "Texte", "type": "textarea"},
                {"key": "cta_label", "label": "CTA - texte", "type": "text"},
                {"key": "cta_href", "label": "CTA - lien", "type": "url"},
                {"key": "info_format", "label": "Info - Format", "type": "text"},
                {"key": "info_confidentialite", "label": "Info - Confidentialité", "type": "text"},
                {"key": "info_statut", "label": "Info - Statut", "type": "text"},
            ],
        },
    ],
}

_PARTENARIATS_DEFAULT_BLOCKS: list[dict[str, Any]] = [
    {
        "type": "hero",
        "eyebrow": "Partenariats",
        "title": "Construisons l'impact ensemble.",
        "subtitle": (
            "ELSAI est un projet d'intérêt général qui se déploie en complémentarité "
            "des services sociaux publics. Nous ne remplaçons pas\u00a0: nous renforçons "
            "l'accès au droit."
        ),
    },
    {
        "type": "positionnement",
        "eyebrow": "Notre positionnement",
        "title": "Un relais, pas un concurrent des services sociaux traditionnels.",
        "body": (
            "Le non-recours aux droits sociaux ne se résoudra pas avec un seul outil. "
            "ELSAI se pense comme un filtre de premier niveau qui prépare le terrain, "
            "et qui oriente vers vos services quand un accompagnement humain est "
            "nécessaire."
        ),
        "items": [
            {"title": "Réorientation systématique", "body": "Nous ne gardons pas l'usager chez nous. ELSAI oriente vers le bon service (CAF, CPAM, CCAS, France Services) avec un dossier déjà clarifié."},
            {"title": "Transparence des pratiques", "body": "Nos règles éthiques, notre gouvernance et nos sources de financement sont publiques. ELSAI est portée par un binôme assistante sociale diplômée + ingénieur."},
            {"title": "Désengorgement des accueils", "body": "En répondant aux questions simples de premier niveau, nous permettons à vos équipes de se concentrer sur l'accompagnement humain qui compte."},
            {"title": "Donnée souveraine", "body": "Hébergement en France, conformité RGPD, aucun transfert hors UE. Nous pouvons co-signer les engagements vis-à-vis de vos tutelles."},
        ],
    },
    {
        "type": "cibles",
        "eyebrow": "À qui nous nous adressons",
        "title": "Les structures avec qui nous souhaitons travailler.",
        "items": [
            {"title": "CCAS & services sociaux départementaux", "body": "Un relais 24h/24h pour répondre aux questions de premier niveau et libérer du temps aux travailleurs sociaux sur les accompagnements à forte valeur ajoutée."},
            {"title": "France Services & maisons de services au public", "body": "Un outil complémentaire pour prolonger l'accompagnement au-delà des heures d'ouverture et préparer les rendez-vous avec un dossier déjà clarifié."},
            {"title": "Associations sociales & caritatives", "body": "Pour les structures qui orientent déjà des publics vulnérables, ELSAI apporte une réponse immédiate sur les droits, en français clair."},
            {"title": "Collectivités territoriales", "body": "Dans le cadre des dispositifs «\u00a0Territoires zéro non-recours\u00a0», ELSAI peut être déployée comme brique numérique complémentaire."},
        ],
    },
    {
        "type": "formats",
        "eyebrow": "Formats de partenariat",
        "title": "Plusieurs niveaux d'intégration, selon vos besoins.",
        "items": [
            {"title": "Lien simple", "body": "Renvoi depuis votre site vers ELSAI, sans intégration technique.", "cost": "Gratuit"},
            {"title": "Co-branding", "body": "Page d'accueil aux couleurs partenaire, parcours dédié pour vos usagers.", "cost": "À discuter"},
            {"title": "Intégration métier", "body": "Intégration dans votre SI ou votre portail usager, reporting dédié.", "cost": "Sur devis"},
        ],
    },
    {
        "type": "entreprise_cta",
        "eyebrow": "Vous êtes une entreprise\u00a0?",
        "title": "Une offre dédiée pour équiper vos salariés d'un accueil social confidentiel.",
        "body": (
            "Si vous représentez une entreprise qui souhaite proposer ELSAI à ses "
            "collaborateurs, une offre distincte existe à partir de 3 € par salarié et "
            "par mois."
        ),
        "cta_label": "Voir l'offre entreprises →",
        "cta_href": "/offre",
    },
    {
        "type": "final_cta",
        "title": "Discutons de votre projet",
        "body": (
            "Chaque territoire, chaque structure a ses spécificités. Nous "
            "co-construisons le format le plus adapté, et nous démarrons souvent par "
            "une expérimentation sur un périmètre réduit avant tout déploiement plus "
            "large."
        ),
        "cta_label": "Prendre contact →",
        "cta_href": "/contact?sujet=partenariat-institutionnel",
        "info_format": "Conventions sur mesure, expérimentations territoriales",
        "info_confidentialite": "Anonymat usager garanti — données agrégées uniquement",
        "info_statut": "SAS en cours d'agrément ESUS, hébergement souverain France",
    },
]


# ============================================================================
# REGISTRY
# ============================================================================

PAGE_SCHEMAS: dict[str, dict[str, Any]] = {
    "home": HOME_SCHEMA,
    "pour-qui": POUR_QUI_SCHEMA,
    "comment-ca-marche": COMMENT_CA_MARCHE_SCHEMA,
    "ethique": ETHIQUE_SCHEMA,
    "faq": FAQ_SCHEMA,
    "contact": CONTACT_SCHEMA,
    "exemples-concrets": EXEMPLES_SCHEMA,
    "offre": OFFRE_SCHEMA,
    "partenariats": PARTENARIATS_SCHEMA,
}

_DEFAULT_BLOCKS: dict[str, list[dict[str, Any]]] = {
    "home": _HOME_DEFAULT_BLOCKS,
    "pour-qui": _POUR_QUI_DEFAULT_BLOCKS,
    "comment-ca-marche": _COMMENT_CA_MARCHE_DEFAULT_BLOCKS,
    "ethique": _ETHIQUE_DEFAULT_BLOCKS,
    "faq": _FAQ_DEFAULT_BLOCKS,
    "contact": _CONTACT_DEFAULT_BLOCKS,
    "exemples-concrets": _EXEMPLES_DEFAULT_BLOCKS,
    "offre": _OFFRE_DEFAULT_BLOCKS,
    "partenariats": _PARTENARIATS_DEFAULT_BLOCKS,
}


def get_schema(page_key: str) -> dict[str, Any] | None:
    schema = PAGE_SCHEMAS.get(page_key)
    return deepcopy(schema) if schema else None


def default_blocks_for(page_key: str) -> list[dict[str, Any]]:
    return deepcopy(_DEFAULT_BLOCKS.get(page_key, []))
