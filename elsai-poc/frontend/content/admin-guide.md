# Guide administrateur — Backoffice ELSAI

> Guide opérationnel en français à destination des administrateurs du backoffice ELSAI.
> Version : POC — mise à jour 2026-04-21.

---

## Sommaire

1. [Introduction](#1-introduction)
2. [Connexion & rôles](#2-connexion--rôles)
3. [Tableau de bord — Métriques](#3-tableau-de-bord--métriques)
4. [Alertes mineurs](#4-alertes-mineurs)
5. [Prompts IA & A/B testing](#5-prompts-ia--ab-testing)
6. [Modules & parcours (feature flags)](#6-modules--parcours-feature-flags)
7. [Blog multi-pillar](#7-blog-multi-pillar)
8. [CTA system](#8-cta-system)
9. [Lead magnets](#9-lead-magnets)
10. [Séquences email](#10-séquences-email)
11. [Analytics](#11-analytics)
12. [Courriers types](#12-courriers-types)
13. [Audit](#13-audit)
14. [Droit à l'oubli (RGPD)](#14-droit-à-loubli-rgpd)
15. [Exports CSV](#15-exports-csv)
16. [Gestion des utilisateurs admin](#16-gestion-des-utilisateurs-admin)
17. [Annexes — Glossaire & FAQ](#17-annexes--glossaire--faq)

---

## 1. Introduction

Le **backoffice ELSAI** est l'interface d'administration qui permet de piloter l'assistant social IA ELSAI : modération des alertes mineurs, édition des prompts de l'IA, publication de contenu (blog, lead magnets, CTA), gestion des séquences email B2B/B2C, et supervision des métriques et de la conformité RGPD.

**URL d'accès** : `https://elsai.fr/admin` (production) — `http://localhost:3000/admin` (dev).

**Prérequis** :
- Un compte admin actif créé par un `super_admin`.
- Un navigateur moderne (Chrome, Firefox, Edge, Safari).
- Connexion HTTPS obligatoire en production.

**Principes clés** :
- **Anonymat absolu** : aucune donnée personnelle des utilisateurs ne doit transiter dans les exports ou les logs.
- **Traçabilité** : chaque action sensible est enregistrée dans le journal d'audit (immuable).
- **Rôles cloisonnés** : vous ne voyez que les pages autorisées par votre rôle.

---

## 2. Connexion & rôles

### 2.1 Se connecter

1. Ouvrir `/admin`.
2. Saisir votre **email** et votre **mot de passe**.
3. Cliquer sur **Se connecter**.

Un jeton JWT est stocké dans le navigateur pour une durée de **8 heures**. Au-delà, vous êtes automatiquement déconnecté et devez vous reconnecter.

> **Mot de passe oublié** : contacter un `super_admin`. Il peut réinitialiser votre mot de passe via la page *Utilisateurs*.

### 2.2 Jeton legacy (super-admins techniques)

Pour les interventions techniques, un jeton `X-Admin-Token` (défini dans la variable d'environnement `ADMIN_TOKEN` côté serveur) peut être utilisé. Il accorde un accès `super_admin` immédiat. Ce mode est réservé aux opérations ponctuelles et tracé dans l'audit.

### 2.3 Les 6 rôles

| Rôle | Peut faire | Typiquement |
|---|---|---|
| `super_admin` | Tout, y compris gérer les comptes admin et supprimer des ressources | Lead tech / direction |
| `moderator_119` | Consulter et traiter les alertes mineurs, exporter les alertes | Modérateurs partenaires 119 |
| `content_editor` | Créer/éditer/publier blog, CTA, lead magnets, emails, prompts, features | Équipe contenu |
| `content_reviewer` | Relire et faire passer les articles en `review` → `scheduled` | Relecteurs |
| `content_author` | Rédiger des brouillons (sans publier) | Rédacteurs |
| `b2b_sales` | Exporter les métriques B2B | Équipe vente |

> Si un bouton ou une page est masqué, c'est que votre rôle ne le permet pas. Demandez à un `super_admin` une montée de droits si nécessaire.

---

## 3. Tableau de bord — Métriques

**Page** : `/admin` — **Accès** : tous les rôles.

**À quoi ça sert** : visualiser en un coup d'œil la santé de la plateforme (trafic, usage de l'IA, signaux d'alerte). C'est le premier écran après connexion.

Le tableau de bord affiche en temps réel :
- **Sessions totales** (cumul depuis le lancement) et **sessions actives** (dernière heure).
- Nombre de **chats**, **requêtes OCR**, **détections de danger** (mineurs).
- **Demandes de droit à l'oubli** en attente.
- Répartition **adulte / mineur** des profils connectés.

**Exemple d'usage**
> Lundi matin, vous voyez *152 sessions actives* et *3 détections de danger*. Vous allez directement dans *Alertes mineurs* (§4) traiter les 3 cas avant votre café. Vous notez aussi que le ratio mineurs a bondi de 15 % → 30 % sur le week-end : vous le signalez à l'équipe produit.

> Les chiffres sont anonymes et agrégés. Aucune identité n'est exposée.

---

## 4. Alertes mineurs

**Page** : `/admin/alerts` — **Accès** : `moderator_119`, `super_admin`.

**À quoi ça sert** : centraliser les signaux de danger détectés automatiquement dans les échanges avec des utilisateurs mineurs (idées suicidaires, maltraitance, fugue…) afin qu'un modérateur humain décide de la suite (orientation 119, archivage, faux positif).

### Action : traiter une alerte

1. Filtrer la liste par statut : **en attente (pending)**, **traitée (reviewed)** ou **archivée (archived)**.
2. Cliquer sur une alerte pour voir l'extrait conversationnel déclencheur (session anonymisée).
3. Choisir le nouveau statut.
4. Ajouter une **note du modérateur** (obligatoire si passage à `reviewed`).
5. Valider.

**Exemple d'usage**
> Une alerte `pending` apparaît avec l'extrait *« je veux disparaître depuis que papa est parti »*. Le modérateur 119 vérifie que la session utilisateur a bien reçu le message d'orientation 119 automatique, passe le statut à `reviewed`, note *« orientation 119 confirmée — pas de suivi possible car session anonyme »*, puis valide. L'action est inscrite dans l'audit.

> **Rappel éthique** : en cas de danger immédiat, orienter vers le **119** (enfance en danger). Ne jamais tenter d'identifier le mineur ; la session reste anonyme par conception.

---

## 5. Prompts IA & A/B testing

**Pages** : `/admin/prompts` (édition) et `/admin/experiments` (A/B) — **Accès** : `content_editor`, `super_admin`.

**À quoi ça sert** : ajuster le comportement conversationnel d'ELSAI (ton, règles éthiques, consignes de sécurité) sans redéploiement, et tester plusieurs formulations pour choisir la plus efficace.

### 5.1 Éditer un prompt

1. Sélectionner un prompt dans la liste (nom + version active).
2. Modifier le contenu.
3. Cliquer **Enregistrer**.
→ Une nouvelle version est créée, l'ancienne devient inactive mais reste consultable dans **Historique**.

### 5.2 Revenir au prompt par défaut

Dans l'éditeur, bouton **Réinitialiser** : recharge le prompt fourni par le fichier système (utile en cas de régression).

### 5.3 Créer une variante A/B

1. Aller dans `/admin/experiments`.
2. Sélectionner le prompt cible.
3. **Nouvelle variante** : saisir un libellé + un poids (0–1000).
4. Ajuster les poids des variantes existantes pour que la somme reflète la répartition voulue.

### 5.4 Lire les stats

Pour chaque variante : nombre de messages servis, taux de flags de danger déclenchés. Utile pour éliminer rapidement une variante contre-productive.

**Exemple d'usage**
> Vous voulez tester une reformulation plus chaleureuse du prompt `system_minor`. Vous créez la variante `warmer_v1` avec un poids de 200 (vs `control` à 800) — soit 20 % du trafic. Après 7 jours, les stats montrent que `warmer_v1` génère 3× plus de flags de danger (faux positifs). Vous repassez son poids à 0 et archivez la variante.

---

## 6. Modules & parcours (feature flags)

**Page** : `/admin/features` — **Accès** : `content_editor` (activation), `super_admin` (suppression).

**À quoi ça sert** : allumer ou éteindre un module (ex. interface vocale, OCR, parcours CAF) sans passer par un déploiement technique. Indispensable pour les tests progressifs et les coupures d'urgence.

### Actions

- **Activer / désactiver** un module : clic sur le toggle.
- **Créer une flag** : nom (en minuscules, underscore), description, catégorie.
- **Supprimer une flag** : réservé `super_admin` — à n'utiliser qu'après suppression de tout code consommateur.

> Les flags permettent d'activer/désactiver des parcours utilisateurs sans redéploiement.

**Exemple d'usage**
> L'API OpenAI Whisper (STT) tombe en panne un vendredi soir. Vous désactivez la flag `voice_input_enabled` en un clic : les utilisateurs voient désormais uniquement la saisie texte, sans erreur. Lundi matin, Whisper est de retour, vous réactivez la flag.

---

## 7. Blog multi-pillar

**Pages** : `/admin/blog` (liste), `/admin/blog/[id]` (édition), `/admin/blog/[id]/revisions` (historique) — **Accès** : `content_editor`, `content_reviewer`, `content_author`.

**À quoi ça sert** : produire et publier le contenu éditorial du site vitrine ELSAI (guides d'aides sociales, FAQ CAF, articles pour adolescents) avec un vrai workflow de relecture et une stratégie SEO.

### 7.1 Workflow de publication

```
draft → review → scheduled → published → archived
```

Transitions autorisées :
- `content_author` : `draft` uniquement.
- `content_reviewer` / `content_editor` : passage en `review`, `scheduled`, `published`, `archived`.

### 7.2 Créer un article

1. **Nouvel article**.
2. Remplir : **titre**, **slug** (URL), **audience** (adult / minor / all), **tags**, **contenu MDX**.
3. SEO : **meta title**, **meta description**, **mot-clé**, **intent** (informational, transactional…).
4. Optionnel : **eyebrow** (surtitre visuel).
5. Enregistrer le brouillon.

### 7.3 Programmer une publication

Dans l'éditeur : champ **Publier le** → date future. Statut passe à `scheduled`. L'article sera publié automatiquement.

### 7.4 Attacher un CTA

Section **CTA** de l'éditeur : ajouter un ou plusieurs blocs existants (voir §8), réordonner.

### 7.5 Rollback

Page **Revisions** : chaque sauvegarde crée un instantané. Bouton **Restaurer** sur la révision cible.

**Exemple d'usage**
> Un rédacteur prépare un article *« Comment demander le RSA quand on est jeune majeur »*. Il remplit titre, slug `rsa-jeune-majeur`, audience `adult`, tags `[RSA, jeunesse]`, écrit 800 mots en MDX et sauvegarde en `draft`. Un `content_reviewer` relit, corrige deux formulations, passe en `scheduled` pour le lundi 9h. Avant publication, il attache un CTA *« Discuter avec ELSAI »*. Lundi à 9h01, l'article est en ligne. Trois semaines plus tard, une info change : on revient à la version `scheduled` via *Revisions* pour repartir d'une base propre.

---

## 8. CTA system

**Accès** : via l'éditeur blog ou API dédiée — **Rôles** : `content_editor`, `super_admin`.

**À quoi ça sert** : placer des invitations à l'action (démarrer une conversation, télécharger un guide, prendre RDV B2B) avec tests A/B pour optimiser les conversions selon l'audience.

### Créer un bloc CTA

Champs :
- **Clé** (identifiant unique).
- **Libellé** (nom interne).
- **Composant** (référence au composant React à afficher).
- **Variante** A/B (`control`, `treatment_a`, `treatment_b`…).
- **Audience** : `all`, `adult`, `minor`.
- **Poids** (0–1000) pour la répartition A/B.
- **Props** : objet JSON passé au composant.

> **Suppression** : réservée au `super_admin` et logique (passage en `active=false`). Un CTA supprimé n'apparaît plus mais reste en base pour traçabilité analytique.

**Exemple d'usage**
> Vous voulez savoir si *« Parler à ELSAI maintenant »* convertit mieux que *« J'ai besoin d'aide »* sur l'audience `minor`. Vous créez deux CTA avec même clé `chat-start`, variantes `control` (poids 500) et `treatment_a` (poids 500), audience `minor`. Après 10 jours, l'onglet *Analytics > CTA* montre 3,2 % CTR sur `control` vs 5,8 % sur `treatment_a`. Vous passez `control` à poids 0 et laissez `treatment_a` en production.

---

## 9. Lead magnets

**Page** : `/admin/leadmagnets` — **Accès** : `content_editor`, `super_admin`.

**À quoi ça sert** : proposer des ressources téléchargeables (PDF, guides, modèles de lettres) en échange d'un email, pour alimenter les séquences d'emailing B2B/B2C.

### Actions

- **Créer** : clé, titre, description, audience, URL du fichier, séquence email à déclencher au téléchargement.
- **Activer / désactiver** via toggle.
- **Modifier** / **Supprimer** (super_admin).

> Un lead magnet inactif n'est plus proposé aux utilisateurs mais les téléchargements historiques restent tracés.

**Exemple d'usage**
> Vous publiez un PDF *« 10 aides sociales méconnues en 2026 »*. Vous créez le lead magnet : clé `aides-2026`, audience `adult`, URL du fichier, séquence déclencheur `b2c_letter`. Quand un utilisateur télécharge le PDF, il reçoit automatiquement l'email 1 de la séquence B2C letter dans la foulée, puis les emails 2–4 selon les délais configurés.

---

## 10. Séquences email

**Page** : `/admin/email-sequences` — **Accès** : `content_editor`, `super_admin`.

**À quoi ça sert** : piloter tous les emails automatiques envoyés aux prospects B2B (collectivités, associations) et aux utilisateurs B2C (particuliers ayant téléchargé un guide ou laissé un email). Vous pouvez modifier un template, l'envoyer en test, suivre la délivrabilité et couper une séquence en urgence.

Couvre 8 séquences : **B2B** (onboarding, renewal, dunning, monthly report) et **B2C** (letter, form, appeal, reminder).

### 10.1 Éditer un template

1. Sélectionner la séquence → l'étape.
2. Modifier : **sujet**, **HTML**, **texte alternatif**, **délai** (en jours/heures), **libellé d'étape**, **notes internes**.
3. Basculer **actif / inactif**.
4. Enregistrer.

### 10.2 Envoyer un test

Bouton **Envoyer un test** → saisir l'email destinataire (généralement le vôtre). L'email est envoyé avec des variables factices.

### 10.3 Historique d'envois

Onglet **Historique** : 200 derniers envois paginés — clé du template, destinataire, statut (delivered/bounced/failed), message Brevo, erreur éventuelle.

### 10.4 Pause / reprise (kill-switch)

Bouton **Mettre en pause** sur la séquence : plus aucun envoi automatique. **Reprendre** pour réactiver.

**Exemple d'usage**
> Un bug dans le template `b2b_dunning_step_2` envoie un email avec un lien cassé. Vous ouvrez la séquence *B2B dunning*, cliquez sur **Pause** pour stopper les envois. Vous corrigez l'URL dans le HTML, envoyez un **test** à votre email, validez que le rendu est correct, puis cliquez **Reprendre**. Dans l'onglet *Historique*, vous vérifiez que les envois reprennent sans erreur Brevo.

> Spécification technique détaillée : voir [docs/email-sequences.md](email-sequences.md).

---

## 11. Analytics

**Page** : `/admin/analytics` — **Accès** : `content_editor`, `super_admin`, `b2b_sales`.

**À quoi ça sert** : mesurer la performance du contenu éditorial et des CTA, et identifier où les utilisateurs décrochent dans le tunnel d'inscription PWA — sans jamais exposer de données personnelles.

Trois onglets :

1. **Articles** — vues Plausible + clics internes, filtre par audience et période (7j / 30j / 90j).
2. **CTA** — performance par variante : impressions, clics, CTR.
3. **Funnel PWA** — signup → remplissage de formulaire → soumission.

> Toutes les données sont anonymes, agrégées, et conformes RGPD.

**Exemple d'usage**
> Dans *Funnel PWA* sur 30 jours, vous voyez : *1 200 signups → 600 remplissages → 90 soumissions*. Le décrochage est entre *remplissage* et *soumission* (15 %). Vous décidez de simplifier le formulaire puis, 30 jours plus tard, vous relevez la soumission à 35 %.

---

## 12. Courriers types

**Page** : `/admin/courriers` — **Accès** : `content_editor`.

**À quoi ça sert** : alimenter la bibliothèque dans laquelle ELSAI puise pour générer des courriers personnalisés aux utilisateurs (CAF, demandes de logement, recours administratifs…).

Actions : créer, modifier, désactiver un modèle.

**Exemple d'usage**
> La procédure de *recours APL* change au 1er juin. Vous éditez le modèle `apl-recours`, ajoutez la nouvelle pièce justificative obligatoire, enregistrez. Dès ce moment, tout utilisateur qui demande à ELSAI *« aide-moi à faire un recours APL »* reçoit un courrier conforme à la nouvelle procédure.

---

## 13. Audit

**Page** : `/admin/audit` — **Accès** : tous les rôles (lecture).

**À quoi ça sert** : garantir la traçabilité et la redevabilité. Chaque action sensible (connexion, modification de prompt, publication, export) est horodatée et associée à son auteur. Utile pour les audits RGPD/sécurité et les enquêtes internes.

Journal **immuable** de toutes les actions admin :
- **Acteur** (email ou `legacy-token`).
- **Action** (ex. `prompt.update`, `alert.status_change`, `blog.publish`, `feature.toggle`).
- **Cible** (type + ID).
- **Horodatage**.
- **Détails** JSON (avant/après pour les mises à jour).

Filtre par action. Affichage par défaut : 200 entrées (jusqu'à 1000).

> Aucun enregistrement ne peut être modifié ou supprimé — y compris par un `super_admin`.

**Exemple d'usage**
> Un prompt a été modifié dimanche soir et l'IA répond bizarrement lundi. Vous filtrez l'audit sur `action=prompt.update`, trouvez l'entrée `dimanche 22:14 — alice@elsai.fr — prompt.update — target=system_adult`. Vous ouvrez les détails JSON, voyez le diff avant/après, et revenez à la version précédente via *Prompts > Historique*.

---

## 14. Droit à l'oubli (RGPD)

**Page** : `/admin/forget` — **Accès** : tous les rôles.

**À quoi ça sert** : démontrer et contrôler la conformité RGPD — prouver qu'une demande a bien été reçue et traitée en cas d'audit CNIL.

Liste des demandes d'effacement reçues depuis l'application.

**Procédure** : l'effacement est **automatique** côté backend ; cette page sert au contrôle/compte-rendu. Aucun re-traitement manuel n'est requis en temps normal.

> Rappel : les sessions ELSAI sont anonymes ; l'effacement concerne les éventuels emails (newsletters, lead magnets) et les profils B2B.

**Exemple d'usage**
> Un utilisateur a écrit *« supprimez toutes mes données »*. Sa demande apparaît dans `/admin/forget` datée du *15/04*. 24h plus tard, le statut passe à `completed`. Si la CNIL interroge, vous pouvez présenter cette entrée comme preuve du traitement.

---

## 15. Exports CSV

**Page** : `/admin/exports` — **Accès** : `b2b_sales`, `content_editor` (métriques) ; `moderator_119` (alertes).

**À quoi ça sert** : extraire des données agrégées pour les présentations investisseurs, les rapports aux partenaires (119, collectivités) ou les analyses dans Excel/Google Sheets.

Deux exports disponibles :

- **Métriques** (`metrics.csv`) : sessions, événements, répartition profil — 100 % anonyme.
- **Alertes** (`alerts.csv`) : `session_id`, statut, extrait — **pas de PII**, uniquement l'ID de session anonyme.

> Les exports sont tracés dans l'audit (actions `export.metrics`, `export.alerts`).

**Exemple d'usage**
> Avant un RDV avec la métropole de Bordeaux, l'équipe B2B exporte `metrics.csv` sur les 90 derniers jours. Elle charge le fichier dans Google Sheets, produit un graphique *sessions / semaine* et un ratio *adulte vs mineur*, puis l'intègre au pitch sans jamais exposer d'identifiant utilisateur.

---

## 16. Gestion des utilisateurs admin

**Page** : `/admin/users` — **Accès** : `super_admin` uniquement.

**À quoi ça sert** : onboarder les nouveaux membres de l'équipe avec le bon niveau d'accès, révoquer les droits quand quelqu'un quitte le projet, et garantir que le cloisonnement des rôles est respecté.

### 16.1 Créer un compte admin

1. **Nouvel utilisateur**.
2. Saisir **email**, choisir un **rôle** (voir §2.3), générer un **mot de passe initial** (à communiquer au nouvel utilisateur par canal sécurisé).
3. Valider.

### 16.2 Modifier un compte

- Changer le rôle.
- Réinitialiser le mot de passe.
- **Désactiver** (suppression logique : `active=false`). L'utilisateur ne peut plus se connecter ; l'historique d'audit est conservé.

### 16.3 Bootstrap initial

Au tout premier démarrage, si aucun admin n'existe, le backend crée automatiquement un compte à partir des variables d'environnement :

- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`

Ce compte est un `super_admin`. Changer le mot de passe dès la première connexion.

**Exemple d'usage**
> Une nouvelle rédactrice, Camille, rejoint l'équipe contenu. Vous créez `camille@elsai.fr` avec le rôle `content_author`, générez un mot de passe aléatoire, et le lui transmettez via 1Password. Elle peut rédiger des brouillons mais ne peut pas publier — c'est le relecteur qui validera. Trois mois plus tard, elle quitte : vous la désactivez en un clic, son historique de contributions reste visible dans l'audit.

---

## 17. Annexes — Glossaire & FAQ

### 17.1 Glossaire

- **Audience** : cible d'un contenu (`adult`, `minor`, `all`).
- **CTA** (Call To Action) : bloc incitant à une action (s'inscrire, télécharger…).
- **Variante A/B** : version alternative d'un CTA ou d'un prompt, servie à une fraction des utilisateurs selon un poids.
- **Feature flag** : interrupteur permettant d'activer/désactiver un module sans redéploiement.
- **Lead magnet** : ressource téléchargeable (PDF, guide) proposée contre un email.
- **MDX** : Markdown enrichi autorisant l'usage de composants React.
- **PII** : *Personally Identifiable Information* — toute donnée permettant d'identifier une personne. Interdite dans les exports.
- **Kill-switch** : bouton de désactivation d'urgence (séquences emails).

### 17.2 FAQ

**Q. J'ai perdu mon mot de passe.**
Contactez un `super_admin`. Il peut vous en générer un nouveau via `/admin/users`.

**Q. Je ne vois pas une page dont on m'a parlé.**
Votre rôle ne l'autorise pas. Consultez le tableau §2.3 puis demandez une montée de droits si nécessaire.

**Q. Comment réactiver une séquence email que j'ai mise en pause ?**
`/admin/email-sequences` → sélectionner la séquence → bouton **Reprendre**.

**Q. Est-ce que je peux supprimer une entrée du journal d'audit ?**
Non. Le journal est immuable par conception, y compris pour les super-admins.

**Q. Un article a été publié par erreur. Comment l'enlever ?**
Passer son statut à `archived` dans `/admin/blog`. Pour restaurer une version antérieure du contenu, utiliser **Revisions**.

**Q. Un export peut-il contenir des données personnelles ?**
Non. Les exports ne contiennent que des IDs de session anonymes et des métriques agrégées. Toute fuite de PII serait un bug à signaler immédiatement.

### 17.3 Références techniques

- [Spécification complète des séquences email](email-sequences.md)
- [Spécification du site vitrine V1](site-vitrine-v1.md)
- [Intégration Stripe](stripe-integration.md)
