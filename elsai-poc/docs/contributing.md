# Guide contributeur — ELSAI POC

## Prérequis

- **Python 3.12+**
- **Node.js 20+**
- **Tesseract OCR** avec pack français
  - Windows : [UB Mannheim installer](https://github.com/UB-Mannheim/tesseract/wiki) (cocher `fra`)
  - macOS : `brew install tesseract tesseract-lang`
  - Linux : `apt install tesseract-ocr tesseract-ocr-fra`
- **Clé API Anthropic** — https://console.anthropic.com/
- **Docker + Docker Compose** (optionnel, pour la stack complète)

## Setup développement

### Backend

```bash
cd elsai-poc/backend
python -m venv .venv
# Windows : .venv\Scripts\activate
# Linux/macOS : source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Éditer .env :
#   ANTHROPIC_API_KEY=sk-ant-...
#   TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe  (Windows)
uvicorn app.main:app --reload --port 8000
```

API → http://localhost:8000 — Swagger → http://localhost:8000/docs

### Frontend

```bash
cd elsai-poc/frontend
npm install
cp .env.local.example .env.local
npm run dev
```

App → http://localhost:3000

### Tout-en-un (Docker)

```bash
cd elsai-poc
# S'assurer que backend/.env contient ANTHROPIC_API_KEY
docker compose up --build
```

## Structure du dépôt

```
elsai-poc/
├── backend/
│   ├── app/
│   │   ├── routers/       # Endpoints HTTP (auth, chat, documents, dashboard)
│   │   ├── services/      # Logique métier (llm, ocr, safety)
│   │   ├── prompts/       # Templates system prompts Claude
│   │   ├── main.py        # App FastAPI + CORS
│   │   ├── models.py      # SQLAlchemy ORM
│   │   ├── schemas.py     # DTOs Pydantic
│   │   ├── auth.py        # JWT + dépendance SessionDep
│   │   ├── database.py    # Engine + init_db
│   │   └── config.py      # Settings (env vars)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/               # Routes Next.js App Router
│   ├── components/        # Composants réutilisables
│   ├── lib/               # Client API, helpers
│   └── public/            # Assets statiques, manifest PWA
├── docs/                  # Cette documentation
└── docker-compose.yml
```

## Conventions

### Python (backend)

- **Python 3.12**, typage obligatoire (`mapped_column[...]`, `-> ReturnType`)
- SQLAlchemy 2.x style déclaratif
- Pydantic v2 pour tous les DTOs
- Une route = un router ; un router = un domaine métier
- La logique métier descend dans `services/`, pas dans les routers
- Chaque `service` doit être **testable sans FastAPI** (pas de dépendance framework)

### TypeScript (frontend)

- Next.js 14 App Router, **pas** de Pages Router
- Tailwind pour le styling — pas de CSS modules parallèles
- Composants serveur par défaut ; `"use client"` uniquement si nécessaire
- Appels API centralisés dans `lib/`

### Git

- Branche de travail : `claude/<description>` ou `feat/<description>`
- Messages en français, ton descriptif : `Ajoute détection heuristique danger`
- PR vers `main`, squash merge par défaut

## Ajouter une nouvelle route API

1. Créer le router dans `backend/app/routers/xxx.py`
2. Définir les schémas request/response dans `schemas.py`
3. Enregistrer dans `main.py` : `app.include_router(xxx.router)`
4. Documenter dans `docs/api.md`
5. Tester via Swagger (`/docs`) puis depuis le frontend

## Ajouter un prompt Claude

1. Créer un template dans `backend/app/prompts/` (Markdown ou string Python)
2. Appeler via `services/llm.py` — ne pas dupliquer la logique Anthropic ailleurs
3. Si le prompt doit détecter un signal, **toujours** le doubler d'une
   vérification heuristique dans `services/safety.py`

## Respecter les contraintes éthiques

Tout contributeur doit lire `docs/fonctionnel.md` §Éthique. En résumé :

- **Aucun PII stocké** — pas d'email, nom, téléphone, même optionnel
- **Droit à l'oubli** — toute nouvelle table liée à une session doit
  être supprimée par `DELETE /api/auth/forget`
- **Détection danger** — toujours double couche (heuristique + LLM)
- **Mineurs** — tout changement du flow mineur doit être revu avec le porteur projet

## Tests

Non inclus dans le POC (validation fonctionnelle d'abord). À ajouter avant
industrialisation :

- Backend : `pytest` + `httpx.AsyncClient` pour tester les routers
- Frontend : `playwright` pour les parcours E2E critiques (chat, scan)
- Safety : corpus de messages tagués (danger vs. non-danger) avec KPI recall

## Checklist avant PR

- [ ] Backend démarre sans erreur (`uvicorn app.main:app --reload`)
- [ ] Frontend build OK (`npm run build`)
- [ ] Nouveaux endpoints documentés dans `docs/api.md`
- [ ] Pas de secret commité (clés, tokens, fichiers `.env`)
- [ ] Pas de PII introduit dans les modèles
- [ ] Si nouvelle table : cascade delete depuis `Session` vérifiée
