# Calendrier éditorial blog ESLAÏ — 24 briefs initiaux

**Cadence cible** : 2 articles/semaine sur 12 semaines.
**3 piliers** :
- `droits-18-25` (audience adult, jeunes majeurs)
- `recours-caf-rsa` (audience adult, recours administratifs)
- `mineurs-danger` (audience minor, prévention/orientation 119)

Schémas systématiques :
- `<FAQ>` au minimum 1 par article (rich snippet FAQPage)
- `<HowToSteps>` quand l'article décrit une démarche concrète
- CTA : « Poser ma question dans ESLAÏ » + lien glossaire si sigles
- 1 lien interne vers une page `/aides/...` longue traîne quand pertinent

---

## Pilier 1 — Droits 18-25 (8 articles)

| # | Slug | Titre | Mot-clé principal | Intent | Schémas | Audience |
|---|------|-------|-------------------|--------|---------|----------|
| 1 | `j-ai-18-ans-quels-droits` | « J'ai 18 ans, quels sont mes droits ? » | droits jeune majeur | informational | FAQ | adult |
| 2 | `sortie-ase-18-ans` | « Sortir de l'ASE à 18 ans : le contrat jeune majeur » | contrat jeune majeur ASE | transactional | HowTo + FAQ | adult |
| 3 | `cej-tout-comprendre` | « Le CEJ (Contrat d'Engagement Jeune) en 2026 » | CEJ allocation | informational | HowTo | adult |
| 4 | `bourse-crous-2026` | « Bourse CROUS : conditions, montants, démarche » | bourse CROUS | informational | FAQ + HowTo | adult |
| 5 | `apl-etudiant-premier-logement` | « APL pour étudiant : premier logement, premier dossier » | APL étudiant | transactional | HowTo | adult |
| 6 | `mission-locale-comment-ca-marche` | « Mission Locale : à quoi ça sert quand on a 18-25 ans ? » | Mission Locale jeune | informational | FAQ | adult |
| 7 | `permis-aide-financement` | « Financer son permis de conduire à 18-25 ans » | aide permis jeune | informational | HowTo | adult |
| 8 | `couverture-sante-jeune` | « Couverture santé après 18 ans : ce qui change » | C2S jeune adulte | informational | FAQ | adult |

## Pilier 2 — Recours CAF / RSA (8 articles)

| # | Slug | Titre | Mot-clé principal | Intent | Schémas | Audience |
|---|------|-------|-------------------|--------|---------|----------|
| 9 | `rsa-refuse-que-faire` | « RSA refusé : que faire ? Étapes du recours » | RSA refusé recours | transactional | HowTo + FAQ | adult |
| 10 | `rapo-caf-modele-lettre` | « RAPO CAF : modèle de lettre commenté » | RAPO modèle lettre | transactional | HowTo | adult |
| 11 | `indus-caf-comment-contester` | « Trop-perçu CAF (indu) : comment le contester » | indu CAF contester | transactional | HowTo | adult |
| 12 | `caf-suspension-droits-erreur` | « CAF a suspendu mes droits par erreur » | suspension CAF erreur | informational | FAQ | adult |
| 13 | `apl-recalcul-baisse` | « Mon APL a baissé : comprendre le recalcul » | recalcul APL | informational | FAQ | adult |
| 14 | `prime-activite-rappel` | « Prime d'activité : demander un rappel » | rappel prime activité | transactional | HowTo | adult |
| 15 | `tribunal-administratif-aide` | « Saisir le tribunal administratif après un RAPO » | recours tribunal CAF | transactional | HowTo | adult |
| 16 | `defenseur-droits-quand-saisir` | « Défenseur des droits : quand le saisir » | Défenseur des droits CAF | informational | FAQ | adult |

## Pilier 3 — Mineurs en danger / orientation (8 articles)

Posture : pédagogique, douce, jamais culpabilisante. CTA discret vers le 119, jamais de panique.

| # | Slug | Titre | Mot-clé principal | Intent | Schémas | Audience |
|---|------|-------|-------------------|--------|---------|----------|
| 17 | `signaler-c-est-quoi` | « Signaler quelque chose, c'est quoi exactement ? » | signaler enfance | informational | FAQ | minor |
| 18 | `119-comment-ca-marche` | « Le 119 : qui répond, qu'est-ce qu'on dit ? » | 119 enfance en danger | informational | FAQ | minor |
| 19 | `maison-des-ados` | « La Maison des Adolescents : à quoi ça sert ? » | Maison des Ados | informational | FAQ | minor |
| 20 | `harcelement-scolaire-aide` | « Harcèlement scolaire : à qui parler, étape par étape » | harcèlement scolaire aide | transactional | HowTo + FAQ | minor |
| 21 | `parents-disputes-conflit` | « Quand ça crie tout le temps à la maison » | conflit familial ado aide | informational | FAQ | minor |
| 22 | `fugue-droit-mineur` | « J'ai envie de partir : ce qui se passe légalement » | fugue mineur droit | informational | FAQ | minor |
| 23 | `pip-c-est-quoi` | « Le placement, c'est quoi ? On t'explique » | placement enfance ASE | informational | FAQ | minor |
| 24 | `garde-divorcee-mes-droits` | « Mes parents divorcent : qu'est-ce que je peux dire ? » | parents divorce ado droit | informational | FAQ | minor |

---

## Process de rédaction

1. **Brief** : ce fichier (mot-clé, intent, schémas, audience).
2. **Draft** : depuis `/admin/blog`, pré-remplir avec un prompt LLM, relecture humaine **obligatoire**.
3. **Schemas** : remplir `faq_json` (et `howto_json` si applicable) côté admin.
4. **CTA** : choisir/configurer dans `/admin/cta` (auto-injecté selon tags).
5. **SEO** : `seo_title` ≤ 60 chars, `seo_description` 150-160 chars, OG image personnalisée.
6. **Maillage** : 2-3 liens internes vers piliers/articles cluster + 1 vers `/aides/...` longue traîne quand pertinent.
7. **Publication** : status=`published`, audit du JSON-LD via Google Rich Results Test.

## KPIs à 3 mois

- Trafic organique : > 5 000 sessions/mois sur le blog
- Position moyenne : top 20 sur ≥ 30 mots-clés ciblés
- Taux de clic CTA chat : > 4 % (vs benchmark < 1 % pour blogs SEO génériques)
- Soumissions feedback (👍/👎) : ≥ 80/mois → boucle vertueuse alimentant la liste de briefs futurs
