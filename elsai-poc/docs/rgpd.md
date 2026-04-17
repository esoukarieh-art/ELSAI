# Conformité RGPD — ELSAI PoC

Ce document décrit les mesures techniques et organisationnelles qui garantissent
le respect du RGPD et de la Loi Informatique et Libertés pour le PoC ELSAI.

## 1. Principes directeurs

| Principe RGPD | Mise en œuvre ELSAI |
|---|---|
| **Minimisation** (art. 5.1.c) | Aucun nom, email, téléphone, adresse IP ou user-agent stocké. Profil = `adult`/`minor` uniquement. |
| **Limitation de conservation** (art. 5.1.e) | Session inactive purgée après `SESSION_RETENTION_HOURS` (défaut : 24h). Oubli immédiat sur demande. |
| **Intégrité / confidentialité** (art. 5.1.f) | HTTPS obligatoire en prod, JWT signé, sessions isolées par `session_id`, CORS restrictif. |
| **Transparence** (art. 12-13) | Page `/confidentialite` publique. Endpoint `GET /api/auth/privacy` pour le droit d'accès. |
| **Droit à l'oubli** (art. 17) | `DELETE /api/auth/forget` : cascade SQL garantit la suppression effective (testée). |
| **Responsabilité** (art. 24) | Logs JSON structurés `privacy.forget_executed`, `safety.danger_detected` horodatés avec correlation ID — **sans contenu utilisateur**. |

## 2. Registre des traitements (art. 30)

| Traitement | Finalité | Base légale | Données | Destinataires | Durée |
|---|---|---|---|---|---|
| Conversation anonyme | Assistance sociale | Intérêt légitime (art. 6.1.f) — tâche d'intérêt général | Profil, messages, flags danger | Serveur ELSAI uniquement | 24h inactivité ou oubli immédiat |
| Détection danger → CTA 119/3114 | Protection des personnes | Obligation légale (art. 6.1.c) — signalement non-contraignant | Flag + signaux heuristiques + CTA routé | Logs d'audit serveur | 30 jours (à configurer) |
| Métriques dashboard | Pilotage PoC | Intérêt légitime | Compteurs anonymes agrégés (`MetricEvent`) | Équipe ELSAI (admin token) | Durée du PoC |

## 3. Cartographie des données

```
Session (anonyme)
├─ id (UUID)
├─ profile: adult | minor
├─ created_at, last_activity
└─ conversations
   └─ messages
      ├─ role: user | assistant
      ├─ content: texte brut                 ← SEULE DONNÉE SENSIBLE
      └─ danger_flag: bool
```

Aucune PII directe : pas de nom, pas d'email, pas d'IP persistée, pas de cookie tiers.
Le contenu des messages peut toutefois contenir des données sensibles au sens de
l'art. 9 RGPD (santé, vie sexuelle, orientation, convictions). Traité en conséquence :
chiffrement au repos (à activer en prod), pas d'analytics, pas de LLM tiers sans
accord de sous-traitance (DPA).

## 4. Exercice des droits

| Droit RGPD | Endpoint / UI | Tests automatisés |
|---|---|---|
| Accès (art. 15) | `GET /api/auth/privacy` (compteurs, jamais le contenu) | `test_privacy.py::test_privacy_endpoint_returns_counters_not_content` |
| Rectification (art. 16) | Non applicable (conversation anonyme, aucune donnée à corriger) | — |
| Effacement (art. 17) | `DELETE /api/auth/forget` + bouton UI "Tout oublier" | `test_privacy.py::test_forget_purges_message_content_at_sql_level` |
| Limitation (art. 18) | Arrêter la session suffit (pas de re-traitement possible) | — |
| Portabilité (art. 20) | Non applicable (pas de consentement requis, intérêt légitime) | — |
| Opposition (art. 21) | Fermer l'onglet = fin du traitement | — |

## 5. Mineurs (art. 8 + loi 2018-493)

ELSAI est accessible aux mineurs 12-18 ans **sans consentement parental** en
s'appuyant sur l'intérêt légitime (tâche d'intérêt général) et la doctrine
CNIL sur les lignes d'écoute anonymes (cf. 119). L'anonymat est la garantie
centrale :

- Aucune identification directe ou indirecte demandée.
- Prompt `system_minor` calibré pour ne pas collecter de données permettant
  d'identifier (nom, adresse, école).
- Détection danger → CTA 119 (Allô Enfance en Danger) systématique.
- Bouton "Tout oublier" visible en permanence.

**DPIA recommandée** avant mise en production publique pour mineurs, compte
tenu du caractère sensible du traitement.

## 6. Audit — logs conservés

| Event | Champs loggés | Jamais loggé |
|---|---|---|
| `safety.danger_detected` | profile, conversation_id, heuristic_signals, llm_flag, cta_phone, correlation_id | Contenu du message |
| `privacy.forget_executed` | session_id, profile, deleted_counts, correlation_id | Contenu supprimé |
| `llm_unavailable` | profile, conversation_id, error | — |

Tests canary : `test_observability.py::test_danger_log_contains_no_user_content`
et `test_privacy.py::test_forget_logs_anonymous_audit_trail`.

## 7. Sous-traitants

| Sous-traitant | Rôle | Localisation | DPA requis |
|---|---|---|---|
| Anthropic (Claude) | LLM conversationnel | US | **Oui** — Data Processing Addendum |
| OpenAI (Whisper + TTS) | Transcription + synthèse vocale (optionnel) | US | **Oui** — DPA + analyse transfert hors UE (TIA) |
| Hébergeur | À définir | Prévoir UE ou souverain | Contrat de sous-traitance art. 28 |

Recommandation production : **privilégier LLM souverain français/UE** pour
éliminer les transferts hors UE. Alternatives : Mistral (France), privé.

## 8. Checklist pré-production

- [ ] DPIA réalisée (obligatoire pour traitement de données sensibles de mineurs)
- [ ] DPA signés avec Anthropic et OpenAI (ou migration souverain)
- [ ] Registre des traitements ajouté au registre interne du responsable
- [ ] Chiffrement au repos activé (SQLite → Postgres chiffré)
- [ ] Politique de confidentialité publiée et accessible
- [ ] DPO désigné et contact publié (`privacy@elsai.fr`)
- [ ] Backup testé ET **backup inclus dans la purge forget** (sinon viol art. 17)
- [ ] Audit RGPD externe par prestataire certifié

## 9. Incident de sécurité (art. 33-34)

En cas de fuite :
1. Notification CNIL < 72h via [notifications.cnil.fr](https://notifications.cnil.fr)
2. Information des personnes concernées si risque élevé
3. Traçabilité via logs JSON horodatés (correlation_id)

## 10. Lancer les vérifications

```bash
cd elsai-poc/backend
pytest tests/test_privacy.py -v
pytest tests/test_observability.py -v
```
