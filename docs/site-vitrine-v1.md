# Site vitrine ELSAI — V1

Synthèse des décisions produit/marketing et livrables initiaux.

---

## 1. Décisions validées

| Domaine | Décision |
|---|---|
| **Objectif** | Triple équilibré : inscriptions PWA + sensibilisation + partenariats |
| **Cible V1** | Mixte assumé (majeurs + mineurs + pros), parcours distincts via "Pour qui ?" |
| **Promesse héro** | *"ELSAI t'aide à comprendre et activer tes droits sociaux. Anonymement, sans rendez-vous, sans jugement."* |
| **Différenciateurs** | Anonymat + droit à l'oubli · 24/7 gratuit · Ton empathique et franc · Expertise droits sociaux FR + sécurité mineurs |
| **Concurrents positionnés** | Mes Aides · 3939/119 · IA généralistes |
| **Ton** | Tutoiement usagers / Vouvoiement Partenariats & Contact pros |
| **Stack** | Next.js monorepo, site `/`, app PWA `/app` |
| **Hébergement** | Hébergeur souverain FR (Scaleway / Clever Cloud) |
| **Visuel** | Formes organiques abstraites (charte "Symbiose Organique") |
| **Accessibilité** | RGAA AA |
| **Analytics** | Plausible ou Matomo self-host (sans cookies) |
| **CTA principal** | "Poser ma question" → chat direct anonyme |
| **Urgences** | Bandeau permanent discret (119 / 3919 / 115) sur toutes les pages |

---

## 2. Arborescence V1

```
/                             Accueil (tutoiement)
├── /comment-ca-marche        Fonctionnement de l'assistant (tu)
├── /cas-dusage               Scénarios détaillés (tu)
│   ├── #droits-18-ans
│   ├── #rsa-caf-refuse
│   ├── #ado-difficulte
│   ├── #logement-urgence
│   ├── #surendettement
│   ├── #violences
│   └── #handicap-mdph
├── /pour-qui                 Parcours : majeurs / mineurs / pros (tu + vous)
├── /ethique                  Anonymat, droit à l'oubli, sécurité mineurs, RGPD (tu)
├── /faq                      (tu)
├── /blog                     Articles SEO droits sociaux (tu)
│   └── /blog/[slug]
├── /partenariats             B2B institutionnels (vous)
├── /contact                  Formulaires pros + presse (vous)
├── /mentions-legales
├── /cgu
├── /confidentialite
└── /app                      PWA (hors scope site vitrine)
```

---

## 3. Wireframe textuel — Accueil

```
┌─────────────────────────────────────────────────────────┐
│  [Bandeau urgences]  En danger ? 119 (mineurs) · 3919   │
│                      (violences) · 115 (sans-abri)       │
├─────────────────────────────────────────────────────────┤
│  [Logo ELSAI]    Comment ça marche · Cas d'usage ·       │
│                  Pour qui ? · Éthique · FAQ              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  HERO  (forme organique Vert Pin en arrière-plan)        │
│                                                           │
│  Comprends et active tes droits sociaux.                 │
│  Anonymement. Sans rendez-vous. Sans jugement.           │
│                                                           │
│  [ Poser ma question →  ]  (CTA Vert Pin)                │
│   Gratuit · Anonyme · 24/7                               │
│                                                           │
├─────────────────────────────────────────────────────────┤
│  POURQUOI ELSAI ?  (4 piliers, icônes organiques)        │
│  ◯ Anonyme        ◯ Disponible 24/7                     │
│  ◯ Ton humain     ◯ Expertise droits FR                 │
├─────────────────────────────────────────────────────────┤
│  CAS D'USAGE  (4 cards cliquables, fond Crème)           │
│  [🎂 J'ai 18 ans]  [📋 RSA refusé]                       │
│  [💬 Ça va mal]    [🏠 Logement ce soir]                 │
│  → Voir tous les cas d'usage                             │
├─────────────────────────────────────────────────────────┤
│  COMMENT ÇA MARCHE  (3 étapes)                           │
│  1. Tu poses ta question    2. ELSAI t'écoute et         │
│  en langage naturel         t'oriente    3. Tu agis      │
├─────────────────────────────────────────────────────────┤
│  ELSAI N'EST PAS…  (clarification concurrents)           │
│  · un simulateur de droits comme Mes Aides               │
│  · une ligne d'écoute comme le 3939                      │
│  · une IA généraliste comme ChatGPT                      │
│  → Découvre la différence                                │
├─────────────────────────────────────────────────────────┤
│  POUR LES PROS  (bloc partenariats, fond Vieux Rose)     │
│  Travailleur social, association, collectivité ?        │
│  Orientez vos usagers vers ELSAI.                        │
│  [ Devenir partenaire → ]                                │
├─────────────────────────────────────────────────────────┤
│  FOOTER                                                   │
│  À propos · Éthique · Mentions · CGU · Confidentialité  │
│  Urgences : 119 · 3919 · 115 · 3114 (suicide)           │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Copywriting home (prêt à poser)

### Hero
> **Comprends et active tes droits sociaux.**
> Anonymement. Sans rendez-vous. Sans jugement.
>
> ELSAI est ton assistant social, disponible 24/7 et gratuit. Pose ta question comme tu la formulerais à un ami.
>
> **[ Poser ma question → ]**  *Gratuit · Anonyme · 24/7*

### Pourquoi ELSAI (4 piliers)
- **Anonyme.** Pas de nom, pas d'email, pas de dossier. Tu peux tout effacer quand tu veux.
- **Disponible 24/7.** La nuit, le week-end, un jour férié. ELSAI est là.
- **Ton humain.** Ni condescendant, ni robotique. Empathique et franc.
- **Expertise FR.** Formé sur le droit social français. RSA, CAF, MDPH, logement, mineurs — il connaît.

### Cas d'usage (teasers)
- **🎂 "Je viens d'avoir 18 ans, quelles aides ?"** — Jeune majeur, tu as des droits qui s'ouvrent. ELSAI te les explique.
- **📋 "Mon RSA a été refusé, que faire ?"** — Recours, délais, pièces à fournir. On fait le point ensemble.
- **💬 "Ça va mal à la maison."** — Tu as moins de 18 ans. ELSAI t'écoute et t'oriente vers les bonnes ressources, en toute confidentialité.
- **🏠 "Je dors dehors ce soir."** — 115, hébergement d'urgence, maraudes. Les options près de toi, maintenant.

### Comment ça marche
1. **Tu poses ta question** en langage naturel, comme à quelqu'un.
2. **ELSAI t'écoute** et t'oriente vers les bonnes démarches ou le bon interlocuteur.
3. **Tu agis** avec les infos concrètes en main.

### ELSAI n'est pas…
- **Pas un simulateur** comme Mes Aides : tu discutes, tu n'remplis pas de formulaire.
- **Pas une ligne d'écoute** comme le 3939 : c'est écrit, à ton rythme, 24/7.
- **Pas une IA généraliste** comme ChatGPT : spécialisé droit social FR, avec une éthique stricte.

### Bloc partenariats
> **Vous accompagnez des publics en difficulté ?**
> Travailleur social, association, collectivité — ELSAI peut compléter votre action auprès de vos usagers, 24/7 et en toute confidentialité.
>
> **[ Devenir partenaire → ]**

---

## 5. Prochaines étapes suggérées

1. Valider ce document
2. Finaliser les 3 scénarios manquants sur `/cas-dusage` (surendettement, violences, MDPH)
3. Wireframes des pages secondaires (Comment ça marche, Pour qui, Éthique)
4. Choix CMS headless ou contenu en dur (décision reportée)
5. Mise en place tracking Plausible + bannière urgences
6. Plan SEO : mots-clés prioritaires pour blog (ex : "comment faire recours RSA", "aide 18 ans", "logement urgence ce soir")
