# Plan d'intégration Stripe — ELSAI B2B

## 1. Choix produit Stripe

| Brique Stripe | Usage ELSAI |
|---|---|
| **Stripe Billing** | Abonnements mensuels par siège (seats) — cœur du modèle |
| **Stripe Checkout** (hosted) | Parcours souscription Essentiel/Premium — rapide, PCI-compliant, pas de formulaire custom |
| **Customer Portal** | Self-service entreprise : factures, changement CB, upgrade, résiliation |
| **Stripe Tax** | TVA FR/UE automatique — obligatoire B2B |
| **Webhooks** | Synchro statut abonnement ↔ codes d'accès ELSAI |

**Non utilisé** : Payment Links seuls (insuffisant pour seats), Connect (pas de marketplace).

## 2. Modélisation tarifaire dans Stripe

```
Product "ELSAI Essentiel"
  └── Price : 3 €/siège/mois · licensed · recurring · EUR
Product "ELSAI Premium"
  └── Price : 5 €/siège/mois · licensed · recurring
Product "ELSAI Sur mesure"
  └── pas de Price public — créé manuellement par devis (metadata contract_id)
```

Type de seat : **licensed** (quantité fixée à la souscription, pas metered). Plus simple, plus prévisible pour le client, aligné sur le doc (80 salariés = 80 sièges).

**Engagement 12 mois** (doc) → à gérer côté CGV + logique de résiliation, pas nativement dans Stripe. Options :

- **Option A** : abonnement mensuel + clause engagement CGV (souple, risque d'impayés)
- **Option B** : paiement annuel par facture (recommandé pour Essentiel/Premium B2B — cash-flow meilleur)
- **Option C** : acompte initial = 2 mois via `setup_fee`

**Recommandation** : proposer mensuel ET annuel (remise 10% annuel), client choisit au checkout.

## 3. Parcours d'achat

```
/offre → "Choisir Essentiel" → /offre/checkout?plan=essentiel
                                    ↓
                         Formulaire court (nb salariés, raison sociale,
                         SIRET, email admin) stocké côté ELSAI
                                    ↓
                     Stripe Checkout (CB ou SEPA virement B2B)
                                    ↓
                         Webhook checkout.session.completed
                                    ↓
                    Création compte entreprise + génération N codes
                                    ↓
                         Email admin : codes + lien portail
```

**Sur mesure** : pas de Stripe en self-service → formulaire `/contact?type=devis` → facturation manuelle via Stripe Invoicing (ou SEPA hors Stripe).

## 4. Architecture technique

| Composant | Rôle |
|---|---|
| `POST /api/billing/checkout` | Crée Customer + CheckoutSession Stripe |
| `POST /api/billing/webhook` | Écoute `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated/deleted` |
| `GET /api/billing/portal` | Génère URL Customer Portal |
| Table `organizations` | `id, stripe_customer_id, stripe_subscription_id, plan, seats, status` |
| Table `access_codes` | `code, organization_id, assigned_at, revoked_at` |

**Souveraineté** : Stripe = US (Dublin pour EU). À mentionner dans `/confidentialite`. Aucune donnée santé/sociale ne transite par Stripe — uniquement facturation.

## 5. Impact sur la page /offre

- Toggle **Mensuel / Annuel (-10%)** au-dessus de la grille tarifaire
- Calculateur : « Combien de salariés ? » → affiche prix mensuel estimé
- Bouton **Souscrire** sur Essentiel/Premium → Checkout Stripe
- Bouton **Demander un devis** sur Sur mesure → formulaire

## 6. Points marketing critiques

- **Pas de TVA surprise** : afficher « HT » clairement, mention « TVA 20% en sus » visible avant checkout
- **Mode de paiement B2B** : activer **SEPA Direct Debit** dans Stripe (les DAF préfèrent souvent au CB)
- **Facture PDF** automatique envoyée par Stripe (logo ELSAI, mentions ESUS)
- **Essai gratuit ?** Non recommandé (service sérieux, pas SaaS grand public). Plutôt une phase pilote payante 3 mois négociée manuellement.
- **Annulation** : Customer Portal permet résiliation self-service → attention engagement 12 mois (CGV doivent prévoir facturation du solde)

## 7. Checklist juridique / compta

- [ ] Compte Stripe sous la SAS (SIRET actif requis)
- [ ] CGV B2B avec clause engagement 12 mois + clause résiliation
- [ ] Mention Stripe dans politique de confidentialité (sous-traitant US/IE)
- [ ] Stripe Tax activé, numéro de TVA intracom renseigné
- [ ] Export mensuel Stripe → comptable (ou intégration Pennylane/Qonto)

## 8. Priorités

| Sprint | Livrable |
|---|---|
| **S1** | Setup Stripe (products/prices), webhooks, tables DB |
| **S2** | Checkout + génération codes + email admin |
| **S2** | Customer Portal + page gestion sièges |
| **S3** | SEPA + facturation annuelle + Stripe Tax |
| **S4** | Dunning (relances impayés) + reporting |
