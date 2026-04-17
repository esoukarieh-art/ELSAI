# Architecture technique — ELSAI POC

## 1. Vue d'ensemble

ELSAI POC est un **monolithe web** composé de trois couches :

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend — Next.js 14 PWA (TypeScript + Tailwind)           │
│  Pages : / (landing) • /chat • /scan • /dashboard            │
└───────────────────────┬──────────────────────────────────────┘
                        │  HTTPS + Bearer token (JWT opaque)
                        ▼
┌──────────────────────────────────────────────────────────────┐
│  Backend — FastAPI (Python 3.12)                             │
│  Routers : auth • chat • documents • dashboard               │
│  Services : llm (Claude) • ocr (Tesseract) • safety (regex)  │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│  SQLite — sessions, conversations, messages, metric_events   │
└──────────────────────────────────────────────────────────────┘
```

### Choix de ce modèle pour le POC

L'architecture cible (cf. `Architecture_Technique_ELSAI.docx`) prévoit
microservices, Kubernetes, RabbitMQ, Keycloak et PostgreSQL chiffré.
Pour un POC destiné à **valider le concept fonctionnel**, c'est prématuré.

Le monolithe garde une **séparation modulaire stricte** (`routers/`,
`services/`, `prompts/`) pour permettre l'extraction ultérieure en
microservices sans réécriture lourde.

## 2. Couches et responsabilités

### Frontend (`elsai-poc/frontend/`)

| Répertoire | Rôle |
|------------|------|
| `app/` | Routes Next.js (App Router) — `page.tsx`, `chat/`, `scan/`, `dashboard/` |
| `components/` | `ChatBubble.tsx`, `EmergencyBanner.tsx` |
| `lib/` | Client API, helpers session |
| `public/` | Manifest PWA, icônes, logos ELSAI |

PWA : service worker installé, **aucun cache des endpoints API**
(contenu utilisateur jamais persisté côté client).

### Backend (`elsai-poc/backend/app/`)

| Module | Rôle |
|--------|------|
| `main.py` | Point d'entrée FastAPI, CORS, lifespan, `/api/health` |
| `config.py` | Settings Pydantic (env vars) |
| `database.py` | Engine SQLAlchemy + `init_db()` |
| `models.py` | `Session`, `Conversation`, `Message`, `MetricEvent` |
| `schemas.py` | DTOs Pydantic (request/response) |
| `auth.py` | Dépendance `SessionDep`, génération/validation JWT |
| `routers/auth.py` | Création session anonyme + droit à l'oubli |
| `routers/chat.py` | Orchestration message → safety → LLM → stockage |
| `routers/documents.py` | Upload image → OCR → explication Claude |
| `routers/dashboard.py` | Métriques anonymisées agrégées |
| `services/llm.py` | Appels Claude (chat + explication documents) |
| `services/ocr.py` | Wrapper Tesseract (fra + eng) |
| `services/safety.py` | Détection heuristique de signaux de danger |
| `prompts/` | System prompts mineur/majeur, prompt document |

### Données (SQLite)

4 tables, schéma minimal volontaire :

- **sessions** — `id`, `profile` (`adult`|`minor`), `created_at`, `last_activity`
- **conversations** — `id`, `session_id`, `topic`, `created_at`
- **messages** — `id`, `conversation_id`, `role`, `content`, `danger_flag`, `created_at`
- **metric_events** — `id`, `event_type` (`chat`|`ocr`|`danger`|`forget`), `profile`, `created_at`

Aucun PII : pas de nom, email, téléphone. Les messages eux-mêmes sont
effaçables via `DELETE /api/auth/forget`.

## 3. Flux principaux

### Flux conversationnel (`POST /api/chat`)

```
Client ──┐
         │ 1. Envoi message + token
         ▼
    [router chat]
         │ 2. Récupère/crée Conversation
         │ 3. safety.scan()  ── heuristique regex ──► {danger, cta}
         │ 4. INSERT Message(role=user)
         │ 5. SELECT historique
         ▼
    [service llm]
         │ 6. Appel Claude avec system prompt (adult|minor)
         │ 7. Si mineur : parse tags <danger>/<cta> dans la réponse
         ▼
    [router chat]
         │ 8. Fusion danger heuristique + LLM
         │ 9. INSERT Message(role=assistant) + MetricEvent
         ▼
    Réponse {reply, danger_detected, emergency_cta}
```

**Double couche de sécurité** : la détection ne repose jamais sur le seul
LLM. `safety.scan()` attrape les cas évidents même si le modèle rate.

### Flux analyse document (`POST /api/documents/analyze`)

```
Upload image (PNG/JPG/WEBP, ≤10 MB)
      │
      ▼
 Tesseract OCR (fra+eng)  ──► texte brut
      │
      ▼
 Claude "explain_document" ──► {explanation, suggested_actions}
      │
      ▼
 Réponse JSON + MetricEvent(ocr)
```

Le binaire image **n'est jamais persisté** (contrainte droit à l'oubli).

### Flux session anonyme

```
POST /api/auth/session {profile}
  → crée Session (UUID), génère JWT (jose/HS256)
  → { session_id, token, expires_in }

Tous les autres endpoints : header Authorization: Bearer <token>
  → SessionDep vérifie + charge la Session SQLAlchemy

DELETE /api/auth/forget
  → purge conversations + messages (cascade)
  → log MetricEvent(forget)
```

## 4. Dépendances externes

| Service | Usage | Alternative cible |
|---------|-------|-------------------|
| Anthropic Claude | Conversations, explication documents | (conservé) |
| Tesseract OCR | Extraction texte images | Google Document AI (manuscrit) |
| SQLite (fichier local) | Stockage POC | PostgreSQL + chiffrement TDE |
| Auth JWT maison (jose) | Sessions opaques | Keycloak OAuth2/OIDC |

## 5. Roadmap vers l'architecture cible

1. SQLite → PostgreSQL chiffré
2. Tesseract → Google Document AI
3. Auth maison → Keycloak
4. Extraire `services/safety.py` en microservice (classifier CamemBERT)
5. Ajouter annuaire géolocalisé CCAS/France Services
6. Whisper STT + TTS pour interface vocale
7. Hébergement HDS/SecNumCloud (OVH ou Scaleway)

Détails complets : `Architecture_Technique_ELSAI.docx`.
