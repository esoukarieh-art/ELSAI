# Conformité RGAA — ELSAI PoC

Niveau visé : **RGAA 4.1 AA** (conforme à l'article 47 de la loi n° 2005-102 ;
une promotion vers AAA est à l'étude pour la partie mineurs).

## Outillage automatisé (CI)

| Outil | Rôle | Seuil bloquant |
|---|---|---|
| `eslint-plugin-jsx-a11y` (flat config) | Lint statique a11y (alt-text, aria-*, label…) | Toute erreur bloque `npm run lint` |
| `@axe-core/playwright` (E2E) | Audit runtime sur DOM rendu (Chromium + Firefox + mobile-chrome) | Zéro violation `critical` / `serious` |
| `@lhci/cli` (Lighthouse CI) | Scores perf + a11y + best-practices + SEO | Accessibility ≥ 95 ; best-practices ≥ 90 |

## Pages couvertes

11 pages vitrine + `/chat` (avec et sans `EmergencyBanner` actif).
Voir [tests/e2e/a11y.spec.ts](../tests/e2e/a11y.spec.ts).

## Règles RGAA vérifiées automatiquement

- **1.** Images (alt-text)
- **6.** Liens : `link-name`, `anchor-has-content`, `anchor-is-valid`
- **7.** Scripts : navigation clavier (tests `keyboard.press("Tab")`)
- **8.3 / 8.5.** Langue (`lang="fr"`) et titre de page (`<title>` non vide)
- **9.** Informations structurées : `heading-has-content`, `aria-role`, `role-supports-aria-props`
- **10.** Présentation : `color-contrast` (Lighthouse + axe)
- **11.** Formulaires : `label-has-associated-control`

## Limites de l'automatisé

Environ 30-40% des critères RGAA nécessitent un audit manuel :

- Sémantique contextuelle (titre de page pertinent, ordre logique)
- Alternatives textuelles qualitatives (un `alt=""` techniquement valide peut être
  inutilisable en pratique)
- Navigation au lecteur d'écran (NVDA, VoiceOver)
- Comportement avec JavaScript désactivé
- Sous-titres vidéo (si contenu vidéo ajouté)

**Recommandation** : audit RGAA externe par prestataire certifié avant
déploiement production, particulièrement pour l'espace mineurs.

## Lancer localement

```bash
cd elsai-poc/frontend

# Lint a11y statique
npm run lint

# Tests axe-core runtime
npm run test:e2e -- a11y

# Lighthouse CI (nécessite build préalable)
npm run build && npm run lhci
```

## Ressources

- [RGAA 4.1 — Référentiel complet](https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/)
- [axe-core Rules](https://dequeuniversity.com/rules/axe/)
- [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/?levels=aaa)
