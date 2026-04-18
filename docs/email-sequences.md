# Séquences email ELSAI — Design v1

**Version :** 1.0 (design, avant implémentation)
**Date :** 2026-04-18
**Périmètre :** B2B entreprises (4 séquences) + B2C démarches (4 séquences)
**Ton :** vouvoiement, signature « ELSAI »
**Expéditeur :** info@elsai.fr via Brevo

---

## Sommaire

1. [Principes transverses](#principes-transverses)
2. [B2B — Onboarding post-checkout](#b2b1-onboarding-post-checkout)
3. [B2B — Relance avant expiration](#b2b2-relance-avant-expiration)
4. [B2B — Dunning échec paiement](#b2b3-dunning-échec-paiement)
5. [B2B — Rapport d'usage mensuel](#b2b4-rapport-dusage-mensuel)
6. [B2C — Génération d'un courrier](#b2c1-génération-dun-courrier)
7. [B2C — Remplissage d'un formulaire](#b2c2-remplissage-dun-formulaire)
8. [B2C — Suivi de recours / relance](#b2c3-suivi-de-recours--relance)
9. [B2C — Rappel de rendez-vous ou d'échéance](#b2c4-rappel-de-rendez-vous-ou-déchéance)
10. [Récap technique (déclencheurs, templates, modèle DB)](#récap-technique)

---

## Principes transverses

### Règles éditoriales
- **Vouvoiement** systématique
- Signature : **ELSAI** (seule, sobre, pas de « L'équipe »)
- Sujets ≤ 60 caractères, preview ≤ 110
- 1 CTA principal par email, secondaires en lien texte
- Longueur corps : 80-200 mots (300 max pour récap mensuel)
- Pas d'emoji (public sensible, pro, administratif)

### Footer commun (tous les emails)
```
ELSAI — Assistant social numérique
https://www.elsai.fr · info@elsai.fr

[Se désabonner] (hors transactionnels réglementaires)
Vous recevez cet email car vous avez [souscrit à un abonnement ELSAI / créé un compte pour finaliser une démarche].
Vos données sont traitées conformément à notre politique de confidentialité : https://www.elsai.fr/confidentialite
```

### Respect RGPD / éthique
- **Transactionnels** (codes, confirmations de paiement, dunning) : **pas de désinscription** (base légale = exécution du contrat)
- **Notifications de démarche B2C** (suivi, rappels) : **pas de désinscription** non plus (service demandé par l'utilisateur) mais un lien « arrêter les rappels de cette démarche »
- **Marketing / rapport mensuel B2B** : désinscription obligatoire
- Tous : lien vers politique de confidentialité et droit à l'oubli

### Conditions de sortie de séquence
- B2B onboarding : admin résilie son abonnement → arrêt immédiat
- B2B pré-expiration : renouvellement confirmé → arrêt
- Dunning : paiement régularisé → arrêt + email « paiement reçu »
- B2C : démarche clôturée par l'utilisateur OU compte supprimé → arrêt

---

## B2B-1 — Onboarding post-checkout

**Déclencheur :** webhook Stripe `checkout.session.completed` + `customer.subscription.created`
**Cible :** `admin_email` de l'organisation
**Objectif :** garantir que les codes sont distribués, que l'usage démarre, et maximiser la rétention
**Durée :** 30 jours, 5 emails
**Condition de sortie :** résiliation ou passage à l'étape suivante (renouvellement)

### Email 1 — J+0 : Bienvenue + codes (déjà existant dans `render_activation_email`)

- **Send :** immédiat après webhook
- **Subject :** Vos codes d'accès ELSAI — {{company_name}}
- **Preview :** Vos {{seats}} codes sont prêts. Distribuez-les à vos équipes en toute confidentialité.
- **Corps :** (existant — conserver) codes, lien admin, lien portail Stripe
- **CTA principal :** Accéder à l'espace admin
- **Note :** déjà codé dans [email.py:76](../elsai-poc/backend/app/services/email.py) — à harmoniser avec le ton vouvoiement de cette spec (il utilise déjà « vous »)

### Email 2 — J+2 : Comment distribuer les codes à vos équipes

- **Subject :** 3 bonnes pratiques pour déployer ELSAI en interne
- **Preview :** Comment communiquer à vos salariés sans rompre la confidentialité.
- **Corps :**
```
Bonjour,

Deux jours après votre activation, un mot sur la distribution des codes.

ELSAI repose sur un principe simple : aucun salarié ne partage son identité
avec nous. Cela change la manière de communiquer en interne :

1. Envoyez le code par email individuel, pas en canal collectif.
   Un code = un salarié. Pas de liste partagée sur Slack ou Teams.

2. Expliquez le cadre en une phrase : « ELSAI est un assistant social
   anonyme, mis à disposition par l'entreprise. Ce que vous y dites
   reste entre vous et l'IA. »

3. Rappelez que l'usage n'est pas tracé individuellement.
   L'entreprise reçoit uniquement des statistiques globales anonymisées.

Si un salarié perd son code, régénérez-le depuis votre espace admin
(l'ancien est révoqué automatiquement).

ELSAI
```
- **CTA principal :** Voir le modèle d'email à envoyer aux salariés → `{{admin_url}}#communication`
- **CTA secondaire :** Régénérer un code

### Email 3 — J+7 : Vos équipes ont-elles commencé ?

- **Subject :** Premier point d'étape : {{codes_used}}/{{seats}} codes activés
- **Preview :** Un aperçu de l'adoption à une semaine. Rien de nominatif, juste un comptage global.
- **Corps :**
```
Bonjour,

Une semaine depuis votre activation. Voici où vous en êtes :

• Codes distribués activés : {{codes_used}} sur {{seats}}
• Sessions engagées : {{total_sessions}}
• Thèmes les plus abordés : {{top_themes_or_dash}}

Pour rappel, nous ne savons PAS qui a utilisé quoi.
Ces chiffres sont des agrégats anonymes.

Si l'adoption est lente, c'est normal : un assistant social
s'utilise quand le besoin se présente, pas de manière forcée.

Quelques pistes si vous voulez relancer :
- Mentionner ELSAI dans une newsletter interne RH
- L'intégrer à votre programme QVT
- En parler en réunion d'équipe sans en faire un outil « obligatoire »

ELSAI
```
- **CTA principal :** Voir le tableau de bord complet → `{{admin_url}}`
- **Variante si codes_used = 0 :** sujet devient « Vos équipes n'ont pas encore commencé — c'est normal » et le corps supprime les stats, propose uniquement les pistes de relance

### Email 4 — J+14 : Besoin d'aide pour ancrer l'usage ?

- **Subject :** Deux semaines avec ELSAI — parlons-en ?
- **Preview :** 15 min avec notre équipe pour optimiser le déploiement dans votre contexte.
- **Corps :**
```
Bonjour,

Cela fait deux semaines qu'ELSAI est en place chez {{company_name}}.

Si vous hésitez sur la communication interne, sur le rattachement
à la politique QVT, ou simplement sur les cas d'usage à mettre
en avant, nous pouvons échanger 15 minutes.

L'appel est gratuit, sans engagement, et réservé aux abonnés actifs.

Sinon, tout continue automatiquement — pas besoin de nous répondre.

ELSAI
```
- **CTA principal :** Réserver 15 min → lien Calendly / cal.com
- **Variante si codes_used ≥ 70% :** sujet devient « Belle adoption chez {{company_name}} — la suite » et on propose un cas d'usage avancé plutôt qu'un appel

### Email 5 — J+30 : Votre premier rapport mensuel

- **Subject :** Votre rapport d'usage ELSAI — mois 1
- **Preview :** Un récap anonymisé du premier mois d'adoption.
- **Corps :** (cf. [B2B-4](#b2b4-rapport-dusage-mensuel) — même template, marqué « Mois 1 — baseline »)
- **Note :** cet email est le premier de la séquence récurrente B2B-4

---

## B2B-2 — Relance avant expiration

**Déclencheur :** abonnement Stripe dont `current_period_end` approche
**Cible :** `admin_email`
**Objectif :** éviter l'interruption de service par oubli
**Durée :** 14 jours, 2 emails
**Condition de sortie :** Stripe `invoice.paid` pour la nouvelle période → arrêt

### Email 1 — J-14 : Votre abonnement se renouvelle bientôt

- **Subject :** Renouvellement ELSAI le {{renewal_date}}
- **Preview :** Rien à faire si votre moyen de paiement est toujours valide.
- **Corps :**
```
Bonjour,

Votre abonnement ELSAI {{plan_label}} pour {{company_name}} se renouvelle
automatiquement le {{renewal_date}} pour {{amount}}€ TTC.

Vous n'avez rien à faire si :
• votre carte est toujours valide,
• vous souhaitez garder le même plan et le même nombre de sièges.

Sinon, accédez au portail facturation pour :
• mettre à jour votre moyen de paiement,
• changer le nombre de sièges,
• passer à un plan supérieur ou inférieur,
• résilier (effet à la fin de la période en cours).

ELSAI
```
- **CTA principal :** Portail facturation → `{{portal_url}}`

### Email 2 — J-3 : Dernier rappel avant renouvellement

- **Subject :** Renouvellement dans 3 jours — {{company_name}}
- **Preview :** Dernière occasion d'ajuster sièges ou plan avant prélèvement.
- **Corps :** version condensée de l'email 1, avec rappel date + montant
- **CTA :** Portail facturation

---

## B2B-3 — Dunning échec paiement

**Déclencheur :** webhook Stripe `invoice.payment_failed`
**Cible :** `admin_email`
**Objectif :** régulariser le paiement avant coupure de service
**Durée :** 7 jours, 3 emails
**Condition de sortie :** `invoice.paid` → arrêt + email « paiement reçu, service maintenu »

### Email 1 — J+1 : Échec de prélèvement

- **Subject :** Paiement ELSAI non abouti — action requise
- **Preview :** Votre carte a été refusée. Mettez-la à jour en 2 minutes.
- **Corps :**
```
Bonjour,

Le prélèvement de {{amount}}€ pour votre abonnement ELSAI
{{plan_label}} n'a pas abouti.

Raison transmise par votre banque : {{decline_reason_or_generic}}

Votre service ELSAI reste actif pour l'instant.
Il sera suspendu si aucun paiement n'est régularisé sous 7 jours.

Mettez à jour votre moyen de paiement en 2 minutes :
```
- **CTA :** Mettre à jour ma carte → `{{portal_url}}`

### Email 2 — J+4 : Rappel — service suspendu dans 3 jours

- **Subject :** ELSAI : service suspendu dans 3 jours si paiement non régularisé
- **Preview :** Un second essai de prélèvement sera tenté automatiquement.
- **Corps :**
```
Bonjour,

Trois jours se sont écoulés depuis l'échec du prélèvement de votre
abonnement ELSAI. Un second essai sera tenté automatiquement sous 48h.

Si vous souhaitez nous éviter ce nouvel essai, vous pouvez régulariser
dès maintenant depuis le portail facturation.

Sans régularisation, les {{seats}} codes d'accès de vos équipes seront
désactivés le {{suspension_date}}.

ELSAI
```
- **CTA :** Portail facturation

### Email 3 — J+7 : Service suspendu

- **Subject :** Service ELSAI suspendu — réactivation possible
- **Preview :** Vos codes sont désactivés temporairement. La réactivation est immédiate.
- **Corps :**
```
Bonjour,

Faute de régularisation, les codes d'accès ELSAI de {{company_name}}
sont désactivés depuis le {{suspension_date}}.

Vos données (prompts personnalisés, historique admin) sont conservées
pendant 30 jours.

Pour réactiver immédiatement le service, mettez à jour votre moyen
de paiement. Les codes redeviennent actifs dans les minutes qui suivent.

Au-delà de 30 jours, l'abonnement sera définitivement résilié et les
données supprimées conformément à notre politique RGPD.

ELSAI
```
- **CTA :** Réactiver maintenant → `{{portal_url}}`

---

## B2B-4 — Rapport d'usage mensuel

**Déclencheur :** cron mensuel, 1er du mois à 9h
**Cible :** `admin_email` des orgs actives
**Objectif :** démontrer la valeur + rétention
**Durée :** récurrent (pas une séquence)

### Email unique — mensuel

- **Subject :** Votre rapport ELSAI — {{month_label}}
- **Preview :** Les chiffres du mois, 100% anonymisés.
- **Corps :**
```
Bonjour,

Voici le rapport d'usage ELSAI pour {{company_name}} — {{month_label}}.

Engagement
• Codes actifs : {{active_codes}}/{{seats}}
• Sessions engagées : {{sessions_count}}
• Durée moyenne d'échange : {{avg_duration}} minutes
• Nouveaux utilisateurs ce mois : {{new_codes_activated}}

Thèmes principaux abordés (anonyme, agrégé)
{{top_themes_bulleted}}

Démarches concrètes abouties
• Courriers générés : {{letters_generated}}
• Formulaires complétés : {{forms_completed}}
• Orientations vers un professionnel : {{referrals_count}}

Rappel : ces chiffres sont des agrégats. Nous ne pouvons pas
relier un usage à un salarié spécifique.

ELSAI
```
- **CTA principal :** Voir le rapport détaillé → `{{admin_url}}/metrics`
- **CTA secondaire :** Se désabonner de ces rapports → `{{admin_url}}/settings#notifications`
- **Condition :** si `sessions_count < 5`, remplacer le rapport par un email plus court « L'adoption reste faible ce mois-ci — voici pourquoi c'est normal / voici comment relancer »

---

## B2C-1 — Génération d'un courrier

**Déclencheur :** l'utilisateur accepte la proposition d'ELSAI de générer un courrier et crée un compte
**Cible :** email vérifié lors de la création de compte
**Objectif :** accompagner la démarche de bout en bout (envoi → réponse → recours si besoin)
**Durée :** variable, jusqu'à 30 jours après génération

### Email 1 — J+0 : Confirmation de compte + courrier prêt

- **Subject :** Votre courrier est prêt — {{recipient_org}}
- **Preview :** Téléchargez-le, envoyez-le, et gardez la trace d'envoi.
- **Corps :**
```
Bonjour,

Votre compte ELSAI est créé. Voici votre courrier destiné à
{{recipient_org}}, objet : {{subject}}.

[Bouton : Télécharger le courrier PDF]

Conseils d'envoi :
• Envoyez en recommandé avec accusé de réception si la démarche
  est importante (recours, contestation, demande officielle).
• Conservez l'AR : il fait preuve de la date d'envoi.
• Une fois envoyé, revenez sur votre espace ELSAI pour indiquer
  la date d'envoi. Nous pourrons alors vous rappeler si aucune
  réponse n'arrive dans les délais légaux.

Vous pouvez à tout moment supprimer votre compte et toutes vos
données depuis votre espace.

ELSAI
```
- **CTA principal :** Télécharger le courrier
- **CTA secondaire :** Accéder à mon espace

### Email 2 — J+3 : Avez-vous envoyé le courrier ?

- **Subject :** Courrier pour {{recipient_org}} : envoyé ?
- **Preview :** Indiquez la date d'envoi pour activer le suivi automatique.
- **Corps :**
```
Bonjour,

Trois jours depuis la génération de votre courrier pour {{recipient_org}}.

Si vous l'avez envoyé, indiquez la date d'envoi depuis votre espace.
Cela nous permet de :
• calculer le délai de réponse légal qui s'applique,
• vous alerter si ce délai est dépassé sans réponse,
• vous proposer une relance ou un recours le cas échéant.

Si vous ne l'avez pas encore envoyé, pas de pression — vous pouvez
revenir quand vous êtes prêt.

ELSAI
```
- **CTA :** Indiquer la date d'envoi

### Email 3 — J+{{legal_delay}} : Délai de réponse atteint

- **Subject :** Pas de réponse de {{recipient_org}} ? Voici les options
- **Preview :** Le délai légal de réponse est aujourd'hui atteint.
- **Corps :**
```
Bonjour,

Vous avez envoyé votre courrier à {{recipient_org}} le {{sent_date}}.
Le délai légal de réponse de {{legal_delay_days}} jours est atteint
aujourd'hui.

Si vous avez reçu une réponse (même partielle) : indiquez-le pour
clôturer le suivi.

Si aucune réponse n'est arrivée, plusieurs options s'offrent à vous :
• Relance simple (souvent suffisante — modèle disponible en un clic)
• Recours gracieux auprès de {{recipient_org}}
• Recours hiérarchique ou médiateur selon la nature du dossier

Revenez échanger avec ELSAI pour décider de la meilleure suite.

ELSAI
```
- **CTA principal :** Générer une relance
- **CTA secondaire :** J'ai reçu une réponse

### Email 4 — J+30 : Clôture ou recours ?

- **Subject :** Où en est votre démarche {{recipient_org}} ?
- **Preview :** Dernier point d'étape avant archivage automatique.
- **Corps :** check-in court + 3 options (résolu / en attente / bloqué → recours)
- **CTA :** Mettre à jour le statut

---

## B2C-2 — Remplissage d'un formulaire

**Déclencheur :** utilisateur accepte la délégation du remplissage d'un formulaire (RSA, APL, MDPH, etc.)
**Cible :** email du compte créé
**Objectif :** garantir que le formulaire est bien transmis et suivi
**Durée :** 14 jours, 3 emails

### Email 1 — J+0 : Formulaire prêt à être transmis

- **Subject :** Formulaire {{form_type}} — prêt pour transmission
- **Preview :** Vérifiez, signez et transmettez selon la procédure indiquée.
- **Corps :**
```
Bonjour,

Votre formulaire {{form_type}} destiné à {{target_organism}} est
complété sur la base des éléments que vous m'avez confiés.

[Bouton : Télécharger le formulaire pré-rempli]

Avant de transmettre :
1. Relisez chaque champ attentivement — vous restez responsable
   des informations déclarées.
2. Signez à la main les emplacements prévus (hors signature
   électronique valide).
3. Joignez les pièces justificatives listées page {{doc_page}}.
4. Transmettez selon la voie indiquée par {{target_organism}}
   (en ligne / courrier / guichet).

ELSAI
```
- **CTA :** Télécharger le formulaire

### Email 2 — J+5 : Accusé de réception reçu ?

- **Subject :** Dossier {{form_type}} : transmis et accusé reçu ?
- **Preview :** Conserver l'AR est crucial pour la suite.
- **Corps :** rappel importance AR, comment le numéroter/classer, demande de saisie de la date de transmission
- **CTA :** Indiquer la date de transmission

### Email 3 — J+14 : Suivi d'instruction

- **Subject :** Instruction {{form_type}} — point d'étape
- **Preview :** Délai moyen d'instruction et ce que vous pouvez faire d'ici là.
- **Corps :** rappel délai moyen d'instruction pour ce type de dossier, vigilance aux demandes de pièces complémentaires, comment réagir, quand relancer
- **CTA :** Voir mon espace démarche

---

## B2C-3 — Suivi de recours / relance

**Déclencheur :** utilisateur lance un recours depuis son espace (après délai légal dépassé ou réponse défavorable)
**Cible :** email du compte
**Objectif :** cadencer le suivi du recours et alerter sur les délais contentieux
**Durée :** 60 jours, 3 emails

### Email 1 — J+0 : Recours engagé

- **Subject :** Recours {{recipient_org}} — engagé
- **Preview :** Les délais contentieux démarrent aujourd'hui.
- **Corps :** confirmation + rappel nature du recours (gracieux / hiérarchique / contentieux) + délais applicables + importance de conserver tous les échanges
- **CTA :** Voir le dossier

### Email 2 — J+30 : Point d'étape mi-parcours

- **Subject :** Recours {{recipient_org}} — 30 jours
- **Preview :** Une réponse attendue sous {{days_remaining}} jours.
- **Corps :** rappel délai restant + que faire si pas de réponse (décision implicite de rejet / passage à l'étape contentieuse)
- **CTA :** Mettre à jour le dossier

### Email 3 — J+{{contentieux_delay}} : Échéance contentieuse

- **Subject :** Action à décider avant le {{deadline_date}}
- **Preview :** Après cette date, certaines voies de recours seront fermées.
- **Corps :** alerte délai contentieux (typiquement 2 mois), 3 options (accepter la décision, saisir le tribunal administratif, consulter un avocat/défenseur des droits)
- **CTA principal :** En discuter avec ELSAI

---

## B2C-4 — Rappel de rendez-vous ou d'échéance

**Déclencheur :** utilisateur enregistre une date clé dans son espace (audience, renouvellement titre de séjour, convocation…)
**Cible :** email du compte
**Objectif :** éviter qu'une échéance critique passe inaperçue
**Durée :** jusqu'à J-0 de l'événement

### Cadencement
- J-30 : premier rappel (si date > 30 jours)
- J-7 : rappel + checklist de préparation
- J-1 : rappel final avec récap logistique

### Email type — J-7 (le plus important)

- **Subject :** {{event_type}} dans 7 jours — préparation
- **Preview :** Checklist rapide pour arriver serein(e).
- **Corps :**
```
Bonjour,

{{event_type}} le {{event_date}} à {{event_location}}.

Sept jours pour vous préparer. Checklist générique (adaptez-la
à votre cas) :

• Documents à apporter : {{required_docs_or_dash}}
• Heure de convocation : {{event_time}}
• Lieu exact et accès : {{event_location_details}}
• Justificatif d'identité : pièce d'identité valide

Si vous avez le moindre doute sur un document manquant ou sur ce
qui sera attendu de vous, revenez échanger avec moi — je peux
vous aider à préparer ce que vous direz et à anticiper les
questions difficiles.

ELSAI
```
- **CTA principal :** Préparer {{event_type}} avec ELSAI
- **CTA secondaire :** Modifier / annuler ce rappel

### Emails J-30 et J-1
- J-30 : version courte, juste « l'échéance approche, préparez vos pièces »
- J-1 : version courte, « demain, {{event_time}} à {{event_location}}. Courage. »

---

## Récap technique

### Déclencheurs par séquence

| Séquence | Trigger | Source |
|---|---|---|
| B2B-1 Onboarding | `checkout.session.completed` | Webhook Stripe |
| B2B-2 Pré-expiration | `current_period_end - 14d`, `- 3d` | Cron quotidien |
| B2B-3 Dunning | `invoice.payment_failed` | Webhook Stripe |
| B2B-4 Rapport mensuel | 1er du mois 9h | Cron mensuel |
| B2C-1 Courrier | `LetterGenerated` event | App interne |
| B2C-2 Formulaire | `FormDelegated` event | App interne |
| B2C-3 Recours | `AppealStarted` event | App interne |
| B2C-4 Rappel | date enregistrée par user | Cron quotidien |

### Variables de template à implémenter

```
# B2B
{{company_name}} {{plan_label}} {{seats}} {{amount}}
{{admin_url}} {{portal_url}} {{renewal_date}} {{suspension_date}}
{{codes_used}} {{active_codes}} {{sessions_count}} {{avg_duration}}
{{new_codes_activated}} {{top_themes_bulleted}} {{letters_generated}}
{{forms_completed}} {{referrals_count}} {{month_label}}
{{decline_reason_or_generic}}

# B2C
{{recipient_org}} {{subject}} {{sent_date}} {{legal_delay_days}}
{{form_type}} {{target_organism}} {{doc_page}}
{{event_type}} {{event_date}} {{event_time}} {{event_location}}
{{event_location_details}} {{required_docs_or_dash}}
{{deadline_date}} {{days_remaining}}
```

### Modèle DB minimal (phase 2)

```python
class EmailTemplate(Base):
    id: UUID
    key: str  # ex: "b2b_onboarding_j7", "b2c_letter_j3"
    subject: str
    html: str
    text: str
    updated_at: datetime

class ScheduledEmail(Base):
    id: UUID
    template_key: str
    recipient_email: str
    recipient_context: JSON  # variables de rendu
    send_at: datetime
    sent_at: datetime | None
    status: enum("pending", "sent", "cancelled", "failed")
    cancel_reason: str | None

class EmailEvent(Base):
    """Trace de ce qui a été envoyé, pour ne pas doublonner."""
    id: UUID
    subject_id: str  # org_id ou user_id
    sequence_key: str  # ex: "b2b_onboarding"
    step: int
    sent_at: datetime
```

### Scheduler (phase 2)

```python
# backend/app/services/email_scheduler.py
# APScheduler : job toutes les 5 min
# SELECT * FROM scheduled_email WHERE send_at <= now() AND status='pending'
# → rend le template → send_email() → status='sent'
```

### Admin UI (phase 3)

Page `/admin/email-sequences` :
- Liste des 8 séquences avec statut (active/pause) et stats envoi 30 derniers jours
- Par séquence : liste des étapes, édition inline (sujet / html / délai), bouton « test send » à une adresse de l'admin, historique des 100 derniers envois
- Bouton global « Pauser toutes les séquences » (kill-switch sécurité)

---

## Prochaines étapes

1. **Validation** de ce document par le product owner
2. **Implémentation** phase 2 (DB + scheduler + triggers webhook/event) — 2-3 jours
3. **Admin UI** phase 3 — 1-2 jours
4. **Tests d'envoi réel** sur compte Brevo dev avant bascule prod

**Statut actuel :** design validé, implémentation non démarrée. Brevo prod testé et opérationnel ([validé 2026-04-18](../elsai-poc/backend/app/services/email.py)).
