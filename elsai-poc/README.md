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
| GET     | `/api/auth/privacy`            | Droit d'accès RGPD (compteurs, 0 PII)  |
| DELETE  | `/api/auth/forget`             | Droit à l'oubli : purge la session     |
| POST    | `/api/chat`                    | Conversation IA (Claude)               |
| POST    | `/api/documents/analyze`       | OCR + explication d'un document        |
| GET     | `/api/dashboard/metrics`       | Métriques agrégées anonymes            |
| GET     | `/api/health`                  | Santé + statut config LLM              |

Tous les endpoints émettent un header `X-Correlation-Id` pour l'audit.

## Contraintes éthiques implémentées

- **Anonymat** : sessions sans nom/email, JWT opaque.
- **Droit à l'oubli** : `DELETE /api/auth/forget` purge conversations + messages (testé au niveau SQL brut).
- **Rétention bornée** : purge automatique des sessions inactives (`SESSION_RETENTION_HOURS`, défaut 24h).
- **Détection danger** : double couche (heuristique regex + prompt Claude en mode mineur) + couverture red-team (jailbreak, evasion, injection).
- **CTA d'urgence** : bandeau plein écran avec 119 si signal détecté — testé E2E.
- **Pas de cache API dans le service worker** : contenu utilisateur jamais mis en cache.
- **Documents non persistés** : les images OCRisées ne sont pas stockées côté serveur.
- **Logs d'audit** : events `safety.danger_detected` et `privacy.forget_executed` loggés en JSON structuré avec correlation ID — **sans contenu utilisateur**.

## Qualité & observabilité

| Chantier | Outillage | Seuil bloquant |
|---|---|---|
| Tests backend | `pytest` (91 pass + 24 xfail documentant les gaps) | Obligatoire en CI |
| Red-team safety | `test_safety_adversarial.py` (jailbreak, evasion 119, injection) | Obligatoire en CI |
| E2E frontend | Playwright (Chromium + Firefox + mobile) | Obligatoire en CI |
| RGAA AA | `eslint-plugin-jsx-a11y` + `@axe-core/playwright` + Lighthouse CI | Accessibility ≥ 95 |
| Observabilité | `structlog` JSON + Sentry (optionnel) + correlation ID | Logs anonymes |
| RGPD | `test_privacy.py` — oubli SQL, TTL, canary, droit d'accès | Suite verte obligatoire |

## Documentation

- [Architecture technique](docs/architecture.md) — couches, flux, dépendances, observabilité
- [Documentation API](docs/api.md) — endpoints, schémas, exemples curl
- [Guide contributeur](docs/contributing.md) — setup, conventions, tests, checklist PR
- [Documentation fonctionnelle](docs/fonctionnel.md) — parcours, règles éthiques, cas d'usage
- [Conformité RGPD](docs/rgpd.md) — registre traitements, droits, DPIA, checklist prod
- [Conformité RGAA](../frontend/docs/rgaa.md) — niveau AA, outillage, limites

## Roadmap post-POC

1. Remplacer SQLite par PostgreSQL + chiffrement TDE
2. Remplacer Tesseract par Google Document AI pour les documents manuscrits
3. Remplacer auth JWT maison par Keycloak OAuth2/OIDC
4. Extraire `services/safety.py` en microservice dédié (classifier CamemBERT)
5. Ajouter l'annuaire géolocalisé (CCAS/France Services)
6. Ajouter Whisper STT + TTS pour l'interface vocale
7. Hébergement HDS/SecNumCloud (OVH/Scaleway)

Voir `Architecture_Technique_ELSAI.docx` pour l'architecture cible complète.
