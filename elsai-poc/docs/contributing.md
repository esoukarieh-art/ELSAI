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
│   │   ├── routers/            # Endpoints HTTP (auth, chat, documents, dashboard, voice)
│   │   ├── services/           # Métier : llm, ocr, safety, privacy, voice
│   │   ├── prompts/            # Templates system prompts Claude
│   │   ├── main.py             # App FastAPI + CORS + observability
│   │   ├── observability.py    # structlog JSON + correlation ID + Sentry
│   │   ├── models.py           # SQLAlchemy ORM
│   │   ├── schemas.py          # DTOs Pydantic
│   │   ├── auth.py             # JWT + SessionDep
│   │   ├── database.py         # Engine + init_db
│   │   └── config.py           # Settings (env vars)
│   ├── tests/                  # pytest : auth, chat, documents, safety,
│   │                           # safety_adversarial, observability, privacy
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                    # Routes Next.js App Router
│   ├── components/             # Composants réutilisables + ObservabilityBoot
│   ├── lib/                    # Client API, observability (Sentry wrapper)
│   ├── tests/e2e/              # Playwright + axe-core RGAA
│   ├── docs/rgaa.md            # Conformité accessibilité
│   ├── lighthouserc.json       # Lighthouse CI
│   ├── playwright.config.ts
│   └── public/                 # Assets statiques, manifest PWA
├── docs/                       # README, architecture, api, contributing, rgpd
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

Bloc qualité obligatoire en CI (`.github/workflows/ci.yml`) : tout PR doit
passer les étapes backend + frontend + e2e + lighthouse.

### Backend (pytest)

```bash
cd elsai-poc/backend
pytest                              # suite complète
pytest tests/test_safety.py -v      # corpus calibré de détection
pytest tests/test_safety_adversarial.py  # jailbreak / evasion / injection
pytest tests/test_privacy.py        # RGPD : oubli SQL, TTL, droit d'accès
pytest tests/test_observability.py  # correlation ID + logs sans PII
```

Conventions pytest :
- Les gaps connus sont marqués `@pytest.mark.xfail(strict=True)` avec une
  raison explicite. Si un xfail passe en vert (XPASS), c'est que le code a
  été durci → basculer le cas en test normal.
- Markers personnalisés : `fp` / `fn` / `adversarial` (voir `pytest.ini`).

### Frontend (Playwright + axe + Lighthouse)

```bash
cd elsai-poc/frontend
npm install
npx playwright install chromium firefox

npm run lint          # ESLint + jsx-a11y bloquant
npm run test:e2e      # parcours critiques + axe-core RGAA
npm run test:e2e:ui   # mode interactif (debug local)
npm run build && npm run lhci  # Lighthouse CI (a11y ≥ 95)
```

Scénarios E2E critiques couverts : danger mineur → 119, danger adulte → 3114,
chat anonyme sans cookie identifiant, droit à l'oubli purge sessionStorage,
audit a11y sur 11 pages vitrine + /chat (avec et sans bannière urgence),
navigation clavier (skip link, input chat).

### Ajouter des cas de détection safety

1. Message clairement à risque → ajouter dans `TRUE_POSITIVES` de
   `test_safety.py` avec le signal attendu
2. Message sain qui pourrait leurrer → `TRUE_NEGATIVES`
3. Gap connu (regex actuellement insuffisante) → `KNOWN_FN` / `KNOWN_FP` en xfail
4. Tentative de contournement (jailbreak, argot, euphémisme) → `test_safety_adversarial.py`

## Checklist avant PR

- [ ] Backend démarre sans erreur (`uvicorn app.main:app --reload`)
- [ ] Backend : `pytest` vert (91 pass + 24 xfail attendus)
- [ ] Frontend : `npm run lint` OK (jsx-a11y inclus)
- [ ] Frontend : `npm run build` OK
- [ ] Frontend : `npm run test:e2e` vert (Playwright + axe)
- [ ] Nouveaux endpoints documentés dans `docs/api.md`
- [ ] Nouveau log structuré ? Tester qu'il ne fuit **aucun contenu utilisateur**
- [ ] Pas de secret commité (clés, tokens, fichiers `.env`)
- [ ] Pas de PII introduit dans les modèles
- [ ] Si nouvelle table : cascade delete depuis `Session` vérifiée (test obligatoire)
- [ ] Si modif detection safety : exécuter `test_safety_adversarial.py` et mettre à jour les corpus
