# Documentation API — ELSAI POC

Base URL locale : `http://localhost:8000`
Documentation interactive (Swagger) : `http://localhost:8000/docs`
Schéma OpenAPI brut : `http://localhost:8000/openapi.json`

## Authentification

Toutes les routes (sauf `POST /api/auth/session` et `/api/health`)
requièrent un header :

```
Authorization: Bearer <token>
```

Le token est un JWT opaque délivré par `POST /api/auth/session`.
Il n'encode **aucun PII** : uniquement l'ID de session (UUID) et l'exp.

## Corrélation / audit

Toutes les requêtes émettent un header `X-Correlation-Id` (généré si absent,
echo si fourni par le client). Il est propagé dans les logs JSON côté serveur
pour faciliter le debug et l'audit RGPD. Aucun contenu utilisateur n'apparaît
dans les logs — uniquement profil, flags, compteurs et IDs.

## Endpoints

### `GET /api/health`

Sonde de santé — non authentifiée.

**Réponse 200**
```json
{ "status": "ok", "llm_configured": true }
```

---

### `POST /api/auth/session`

Crée une session anonyme.

**Body**
```json
{ "profile": "adult" }     // ou "minor"
```

**Réponse 200**
```json
{
  "session_id": "a1b2c3...",
  "token": "eyJhbGc...",
  "profile": "adult",
  "expires_in": 86400
}
```

---

### `DELETE /api/auth/forget`

Droit à l'oubli (RGPD art. 17) : supprime toutes les conversations et messages
liés à la session courante. La session elle-même reste valide jusqu'à expiration
du token, mais ne contient plus aucune donnée utilisateur. Un event d'audit
anonyme `privacy.forget_executed` est loggé en JSON.

**Réponse 200**
```json
{ "deleted_conversations": 3, "deleted_messages": 42 }
```

---

### `GET /api/auth/privacy`

Droit d'accès (RGPD art. 15) : renvoie les **compteurs** et catégories de
données stockées sur la session courante. **Jamais le contenu** des messages.

**Réponse 200**
```json
{
  "exists": true,
  "session_id": "a1b2c3...",
  "profile": "adult",
  "created_at": "2026-04-17T10:15:00+00:00",
  "last_activity": "2026-04-17T10:42:00+00:00",
  "conversation_count": 2,
  "message_count": 8,
  "data_categories_stored": [
    "profil (adult/minor)",
    "messages échangés (contenu + horodatage)",
    "indicateurs danger détectés"
  ],
  "retention_policy": "Purge automatique après inactivité ; oubli immédiat sur demande"
}
```

---

### `POST /api/chat`

Envoie un message au parcours conversationnel.

**Body**
```json
{
  "message": "Je ne sais pas comment remplir ma demande de RSA",
  "conversation_id": null    // null = nouvelle conversation
}
```

**Réponse 200**
```json
{
  "conversation_id": "f0e1d2...",
  "reply": "Je comprends, on va regarder ça ensemble...",
  "danger_detected": false,
  "emergency_cta": null
}
```

Si `danger_detected` est `true`, `emergency_cta` contient :
```json
{ "label": "Appeler le 119 (gratuit, 24h/24)", "phone": "119" }
```

**Erreurs**
- `404` — `conversation_id` fourni mais introuvable pour cette session
- `503` — clé API Anthropic non configurée

---

### `POST /api/documents/analyze`

Upload d'une image de document administratif → OCR + explication.

**Body** : `multipart/form-data` avec champ `file`

- Types acceptés : `image/png`, `image/jpeg`, `image/webp`
- Taille max : 10 MB
- Le binaire **n'est pas stocké** côté serveur

**Réponse 200**
```json
{
  "ocr_text": "CAF — Avis de paiement du ...",
  "explanation": "Ce document est un avis de la CAF qui...",
  "suggested_actions": [
    "Vérifier que le montant correspond à votre relevé bancaire",
    "Conserver ce document 2 ans"
  ]
}
```

**Erreurs**
- `400` — image illisible par Tesseract
- `413` — fichier > 10 MB
- `415` — type MIME non supporté
- `422` — aucun texte détecté
- `503` — Tesseract ou Claude indisponible

---

### `GET /api/dashboard/metrics`

Métriques agrégées et anonymes. **Accès restreint** : header
`X-Admin-Token: <token>` obligatoire, valeur comparée à la variable
d'environnement `ADMIN_TOKEN` côté serveur.

**Réponses d'erreur**
- `401` — token invalide ou manquant
- `503` — `ADMIN_TOKEN` non configuré côté serveur (dashboard désactivé)

**Réponse 200**
```json
{
  "total_sessions": 128,
  "active_last_hour": 7,
  "chats_total": 540,
  "ocr_total": 34,
  "danger_detections_total": 2,
  "forget_requests_total": 3,
  "profile_breakdown": { "adult": 100, "minor": 28 }
}
```

Aucune donnée personnelle n'est exposée.

## Codes d'erreur communs

| Code | Signification |
|------|---------------|
| 401 | Token manquant, invalide ou expiré |
| 404 | Ressource introuvable pour cette session |
| 413 | Payload trop volumineux |
| 415 | Content-Type non supporté |
| 422 | Validation Pydantic échouée |
| 503 | Dépendance externe indisponible (Claude/Tesseract) |

## Exemple d'utilisation (curl)

```bash
# 1. Créer une session
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/session \
  -H "Content-Type: application/json" \
  -d '{"profile":"adult"}' | jq -r .token)

# 2. Envoyer un message
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Bonjour"}'

# 3. Exercer son droit à l'oubli
curl -X DELETE http://localhost:8000/api/auth/forget \
  -H "Authorization: Bearer $TOKEN"
```
