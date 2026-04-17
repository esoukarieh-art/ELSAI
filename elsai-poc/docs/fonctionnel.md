# Documentation fonctionnelle — ELSAI

## 1. Mission

**ELSAI** est un assistant social numérique conversationnel, en français,
destiné à accompagner les particuliers dans leurs démarches sociales,
administratives et personnelles. Il vise deux publics :

- **Adultes (18+)** — démarches CAF/RSA/logement, explication de courriers,
  orientation vers les bons dispositifs, écoute bienveillante.
- **Mineurs (12-18 ans)** — écoute, détection de situations de danger
  (violences, harcèlement, mal-être), escalade vers le **119**.

Le service n'est **pas** un travailleur social, ni un thérapeute, ni un
service d'urgence. Il oriente et informe ; il ne se substitue jamais au
contact humain quand celui-ci est nécessaire.

## 2. Parcours utilisateur

### 2.1 Entrée (/ landing)

L'utilisateur arrive sur une page d'accueil qui :

1. Explique la mission en une phrase
2. Propose deux entrées explicites : "J'ai plus de 18 ans" / "J'ai entre 12 et 18 ans"
3. Rappelle l'anonymat et le droit à l'oubli
4. Affiche les numéros d'urgence (119, 3114, 3919, 15)

Le choix du profil (`adult` / `minor`) crée une **session anonyme** via
`POST /api/auth/session`. Aucun identifiant personnel n'est demandé.

### 2.2 Conversation (/chat)

Écran de dialogue type messagerie. À chaque message utilisateur :

1. Le texte est scanné par `services/safety.py` (regex de détection)
2. Claude répond avec le **system prompt approprié au profil**
3. En mode mineur, la réponse est parsée comme **JSON strict** si elle
   commence par `{` — Claude est contraint par son system prompt à
   répondre uniquement sous la forme
   `{"danger": true, "message": "...", "emergency_cta": {"label": "...", "phone": "..."}}`
   lorsqu'il détecte un danger. Toute autre réponse est traitée comme
   message conversationnel libre.
4. Si un signal de danger est détecté (heuristique ou LLM), un
   **bandeau d'urgence plein écran** apparaît avec le numéro adapté :
   - Mineur → 119 (Allô Enfance en Danger)
   - Adulte → 3114 (suicide) ou 3919 (violences)

Les conversations sont persistées (SQLite) le temps de la session, pour
permettre la reprise du contexte. Elles sont supprimables à tout moment.

### 2.3 Analyse de document (/scan)

L'utilisateur photographie ou uploade une image d'un document
administratif (courrier CAF, avis d'imposition, quittance…). Le système :

1. Extrait le texte via **Tesseract OCR** (français + anglais)
2. Soumet ce texte à Claude avec un prompt "expliquer ce document"
3. Renvoie :
   - une **explication en langage simple**
   - une **liste d'actions suggérées** (ex. "Vérifier le montant", "Conserver 2 ans")

L'image brute **n'est jamais stockée** — respect du droit à l'oubli dès la réception.

### 2.4 Tableau de bord (/dashboard)

Vue métriques **agrégées et anonymes** (non exposée au grand public,
destinée à la démonstration du POC) :

- Sessions totales / actives sur la dernière heure
- Volumes de chats, OCR, détections de danger, demandes d'oubli
- Répartition adult / minor

Aucun contenu de conversation n'est exposé.

### 2.5 Droit à l'oubli

Accessible en un clic depuis l'interface. Appelle `DELETE /api/auth/forget`
qui purge en cascade toutes les conversations et messages de la session.

## 3. Règles éthiques (invariants)

Ces règles sont **non négociables** et doivent survivre à toute évolution
du produit.

### Anonymat strict

- Aucun nom, email, téléphone, adresse, date de naissance demandé
- Sessions identifiées par UUID opaque
- JWT sans PII (uniquement `session_id` + `exp`)
- Aucun log applicatif ne contient le contenu des messages utilisateurs

### Droit à l'oubli immédiat

- Bouton présent dans toutes les pages authentifiées
- Suppression cascade en base (conversations → messages)
- Pas de sauvegarde différée, pas de corbeille, pas de "soft delete"

### Détection de danger — double couche obligatoire

Le risque de rater un signal de détresse est inacceptable. Donc :

1. **Couche heuristique** (`services/safety.py`) — regex sur mots-clés
   (suicide, violence, abus, harcèlement, automutilation, troubles
   alimentaires, grooming, fugue). Filet de sécurité qui ne dépend
   d'aucun appel réseau.
2. **Couche LLM** (prompt mineur) — Claude reçoit pour consigne de
   répondre **exclusivement en JSON** avec le contrat
   `{"danger": true, "message": "...", "emergency_cta": {"label": "...", "phone": "..."}}`
   s'il perçoit un signal que l'heuristique aurait manqué. Le backend
   détecte ce mode via le premier caractère (`{`) et parse avec
   `json.loads` — pas de balises XML custom.

Les deux couches sont fusionnées par un **OU logique** : si l'une des
deux déclenche, le bandeau d'urgence s'affiche.

### Posture conversationnelle

- **Empathique** : valider les émotions, ne pas minimiser
- **Franche** : ne pas promettre ce qu'ELSAI ne peut pas tenir
- **Non prescriptive** : proposer des options, pas des ordres
- **Orienter** : toujours indiquer les interlocuteurs humains pertinents
  (travailleur social, CCAS, France Services, 119, etc.)

### Mineurs — règles spécifiques

- System prompt dédié, plus prudent, avec grille de détection enrichie
- En cas de danger, **le 119 est systématiquement proposé**, sans étape
  intermédiaire ni questionnement
- Aucune demande d'identification même indirecte (école, ville, parents)
- Pas de conseil sur les sujets médicaux, juridiques, sexuels complexes
  → orientation vers les dispositifs dédiés (Fil Santé Jeunes, etc.)

## 4. Cas d'usage types

| Situation utilisateur | Profil | Comportement attendu |
|-----------------------|--------|----------------------|
| "J'ai reçu un courrier de la CAF je comprends rien" | adult | Inviter à scanner, expliquer, orienter |
| "Mon loyer augmente et je peux pas payer" | adult | Écouter, expliquer APL, orienter CCAS |
| "Mon beau-père me touche le soir" | minor | Bandeau 119 immédiat, posture de confiance |
| "J'en peux plus, je veux en finir" | any | Bandeau 3114 (adult) ou 119 (minor) |
| "Comment faire une demande de RSA ?" | adult | Explications étapes, lien vers service-public.fr |
| "Mes parents me frappent" | minor | Bandeau 119, posture rassurante |

## 5. Ce qu'ELSAI ne fait pas (hors POC)

- Pas de conseil juridique engageant
- Pas de diagnostic médical
- Pas de prise de rendez-vous direct
- Pas de gestion de dossier administratif à la place de l'usager
- Pas de signalement automatisé aux autorités (l'orientation vers le 119
  est proposée, pas exécutée — l'utilisateur reste décideur)

## 6. Évolutions prévues (post-POC)

Voir `project_site_vitrine.md` et `Architecture_Technique_ELSAI.docx` :

- Interface vocale (Whisper + TTS) pour l'accessibilité
- Annuaire géolocalisé CCAS / France Services
- Intégration directe avec dispositifs partenaires
- Parcours "proches aidants"
- Version professionnels (travailleurs sociaux en appui)

## Références

- Charte graphique : `project_charte_graphique.md`
- Modèle économique : `ELSAI_Modele_Economique.docx`
- Cahier des charges complet : `Cahier_des_charges_ELSAI.docx`
- Prompts détaillés : `ELSAI_Prompts_Analyse_Situations.docx`
- Simulations de dialogues : `Simulations_ELSAI.docx`
