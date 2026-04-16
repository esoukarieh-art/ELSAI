# ELSAI — POC Monolithe Web

Proof of Concept de l'assistant social numérique **ELSAI**.

Architecture simplifiée validant les 3 fonctionnalités cœur : conversation IA,
analyse de documents (OCR), tableau de bord. Deux parcours : **majeurs** (18+)
et **mineurs** (12-18) avec détection de danger et escalade vers le 119.

## Architecture

```
┌─────────────────────┐        HTTPS         ┌──────────────────────────┐
│   Next.js 14 PWA    │ ────────────────────▶│   FastAPI monolithe      │
│  (TS + Tailwind)    │                      │   • /api/auth            │
│  • / (landing)      │                      │   • /api/chat   ──▶ Claude
│  • /chat            │                      │   • /api/documents ─▶ OCR + Claude
│  • /scan            │                      │   • /api/dashboard       │
│  • /dashboard       │                      │                          │
└─────────────────────┘                      └────────────┬─────────────┘
                                                          ▼
                                                   SQLite (sessions,
                                                   conversations, métriques)
```

### Pourquoi un monolithe ?

L'architecture cible (cf `Architecture_Technique_ELSAI.docx`) prévoit des
microservices + Kubernetes + RabbitMQ. C'est prématuré pour valider le
concept. Le POC garde la **séparation modulaire** (`routers/`, `services/`,
`prompts/`) pour faciliter l'extraction future.

## Démarrage rapide

### Prérequis
- Python 3.12+
- Node.js 20+
- Tesseract OCR avec pack français :
  - Windows : [UB Mannheim installer](https://github.com/UB-Mannheim/tesseract/wiki) (installer aussi `fra`)
  - macOS : `brew install tesseract tesseract-lang`
  - Linux : `apt install tesseract-ocr tesseract-ocr-fra`
- Une clé API Anthropic (https://console.anthropic.com/)

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |   Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Éditer .env : renseigner ANTHROPIC_API_KEY et éventuellement TESSERACT_CMD
uvicorn app.main:app --reload --port 8000
```

API dispo sur http://localhost:8000 — doc interactive sur http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

App dispo sur http://localhost:3000

### Tout en une fois (Docker)

```bash
cd backend && cp .env.example .env   # renseigner ANTHROPIC_API_KEY
cd ..
docker compose up --build
```

## Endpoints

| Méthode | URL                            | Rôle                                   |
|---------|--------------------------------|----------------------------------------|
| POST    | `/api/auth/session`            | Crée une session anonyme (profile)     |
| DELETE  | `/api/auth/forget`             | Droit à l'oubli : purge la session     |
| POST    | `/api/chat`                    | Conversation IA (Claude)               |
| POST    | `/api/documents/analyze`       | OCR + explication d'un document        |
| GET     | `/api/dashboard/metrics`       | Métriques agrégées anonymes            |
| GET     | `/api/health`                  | Santé + statut config LLM              |

## Contraintes éthiques implémentées

- **Anonymat** : sessions sans nom/email, JWT opaque.
- **Droit à l'oubli** : `DELETE /api/auth/forget` purge conversations + messages.
- **Détection danger** : double couche (heuristique regex + prompt Claude en mode mineur).
- **CTA d'urgence** : bandeau plein écran avec 119 si signal détecté.
- **Pas de cache API dans le service worker** : contenu utilisateur jamais mis en cache.
- **Documents non persistés** : les images OCRisées ne sont pas stockées côté serveur.

## Roadmap post-POC

1. Remplacer SQLite par PostgreSQL + chiffrement TDE
2. Remplacer Tesseract par Google Document AI pour les documents manuscrits
3. Remplacer auth JWT maison par Keycloak OAuth2/OIDC
4. Extraire `services/safety.py` en microservice dédié (classifier CamemBERT)
5. Ajouter l'annuaire géolocalisé (CCAS/France Services)
6. Ajouter Whisper STT + TTS pour l'interface vocale
7. Hébergement HDS/SecNumCloud (OVH/Scaleway)

Voir `Architecture_Technique_ELSAI.docx` pour l'architecture cible complète.
