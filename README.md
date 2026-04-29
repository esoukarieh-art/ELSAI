# ESLAÏ

![version](https://img.shields.io/badge/version-1.0.0-5A7E6B?style=flat&logoColor=white) <!-- x-release-please-version -->

Assistant social IA conversationnel (FR) — PWA Next.js + FastAPI. Cible : particuliers
majeurs et mineurs 12-18 ans. Posture empathique et franche, anonymat strict, droit à l'oubli,
détection danger mineurs avec orientation vers le 119.

## Structure du dépôt

- [`elsai-poc/backend/`](elsai-poc/backend/) — API FastAPI + SQLite (POC)
- [`elsai-poc/frontend/`](elsai-poc/frontend/) — PWA Next.js (chat + site vitrine)
- [`docs/`](docs/) — spécifications fonctionnelles et de design

## Versionnage

Les évolutions sont tracées dans [CHANGELOG.md](CHANGELOG.md), généré automatiquement
par [release-please](https://github.com/googleapis/release-please) à partir des
[Conventional Commits](https://www.conventionalcommits.org/fr/v1.0.0/) :

- `feat: …` → bump *minor* (1.0.0 → 1.1.0)
- `fix: …` → bump *patch* (1.0.0 → 1.0.1)
- `feat!: …` ou `BREAKING CHANGE:` → bump *major* (1.0.0 → 2.0.0)

À chaque push sur `main`, une PR « chore(main): release X.Y.Z » est ouverte
automatiquement. La merger crée le tag Git correspondant et la GitHub Release.
