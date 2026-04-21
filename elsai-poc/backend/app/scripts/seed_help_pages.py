"""Seed les 9 pages du centre d'aide ELSAI (kind=help).

Idempotent : upsert par slug. Les pages sont publiées directement (status=published).

Usage :
    cd elsai-poc/backend
    python -m app.scripts.seed_help_pages
"""

from __future__ import annotations

import json
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from ..database import SessionLocal, init_db
from ..models import BlogPost


HELP_PAGES: list[dict] = [
    {
        "slug": "demarrer",
        "title": "Démarrer avec ELSAI",
        "seo_title": "Démarrer avec ELSAI — assistant social gratuit et anonyme",
        "seo_description": (
            "Comment commencer à utiliser ELSAI, l'assistant social IA anonyme : "
            "choisir son profil, poser une question, accéder aux premières fonctions."
        ),
        "description": "Les bases pour bien commencer avec ELSAI en 2 minutes.",
        "hero_eyebrow": "Premiers pas",
        "target_keyword": "assistant social en ligne anonyme",
        "search_intent": "informational",
        "schema_type": "Article",
        "schema_extra_json": "{}",
        "reading_minutes": 2,
        "content_mdx": (
            "ELSAI est un **assistant social numérique** qui répond à vos questions "
            "sur les démarches du quotidien : CAF, RSA, logement, MDPH, impôts, "
            "école, famille, santé. Anonyme, gratuit, hébergé en France.\n\n"
            "## En 3 étapes\n\n"
            "1. **Ouvrez** [elsai.fr](/) dans votre navigateur — aucune inscription.\n"
            "2. **Choisissez votre profil** (adulte ou 12–18 ans) sur [/start](/start).\n"
            "3. **Posez votre question** dans le chat, à l'écrit ou à l'oral.\n\n"
            "## Ce qu'ELSAI peut faire\n\n"
            "- Expliquer une lettre administrative en langage clair\n"
            "- Lister les aides auxquelles vous avez droit\n"
            "- Vous accompagner pas à pas dans une démarche\n"
            "- Vous écouter sans juger, 24h/24\n\n"
            "## Ce qu'ELSAI ne remplace pas\n\n"
            "Un professionnel de santé mentale, un travailleur social, un avocat. "
            "Pour les dossiers complexes, adressez-vous à votre CCAS ou à "
            "**France Services** le plus proche.\n\n"
            "Prêt·e ? [→ Commencer maintenant](/start)"
        ),
    },
    {
        "slug": "poser-une-question",
        "title": "Comment discuter avec ELSAI",
        "seo_title": "Comment discuter avec ELSAI — guide du chat",
        "seo_description": (
            "Apprenez à poser vos questions à ELSAI, formuler une situation, "
            "enchaîner les messages et obtenir des réponses précises."
        ),
        "description": "Poser une question, raconter une situation, obtenir des pistes concrètes.",
        "hero_eyebrow": "Chat",
        "target_keyword": "poser question aide sociale IA",
        "search_intent": "informational",
        "schema_type": "HowTo",
        "schema_extra_json": json.dumps(
            {
                "steps": [
                    {"name": "Ouvrir le chat", "text": "Rendez-vous sur /chat après avoir choisi votre profil."},
                    {"name": "Écrire votre question", "text": "Tapez votre question ou votre situation dans la zone de texte."},
                    {"name": "Envoyer", "text": "Appuyez sur Entrée ou sur le bouton Envoyer. ELSAI répond en quelques secondes."},
                    {"name": "Rebondir", "text": "Enchaînez les messages : ELSAI se souvient du contexte tant que vous ne fermez pas le navigateur."},
                ]
            },
            ensure_ascii=False,
        ),
        "reading_minutes": 3,
        "content_mdx": (
            "Le chat est le cœur d'ELSAI. Voici comment en tirer le meilleur.\n\n"
            "## 4 étapes\n\n"
            "1. **Ouvrez** [/chat](/chat) après avoir choisi votre profil.\n"
            "2. **Écrivez** votre question ou votre situation.\n"
            "3. **Envoyez** (Entrée ou bouton *Envoyer*).\n"
            "4. **Rebondissez** — ELSAI garde le contexte de la conversation.\n\n"
            "## Exemples de questions qui fonctionnent bien\n\n"
            "- *« J'ai reçu une lettre de la CAF qui me demande 900 €, qu'est-ce que je peux faire ? »*\n"
            "- *« Je viens d'avoir 18 ans, à quelles aides ai-je droit pour quitter le foyer ? »*\n"
            "- *« Comment remplir une demande de logement social en Île-de-France ? »*\n\n"
            "## Conseils\n\n"
            "- **Soyez précis·e** : donnez le contexte (âge, situation pro, localisation si pertinent).\n"
            "- **Pas de données personnelles sensibles** (nom complet, numéro de sécu…) — ce n'est pas nécessaire et ça protège votre anonymat.\n"
            "- **Reformulez** si la réponse n'est pas claire : *« explique-moi plus simplement »*.\n\n"
            "Besoin de parler à l'oral ? [→ Utiliser la voix](/aide/parler-avec-la-voix)"
        ),
    },
    {
        "slug": "parler-avec-la-voix",
        "title": "Utiliser la dictée vocale",
        "seo_title": "Parler à ELSAI avec la voix — dictée vocale",
        "seo_description": (
            "Activez le micro pour dicter vos questions à ELSAI et écoutez les "
            "réponses à haute voix. Parfait en déplacement ou sans clavier."
        ),
        "description": "Dicter vos questions et écouter les réponses à haute voix.",
        "hero_eyebrow": "Voix",
        "target_keyword": "assistant vocal démarches administratives",
        "search_intent": "informational",
        "schema_type": "HowTo",
        "schema_extra_json": json.dumps(
            {
                "steps": [
                    {"name": "Cliquer sur le micro", "text": "Dans le chat, cliquez sur l'icône micro en bas de la zone de saisie."},
                    {"name": "Autoriser le micro", "text": "Autorisez votre navigateur à utiliser le micro (une seule fois)."},
                    {"name": "Parler", "text": "Parlez naturellement. L'icône change pour indiquer l'enregistrement."},
                    {"name": "Arrêter", "text": "Cliquez à nouveau pour arrêter. Le message est retranscrit puis envoyé."},
                    {"name": "Activer l'écoute", "text": "Activez le bouton 🔊 Lecture audio dans l'en-tête pour entendre les réponses."},
                ]
            },
            ensure_ascii=False,
        ),
        "reading_minutes": 2,
        "content_mdx": (
            "Vous préférez parler plutôt qu'écrire ? ELSAI vous comprend à l'oral.\n\n"
            "## Dicter un message\n\n"
            "1. Dans le [chat](/chat), cliquez sur l'**icône micro**.\n"
            "2. **Autorisez** votre navigateur à utiliser le micro (une seule fois).\n"
            "3. **Parlez** naturellement — l'icône change pour indiquer l'enregistrement.\n"
            "4. Cliquez à nouveau pour **arrêter**. Le message est retranscrit puis envoyé.\n\n"
            "## Écouter les réponses\n\n"
            "Activez le bouton **🔊 Lecture audio** dans l'en-tête du chat. Chaque "
            "réponse d'ELSAI est lue à haute voix automatiquement.\n\n"
            "## Quand c'est utile\n\n"
            "- Dans les transports, sans clavier pratique.\n"
            "- Quand la lecture écrite est fatigante.\n"
            "- Pour des situations émotionnelles où parler est plus naturel.\n\n"
            "## Si ça ne marche pas\n\n"
            "- **Sur iPhone** : vérifiez *Réglages > Safari > Microphone*.\n"
            "- **Sur Android** : assurez-vous que Chrome a accès au micro dans les permissions.\n"
            "- **Silence détecté** : parlez à 15–20 cm du micro."
        ),
    },
    {
        "slug": "scanner-un-document",
        "title": "Faire analyser une lettre administrative",
        "seo_title": "Scanner et comprendre une lettre CAF, Pôle Emploi, impôts",
        "seo_description": (
            "Prenez en photo un courrier administratif : ELSAI le décrypte en "
            "langage simple et vous indique les actions à faire."
        ),
        "description": "Prendre une photo d'un courrier pour qu'ELSAI l'explique en clair.",
        "hero_eyebrow": "Scan",
        "target_keyword": "comprendre une lettre CAF",
        "search_intent": "informational",
        "schema_type": "HowTo",
        "schema_extra_json": json.dumps(
            {
                "steps": [
                    {"name": "Aller sur /scan", "text": "Ouvrez la page /scan depuis le chat ou directement."},
                    {"name": "Choisir un fichier", "text": "Prenez une photo ou uploadez un fichier PNG/JPEG/WebP."},
                    {"name": "Attendre l'analyse", "text": "ELSAI lit le document (OCR) et l'analyse en quelques secondes."},
                    {"name": "Lire l'explication", "text": "Vous obtenez le texte détecté, une explication claire et des actions suggérées."},
                ]
            },
            ensure_ascii=False,
        ),
        "reading_minutes": 2,
        "content_mdx": (
            "Un courrier administratif incompréhensible ? ELSAI le décode pour vous.\n\n"
            "## 4 étapes\n\n"
            "1. Rendez-vous sur **[/scan](/scan)**.\n"
            "2. **Choisissez un fichier** ou prenez une photo (PNG, JPEG, WebP).\n"
            "3. Attendez quelques secondes.\n"
            "4. ELSAI affiche :\n"
            "   - le **texte détecté** (OCR), dépliable pour vérification,\n"
            "   - une **explication** en langage clair,\n"
            "   - une liste d'**actions suggérées** avec les échéances.\n\n"
            "## Exemple\n\n"
            "Maria reçoit un courrier Pôle Emploi avec un vocabulaire technique. "
            "Elle le photographie, et ELSAI lui explique : *« Vous êtes convoqué·e "
            "le 12 mai à 14h. Si vous ne pouvez pas venir, voici comment justifier… »*\n\n"
            "## Conseils pour une bonne photo\n\n"
            "- **Lumière naturelle**, sans ombre portée.\n"
            "- **Cadrage droit**, toute la page visible.\n"
            "- **Pas de flou** : tenez le téléphone stable.\n"
            "- Si la lettre fait plusieurs pages, **scannez-les une par une**."
        ),
    },
    {
        "slug": "installer-sur-mobile",
        "title": "Installer ELSAI sur iPhone et Android",
        "seo_title": "Installer ELSAI sur iPhone et Android (PWA)",
        "seo_description": (
            "Ajoutez ELSAI à votre écran d'accueil comme une vraie application, "
            "en 30 secondes, sans passer par l'App Store ou Google Play."
        ),
        "description": "Ajouter ELSAI à l'écran d'accueil comme une vraie application.",
        "hero_eyebrow": "PWA",
        "target_keyword": "installer PWA iPhone Android",
        "search_intent": "informational",
        "schema_type": "HowTo",
        "schema_extra_json": json.dumps(
            {
                "steps": [
                    {"name": "Sur Android", "text": "Dans Chrome, ouvrez elsai.fr → menu ⋮ → Installer l'application."},
                    {"name": "Sur iPhone", "text": "Dans Safari, ouvrez elsai.fr → bouton Partager → Sur l'écran d'accueil."},
                    {"name": "Lancer", "text": "L'icône ELSAI apparaît sur votre écran d'accueil, comme une app classique."},
                ]
            },
            ensure_ascii=False,
        ),
        "reading_minutes": 2,
        "content_mdx": (
            "ELSAI est une **PWA** (Progressive Web App) : vous pouvez l'installer "
            "sur votre écran d'accueil sans passer par un magasin d'applications.\n\n"
            "## Sur Android (Chrome)\n\n"
            "1. Ouvrez [elsai.fr](/) dans Chrome.\n"
            "2. Touchez le menu **⋮** → **Installer l'application**.\n\n"
            "## Sur iPhone (Safari)\n\n"
            "1. Ouvrez [elsai.fr](/) dans Safari.\n"
            "2. Touchez le bouton **Partager** (carré avec flèche).\n"
            "3. Choisissez **Sur l'écran d'accueil**.\n\n"
            "Une fois installée, l'icône ELSAI apparaît sur votre écran comme une "
            "app classique.\n\n"
            "## Mode hors-ligne\n\n"
            "Les pages principales (accueil, chat, scan) se chargent **même sans "
            "connexion**, mais ELSAI a besoin d'internet pour répondre à vos "
            "questions. En avion ? L'app s'ouvre mais le chat attendra le retour "
            "du réseau."
        ),
    },
    {
        "slug": "effacer-mes-donnees",
        "title": "Tout oublier — effacer vos données",
        "seo_title": "Droit à l'oubli — effacer vos conversations ELSAI",
        "seo_description": (
            "Un clic pour supprimer définitivement toutes vos conversations et "
            "votre session ELSAI. Sans justification, à tout moment, conformément au RGPD."
        ),
        "description": "Un clic pour supprimer toutes vos conversations et votre session.",
        "hero_eyebrow": "RGPD",
        "target_keyword": "effacer conversations IA RGPD",
        "search_intent": "informational",
        "schema_type": "Article",
        "schema_extra_json": "{}",
        "reading_minutes": 2,
        "content_mdx": (
            "Vous avez le droit absolu d'effacer vos données à tout moment, sans "
            "avoir à vous justifier. ELSAI le rend trivial.\n\n"
            "## En un clic\n\n"
            "Sur chaque page (chat, scan…), un bouton **« Tout oublier »** est "
            "visible en haut à droite.\n\n"
            "1. Cliquez sur **Tout oublier**.\n"
            "2. Confirmez.\n"
            "3. Vos conversations sont supprimées du serveur. Vous repartez de zéro.\n\n"
            "## Ce qui est effacé\n\n"
            "- Toutes les **conversations** associées à votre session.\n"
            "- Tous les **messages** envoyés et reçus.\n"
            "- La **session** elle-même.\n\n"
            "## Cas d'usage\n\n"
            "> Nadia a utilisé l'ordinateur de la médiathèque pour poser une "
            "question sensible. Avant de partir, elle clique sur *Tout oublier* "
            "pour s'assurer que plus rien ne subsiste.\n\n"
            "## Note technique\n\n"
            "Fermer simplement votre navigateur efface déjà la session locale "
            "(sessionStorage). Le bouton *Tout oublier* va plus loin en supprimant "
            "aussi les traces côté serveur. Conforme RGPD, sans procédure."
        ),
    },
    {
        "slug": "securite",
        "title": "Si tu es en danger",
        "seo_title": "Si tu es en danger — 119 et ressources d'urgence",
        "seo_description": (
            "Numéros d'urgence gratuits et anonymes : 119 (Enfance en danger), "
            "3114 (prévention suicide), 3919 (violences conjugales), 15 et 112 "
            "pour les urgences vitales."
        ),
        "description": "Numéros d'urgence gratuits et anonymes, disponibles 24h/24.",
        "hero_eyebrow": "Sécurité",
        "target_keyword": "numéro 119 quand appeler",
        "search_intent": "informational",
        "schema_type": "Article",
        "schema_extra_json": "{}",
        "reading_minutes": 3,
        "content_mdx": (
            "Si tu traverses une situation grave, **tu n'es pas seul·e**. Des "
            "professionnel·les sont à l'écoute, gratuitement et anonymement, 24h/24.\n\n"
            "## Numéros à retenir\n\n"
            "- **119** — Enfance en danger (maltraitance, violences, négligence)\n"
            "- **3114** — Prévention du suicide\n"
            "- **3919** — Violences conjugales et faites aux femmes\n"
            "- **3018** — Violences numériques (cyberharcèlement, revenge porn…)\n"
            "- **115** — SAMU social (sans-abri, hébergement d'urgence)\n"
            "- **15** — SAMU (urgence médicale)\n"
            "- **112** — Urgences européennes (tous risques vitaux)\n\n"
            "Tous ces numéros sont **gratuits**, **anonymes**, et disponibles "
            "**24h/24**. Ils n'apparaissent pas sur la facture.\n\n"
            "## Comment ELSAI t'aide\n\n"
            "Si tu parles d'une situation dangereuse dans le chat, ELSAI affiche "
            "**automatiquement** un bandeau rouge avec le numéro approprié et un "
            "lien vers la **Maison des Adolescents** la plus proche.\n\n"
            "ELSAI n'est **pas** un professionnel de santé mentale : il peut "
            "t'écouter et t'orienter, mais il ne remplace pas un·e médecin, "
            "psychologue, ou éducateur·trice.\n\n"
            "## En cas d'urgence vitale\n\n"
            "Appelle tout de suite le **15** ou le **112**. Ou va au service "
            "d'urgence de l'hôpital le plus proche."
        ),
    },
    {
        "slug": "vie-privee",
        "title": "Comment ELSAI protège votre anonymat",
        "seo_title": "Vie privée & anonymat — IA sociale conforme RGPD",
        "seo_description": (
            "Comment ELSAI fonctionne sans vous identifier : pas d'inscription, "
            "pas de cookies publicitaires, pas de partage. Hébergé en France."
        ),
        "description": "Ce qu'ELSAI ne collecte jamais et comment la session anonyme fonctionne.",
        "hero_eyebrow": "Vie privée",
        "target_keyword": "IA conversationnelle anonyme France",
        "search_intent": "informational",
        "schema_type": "Article",
        "schema_extra_json": "{}",
        "reading_minutes": 3,
        "content_mdx": (
            "Votre anonymat est **le** principe fondateur d'ELSAI. Pas une option, "
            "un choix d'architecture.\n\n"
            "## Ce qu'ELSAI ne fait **jamais**\n\n"
            "- ❌ Vous demander votre nom, email, adresse, téléphone.\n"
            "- ❌ Installer de cookies publicitaires.\n"
            "- ❌ Partager vos conversations avec qui que ce soit.\n"
            "- ❌ Chercher à vous identifier ou à vous croiser avec d'autres bases.\n"
            "- ❌ Vendre ou louer des données.\n\n"
            "## Comment ça marche\n\n"
            "- À l'arrivée, une **session anonyme** est créée (identifiant aléatoire).\n"
            "- Cette session est stockée **dans votre navigateur** (sessionStorage).\n"
            "- Quand vous fermez l'onglet, la session disparaît de votre appareil.\n"
            "- Côté serveur, vos conversations sont conservées **tant que** vous "
            "ne cliquez pas sur *[Tout oublier](/aide/effacer-mes-donnees)*.\n\n"
            "## Garanties\n\n"
            "- 🇫🇷 **Hébergement en France** (OVH / Scaleway / partenaires UE uniquement).\n"
            "- 🔒 **HTTPS** obligatoire sur tout le service.\n"
            "- 🎯 **Pas de tracking publicitaire** (pas de Google Analytics, pas de Meta Pixel).\n"
            "- 📊 **Analytics anonymes** (Plausible, sans cookies, sans fingerprinting).\n\n"
            "## En savoir plus\n\n"
            "Consultez notre page [Confidentialité & RGPD](/confidentialite) pour "
            "le détail légal (mentions DPO, CNIL, rétention…)."
        ),
    },
    {
        "slug": "faq",
        "title": "Questions fréquentes",
        "seo_title": "FAQ ELSAI — questions fréquentes sur l'assistant",
        "seo_description": (
            "Réponses aux questions fréquentes : compte, gratuité, fiabilité des "
            "réponses, voix, langues, limites, bugs, contact."
        ),
        "description": "Les questions qui reviennent le plus souvent — et nos réponses.",
        "hero_eyebrow": "FAQ",
        "target_keyword": "elsai avis fonctionnement",
        "search_intent": "informational",
        "schema_type": "FAQPage",
        "schema_extra_json": json.dumps(
            {
                "questions": [
                    {
                        "q": "Est-ce que je dois créer un compte ?",
                        "a": "Non. ELSAI est anonyme par défaut. Aucune inscription requise.",
                    },
                    {
                        "q": "ELSAI est-il gratuit ?",
                        "a": "Oui, pour les particuliers. Il existe une offre payante B2B pour les employeurs.",
                    },
                    {
                        "q": "Mes parents ou mon employeur peuvent-ils voir mes conversations ?",
                        "a": "Non. Vos conversations ne sont visibles que par vous. Sur un appareil partagé, utilisez Tout oublier avant de partir.",
                    },
                    {
                        "q": "ELSAI remplace-t-il un assistant social ?",
                        "a": "Non. Pour un accompagnement personnalisé sur des dossiers complexes, contactez un CCAS ou une Maison France Services.",
                    },
                    {
                        "q": "La réponse est fausse ou incomplète, que faire ?",
                        "a": "ELSAI est une IA : il peut se tromper. Pour toute démarche importante, vérifiez sur service-public.fr ou auprès d'un professionnel.",
                    },
                    {
                        "q": "Dans quelle langue ELSAI fonctionne-t-il ?",
                        "a": "Français uniquement pour le moment.",
                    },
                    {
                        "q": "Comment signaler un bug ou donner mon avis ?",
                        "a": "Utilisez la page Contact du site.",
                    },
                ]
            },
            ensure_ascii=False,
        ),
        "reading_minutes": 4,
        "content_mdx": (
            "## Dois-je créer un compte ?\n\n"
            "**Non.** ELSAI est anonyme par défaut. Aucune inscription, aucun email demandé.\n\n"
            "## ELSAI est-il gratuit ?\n\n"
            "**Oui**, pour les particuliers. Il existe une offre payante B2B pour "
            "les employeurs qui souhaitent proposer ELSAI à leurs équipes.\n\n"
            "## Mes parents ou mon employeur peuvent-ils voir mes conversations ?\n\n"
            "**Non.** Vos conversations ne sont visibles par personne d'autre que "
            "vous. Sur un appareil partagé, pensez à cliquer sur [*Tout "
            "oublier*](/aide/effacer-mes-donnees) avant de partir.\n\n"
            "## ELSAI remplace-t-il un assistant social ?\n\n"
            "**Non.** ELSAI vous aide à comprendre et préparer vos démarches, mais "
            "pour un accompagnement personnalisé sur des dossiers complexes, "
            "contactez un **CCAS** (mairie) ou une **Maison France Services**.\n\n"
            "## La réponse semble fausse ou incomplète, que faire ?\n\n"
            "ELSAI est une IA : il **peut se tromper**. Pour toute démarche "
            "importante, vérifiez l'information sur :\n\n"
            "- [service-public.fr](https://www.service-public.fr)\n"
            "- [caf.fr](https://www.caf.fr)\n"
            "- [ameli.fr](https://www.ameli.fr)\n\n"
            "Ou demandez confirmation à un professionnel.\n\n"
            "## Dans quelle langue ELSAI fonctionne-t-il ?\n\n"
            "**Français** uniquement pour le moment. D'autres langues à l'étude.\n\n"
            "## La voix ne marche pas sur mon iPhone\n\n"
            "Vérifiez que Safari a bien l'autorisation d'utiliser le micro : "
            "*Réglages > Safari > Microphone*. Sur certains appareils anciens, "
            "la fonctionnalité peut être limitée.\n\n"
            "## Comment signaler un bug ou donner mon avis ?\n\n"
            "Utilisez la page **[Contact](/contact)** du site."
        ),
    },
]


def seed(db: Session) -> tuple[int, int]:
    """Upsert les pages par slug. Retourne (created, updated)."""
    created = 0
    updated = 0
    now = datetime.now(UTC)

    for page in HELP_PAGES:
        slug = page["slug"]
        existing = db.query(BlogPost).filter(BlogPost.slug == slug).first()

        values = dict(
            slug=slug,
            title=page["title"],
            description=page["description"],
            hero_eyebrow=page.get("hero_eyebrow"),
            content_mdx=page["content_mdx"],
            tags_json=json.dumps(["aide", "guide"], ensure_ascii=False),
            reading_minutes=page.get("reading_minutes", 2),
            audience="all",
            kind="help",
            target_keyword=page.get("target_keyword"),
            search_intent=page.get("search_intent", "informational"),
            status="published",
            published_at=now,
            seo_title=page.get("seo_title"),
            seo_description=page.get("seo_description"),
            schema_type=page.get("schema_type", "Article"),
            schema_extra_json=page.get("schema_extra_json", "{}"),
        )

        if existing:
            for k, v in values.items():
                if k == "published_at" and existing.published_at:
                    continue  # respecter la date de première publication
                setattr(existing, k, v)
            updated += 1
        else:
            db.add(BlogPost(**values))
            created += 1

    db.commit()
    return created, updated


def main() -> None:
    init_db()
    with SessionLocal() as db:
        created, updated = seed(db)
    print(f"Centre d'aide : {created} page(s) créée(s), {updated} mise(s) à jour.")


if __name__ == "__main__":
    main()
