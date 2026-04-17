# Tests E2E ELSAI

Tests end-to-end Playwright couvrant les parcours critiques du POC.

## Lancer en local

```bash
cd elsai-poc/frontend
npm install
npx playwright install chromium firefox
npm run test:e2e           # headless
npm run test:e2e:ui        # mode interactif
```

Le `webServer` de `playwright.config.ts` démarre automatiquement `next dev`.

## Couverture

| Fichier | Scénario | Criticité |
|---|---|---|
| `emergency-minor.spec.ts` | Profil mineur → `danger_detected=true` → bannière 119 | **CRITIQUE** |
| `emergency-minor.spec.ts` | Profil adulte → 3114 | **CRITIQUE** |
| `chat-anonymous.spec.ts` | Envoi message + réponse, aucun cookie identifiant | **CRITIQUE** |
| `chat-anonymous.spec.ts` | Bouton "Droit à l'oubli" purge `sessionStorage` | **CRITIQUE** |
| `a11y.spec.ts` | Audit axe-core RGAA AA (accueil + /chat) | **MAJEURE** |
| `a11y.spec.ts` | Skip link clavier | **MAJEURE** |

## Stratégie de mock

L'API backend (`/api/auth/session`, `/api/chat`, `/api/auth/forget`) est **mockée** via `page.route`
(voir `fixtures/api-mock.ts`). Objectif : CI déterministe, indépendant d'OpenAI/SQLite.

Des tests d'intégration backend réels (pytest) complètent cette couverture côté serveur.

## TODO (phases ultérieures du plan qualité)

- Tests Lighthouse CI (perf + PWA ≥ 90, a11y ≥ 95)
- Scénarios VoiceRecorder (mock MediaRecorder)
- Tests multi-onglets pour le droit à l'oubli
- Couverture mobile WebKit (Safari iOS)
