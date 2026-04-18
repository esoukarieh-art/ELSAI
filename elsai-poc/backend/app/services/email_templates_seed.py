"""Seed des templates d'email pour les 8 séquences ELSAI (v1).

Source de vérité : docs/email-sequences.md

Comportement :
- Insère les templates manquants en base (sans écraser ceux qu'un admin a déjà édités).
- Les templates B2C sont seedés avec active=False en attendant l'infra "compte B2C".

Un admin peut éditer sujet/preview/html/texte/delay/active via l'UI admin
(phase 3). Les modifications ne sont pas réécrasées par un re-seed.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import EmailTemplate

# --- Helpers de rendu HTML ---------------------------------------------------

_FOOTER_HTML = """
<hr style="border:none;border-top:1px solid #e6e3d8;margin:28px 0 14px 0;">
<p style="font-size:12px;color:#777;line-height:1.5;">
ELSAI — Assistant social numérique<br>
<a href="https://www.elsai.fr" style="color:#5A7E6B;text-decoration:none;">www.elsai.fr</a>
· info@elsai.fr<br>
Vos données sont traitées conformément à notre
<a href="https://www.elsai.fr/confidentialite" style="color:#5A7E6B;">politique de confidentialité</a>.
</p>
""".strip()

_FOOTER_TEXT = (
    "\n\n—\nELSAI — Assistant social numérique\n"
    "https://www.elsai.fr · info@elsai.fr\n"
    "Confidentialité : https://www.elsai.fr/confidentialite\n"
)


def _wrap(body_html: str) -> str:
    """Enveloppe HTML commune (charte ELSAI : vert pin, vieux rose, crème)."""
    return f"""<!doctype html>
<html lang="fr"><body style="background:#F5F5ED;margin:0;padding:24px;font-family:Inter,Arial,sans-serif;color:#2a2a2a;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:28px;border-radius:12px;">
{body_html}
{_FOOTER_HTML}
  </div>
</body></html>"""


def _button(label: str, href_placeholder: str) -> str:
    return (
        f'<p style="margin:20px 0;"><a href="{href_placeholder}" '
        f'style="display:inline-block;background:#5A7E6B;color:#F5F5ED;'
        f'padding:10px 20px;border-radius:10px;text-decoration:none;'
        f'font-weight:600;">{label}</a></p>'
    )


# --- Définition des 22 templates des 8 séquences -----------------------------

# Chaque dict correspond à un EmailTemplate.
# delay_hours : relatif au trigger de la séquence. Valeurs négatives = avant échéance.

_B2B_ONBOARDING = "B2B — Onboarding post-checkout"
_B2B_PRE_EXPIRY = "B2B — Relance avant expiration"
_B2B_DUNNING = "B2B — Dunning échec paiement"
_B2B_MONTHLY = "B2B — Rapport d'usage mensuel"
_B2C_LETTER = "B2C — Génération d'un courrier"
_B2C_FORM = "B2C — Remplissage d'un formulaire"
_B2C_APPEAL = "B2C — Suivi de recours"
_B2C_REMINDER = "B2C — Rappel d'échéance"


SEED_TEMPLATES: list[dict] = [
    # --- B2B-1 Onboarding ---------------------------------------------------
    {
        "key": "b2b_onboarding_j0_activation",
        "sequence_key": "b2b_onboarding",
        "sequence_label": _B2B_ONBOARDING,
        "audience": "b2b",
        "step_order": 1,
        "step_label": "J+0 — Bienvenue + codes",
        "delay_hours": 0,
        "subject": "Vos codes d'accès ELSAI — {{company_name}}",
        "preview": "Vos {{seats}} codes sont prêts. Distribuez-les à vos équipes en toute confidentialité.",
        "html_content": _wrap(
            '<h1 style="font-family:Georgia,serif;color:#5A7E6B;margin-top:0;">Bienvenue chez ELSAI</h1>'
            "<p>Bonjour,</p>"
            "<p>Votre abonnement <strong>{{plan_label}}</strong> pour <strong>{{company_name}}</strong> "
            "({{seats}} salariés) est actif. Voici les {{seats}} codes d'accès à distribuer à vos équipes :</p>"
            '<table style="margin:16px 0;">{{codes_html}}</table>'
            "<p>Chaque salarié utilise son code sur "
            '<a href="https://www.elsai.fr/start" style="color:#5A7E6B;">www.elsai.fr/start</a> '
            "— aucune donnée nominative n'est collectée.</p>"
            + _button("Accéder à l'espace admin ELSAI", "{{admin_url}}")
            + "<p>{{portal_block_html}}</p>"
            '<p style="font-size:13px;color:#666;">Cet email contient des codes confidentiels, merci de le traiter avec précaution.</p>'
        ),
        "text_content": (
            "Bienvenue chez ELSAI\n\n"
            "Votre abonnement {{plan_label}} pour {{company_name}} ({{seats}} salariés) est actif.\n"
            "Codes d'accès ({{seats}}) :\n{{codes_text}}\n\n"
            "Espace admin : {{admin_url}}\n{{portal_block_text}}"
        ) + _FOOTER_TEXT,
        "active": True,
        "notes": "Remplace render_activation_email() existant dans email.py.",
    },
    {
        "key": "b2b_onboarding_j2_distribution",
        "sequence_key": "b2b_onboarding",
        "sequence_label": _B2B_ONBOARDING,
        "audience": "b2b",
        "step_order": 2,
        "step_label": "J+2 — Comment distribuer les codes",
        "delay_hours": 48,
        "subject": "3 bonnes pratiques pour déployer ELSAI en interne",
        "preview": "Comment communiquer à vos salariés sans rompre la confidentialité.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Deux jours après votre activation, un mot sur la distribution des codes.</p>"
            "<p>ELSAI repose sur un principe simple : aucun salarié ne partage son identité avec nous. "
            "Cela change la manière de communiquer en interne :</p>"
            '<ol style="line-height:1.7;">'
            "<li><strong>Envoyez le code par email individuel</strong>, pas en canal collectif. "
            "Un code = un salarié. Pas de liste partagée sur Slack ou Teams.</li>"
            "<li><strong>Expliquez le cadre en une phrase</strong> : « ELSAI est un assistant social anonyme, "
            "mis à disposition par l'entreprise. Ce que vous y dites reste entre vous et l'IA. »</li>"
            "<li><strong>Rappelez que l'usage n'est pas tracé individuellement</strong>. "
            "L'entreprise reçoit uniquement des statistiques globales anonymisées.</li>"
            "</ol>"
            "<p>Si un salarié perd son code, régénérez-le depuis votre espace admin "
            "(l'ancien est révoqué automatiquement).</p>"
            + _button("Voir le modèle d'email à envoyer aux salariés", "{{admin_url}}#communication")
        ),
        "text_content": (
            "Bonjour,\n\n"
            "Deux jours après votre activation, un mot sur la distribution des codes.\n\n"
            "1. Envoyez le code par email individuel, pas en canal collectif.\n"
            "2. Expliquez le cadre en une phrase : « ELSAI est un assistant social anonyme. »\n"
            "3. Rappelez que l'usage n'est pas tracé individuellement.\n\n"
            "Espace admin : {{admin_url}}"
        ) + _FOOTER_TEXT,
        "active": True,
    },
    {
        "key": "b2b_onboarding_j7_checkin",
        "sequence_key": "b2b_onboarding",
        "sequence_label": _B2B_ONBOARDING,
        "audience": "b2b",
        "step_order": 3,
        "step_label": "J+7 — Premier point d'étape",
        "delay_hours": 168,
        "subject": "Premier point d'étape : {{codes_used}}/{{seats}} codes activés",
        "preview": "Un aperçu de l'adoption à une semaine. Rien de nominatif, juste un comptage global.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Une semaine depuis votre activation. Voici où vous en êtes :</p>"
            '<ul style="line-height:1.7;">'
            "<li>Codes distribués activés : <strong>{{codes_used}} sur {{seats}}</strong></li>"
            "<li>Sessions engagées : {{total_sessions}}</li>"
            "<li>Thèmes les plus abordés : {{top_themes_or_dash}}</li>"
            "</ul>"
            "<p>Pour rappel, nous ne savons <strong>pas</strong> qui a utilisé quoi. "
            "Ces chiffres sont des agrégats anonymes.</p>"
            "<p>Si l'adoption est lente, c'est normal : un assistant social s'utilise quand "
            "le besoin se présente, pas de manière forcée.</p>"
            "<p>Quelques pistes si vous voulez relancer :</p>"
            '<ul style="line-height:1.7;">'
            "<li>Mentionner ELSAI dans une newsletter interne RH</li>"
            "<li>L'intégrer à votre programme QVT</li>"
            "<li>En parler en réunion d'équipe sans en faire un outil obligatoire</li>"
            "</ul>"
            + _button("Voir le tableau de bord complet", "{{admin_url}}")
        ),
        "text_content": (
            "Point d'étape à J+7 : {{codes_used}}/{{seats}} codes activés, {{total_sessions}} sessions.\n"
            "Thèmes : {{top_themes_or_dash}}.\n\n"
            "Tableau de bord : {{admin_url}}"
        ) + _FOOTER_TEXT,
        "active": True,
    },
    {
        "key": "b2b_onboarding_j14_help",
        "sequence_key": "b2b_onboarding",
        "sequence_label": _B2B_ONBOARDING,
        "audience": "b2b",
        "step_order": 4,
        "step_label": "J+14 — Besoin d'aide ?",
        "delay_hours": 336,
        "subject": "Deux semaines avec ELSAI — parlons-en ?",
        "preview": "15 min avec notre équipe pour optimiser le déploiement dans votre contexte.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Cela fait deux semaines qu'ELSAI est en place chez <strong>{{company_name}}</strong>.</p>"
            "<p>Si vous hésitez sur la communication interne, sur le rattachement à la politique QVT, "
            "ou simplement sur les cas d'usage à mettre en avant, nous pouvons échanger 15 minutes.</p>"
            "<p>L'appel est gratuit, sans engagement, et réservé aux abonnés actifs.</p>"
            "<p>Sinon, tout continue automatiquement — pas besoin de nous répondre.</p>"
            + _button("Réserver 15 minutes", "{{booking_url}}")
        ),
        "text_content": (
            "Bonjour,\n\nDeux semaines avec ELSAI chez {{company_name}}.\n"
            "Si vous hésitez sur la communication interne ou les cas d'usage, on peut échanger 15 min.\n\n"
            "Réserver : {{booking_url}}"
        ) + _FOOTER_TEXT,
        "active": True,
    },
    {
        "key": "b2b_onboarding_j30_first_report",
        "sequence_key": "b2b_onboarding",
        "sequence_label": _B2B_ONBOARDING,
        "audience": "b2b",
        "step_order": 5,
        "step_label": "J+30 — Premier rapport mensuel",
        "delay_hours": 720,
        "subject": "Votre rapport d'usage ELSAI — mois 1",
        "preview": "Un récap anonymisé du premier mois d'adoption.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Premier mois d'ELSAI chez <strong>{{company_name}}</strong>. Voici le récap anonymisé.</p>"
            "<h3 style=\"color:#5A7E6B;\">Engagement</h3>"
            '<ul style="line-height:1.7;">'
            "<li>Codes actifs : {{active_codes}}/{{seats}}</li>"
            "<li>Sessions engagées : {{sessions_count}}</li>"
            "<li>Durée moyenne d'échange : {{avg_duration}} minutes</li>"
            "</ul>"
            "<h3 style=\"color:#5A7E6B;\">Thèmes principaux (agrégés)</h3>"
            "<p>{{top_themes_bulleted}}</p>"
            "<h3 style=\"color:#5A7E6B;\">Démarches concrètes abouties</h3>"
            '<ul style="line-height:1.7;">'
            "<li>Courriers générés : {{letters_generated}}</li>"
            "<li>Formulaires complétés : {{forms_completed}}</li>"
            "<li>Orientations vers un professionnel : {{referrals_count}}</li>"
            "</ul>"
            "<p>Rappel : ces chiffres sont des agrégats. Nous ne pouvons pas relier un usage à un salarié spécifique.</p>"
            + _button("Voir le rapport détaillé", "{{admin_url}}/metrics")
        ),
        "text_content": (
            "Rapport mois 1 — {{company_name}}\n\n"
            "Codes actifs : {{active_codes}}/{{seats}}\n"
            "Sessions : {{sessions_count}}\n"
            "Durée moyenne : {{avg_duration}} min\n\n"
            "Thèmes : {{top_themes_bulleted}}\n\n"
            "Courriers : {{letters_generated}} · Formulaires : {{forms_completed}} · Orientations : {{referrals_count}}\n\n"
            "Détails : {{admin_url}}/metrics"
        ) + _FOOTER_TEXT,
        "active": True,
    },

    # --- B2B-2 Pré-expiration -----------------------------------------------
    {
        "key": "b2b_pre_expiry_j_minus_14",
        "sequence_key": "b2b_pre_expiry",
        "sequence_label": _B2B_PRE_EXPIRY,
        "audience": "b2b",
        "step_order": 1,
        "step_label": "J-14 — Annonce renouvellement",
        "delay_hours": -336,
        "subject": "Renouvellement ELSAI le {{renewal_date}}",
        "preview": "Rien à faire si votre moyen de paiement est toujours valide.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Votre abonnement ELSAI <strong>{{plan_label}}</strong> pour <strong>{{company_name}}</strong> "
            "se renouvelle automatiquement le <strong>{{renewal_date}}</strong> pour <strong>{{amount}}€ TTC</strong>.</p>"
            "<p>Vous n'avez rien à faire si :</p>"
            '<ul style="line-height:1.7;">'
            "<li>votre carte est toujours valide,</li>"
            "<li>vous souhaitez garder le même plan et le même nombre de sièges.</li>"
            "</ul>"
            "<p>Sinon, accédez au portail facturation pour mettre à jour la carte, "
            "changer les sièges, ou résilier (effet à la fin de la période en cours).</p>"
            + _button("Portail facturation", "{{portal_url}}")
        ),
        "text_content": (
            "Renouvellement ELSAI {{plan_label}} le {{renewal_date}} pour {{amount}}€ TTC.\n"
            "Rien à faire si votre carte est valide. Sinon : {{portal_url}}"
        ) + _FOOTER_TEXT,
        "active": True,
    },
    {
        "key": "b2b_pre_expiry_j_minus_3",
        "sequence_key": "b2b_pre_expiry",
        "sequence_label": _B2B_PRE_EXPIRY,
        "audience": "b2b",
        "step_order": 2,
        "step_label": "J-3 — Dernier rappel",
        "delay_hours": -72,
        "subject": "Renouvellement dans 3 jours — {{company_name}}",
        "preview": "Dernière occasion d'ajuster sièges ou plan avant prélèvement.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Dernier rappel avant le renouvellement automatique de votre abonnement ELSAI "
            "<strong>{{plan_label}}</strong>, prévu le <strong>{{renewal_date}}</strong> pour "
            "<strong>{{amount}}€ TTC</strong>.</p>"
            "<p>Si vous souhaitez ajuster le nombre de sièges ou changer de plan, "
            "c'est le moment de le faire.</p>"
            + _button("Portail facturation", "{{portal_url}}")
        ),
        "text_content": (
            "Renouvellement dans 3 jours : {{renewal_date}}, {{amount}}€ TTC.\n"
            "Ajuster : {{portal_url}}"
        ) + _FOOTER_TEXT,
        "active": True,
    },

    # --- B2B-3 Dunning ------------------------------------------------------
    {
        "key": "b2b_dunning_j1_fail",
        "sequence_key": "b2b_dunning",
        "sequence_label": _B2B_DUNNING,
        "audience": "b2b",
        "step_order": 1,
        "step_label": "J+1 — Échec de prélèvement",
        "delay_hours": 24,
        "subject": "Paiement ELSAI non abouti — action requise",
        "preview": "Votre carte a été refusée. Mettez-la à jour en 2 minutes.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Le prélèvement de <strong>{{amount}}€</strong> pour votre abonnement ELSAI "
            "<strong>{{plan_label}}</strong> n'a pas abouti.</p>"
            "<p>Raison transmise par votre banque : <em>{{decline_reason_or_generic}}</em></p>"
            "<p>Votre service ELSAI reste actif pour l'instant. Il sera suspendu si aucun paiement "
            "n'est régularisé sous 7 jours.</p>"
            "<p>Mettez à jour votre moyen de paiement en 2 minutes :</p>"
            + _button("Mettre à jour ma carte", "{{portal_url}}")
        ),
        "text_content": (
            "Prélèvement de {{amount}}€ refusé ({{decline_reason_or_generic}}).\n"
            "Service actif 7 jours. Mettre à jour la carte : {{portal_url}}"
        ) + _FOOTER_TEXT,
        "active": True,
    },
    {
        "key": "b2b_dunning_j4_reminder",
        "sequence_key": "b2b_dunning",
        "sequence_label": _B2B_DUNNING,
        "audience": "b2b",
        "step_order": 2,
        "step_label": "J+4 — Rappel suspension dans 3 jours",
        "delay_hours": 96,
        "subject": "ELSAI : service suspendu dans 3 jours si paiement non régularisé",
        "preview": "Un second essai de prélèvement sera tenté automatiquement.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Trois jours se sont écoulés depuis l'échec du prélèvement de votre abonnement ELSAI. "
            "Un second essai sera tenté automatiquement sous 48h.</p>"
            "<p>Si vous souhaitez nous éviter ce nouvel essai, vous pouvez régulariser dès maintenant "
            "depuis le portail facturation.</p>"
            "<p>Sans régularisation, les <strong>{{seats}} codes d'accès</strong> de vos équipes "
            "seront désactivés le <strong>{{suspension_date}}</strong>.</p>"
            + _button("Portail facturation", "{{portal_url}}")
        ),
        "text_content": (
            "Rappel : second essai de prélèvement sous 48h.\n"
            "Suspension des codes le {{suspension_date}} si pas régularisé.\n"
            "Portail : {{portal_url}}"
        ) + _FOOTER_TEXT,
        "active": True,
    },
    {
        "key": "b2b_dunning_j7_suspended",
        "sequence_key": "b2b_dunning",
        "sequence_label": _B2B_DUNNING,
        "audience": "b2b",
        "step_order": 3,
        "step_label": "J+7 — Service suspendu",
        "delay_hours": 168,
        "subject": "Service ELSAI suspendu — réactivation possible",
        "preview": "Vos codes sont désactivés temporairement. La réactivation est immédiate.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Faute de régularisation, les codes d'accès ELSAI de <strong>{{company_name}}</strong> "
            "sont désactivés depuis le <strong>{{suspension_date}}</strong>.</p>"
            "<p>Vos données (prompts personnalisés, historique admin) sont conservées pendant 30 jours.</p>"
            "<p>Pour réactiver immédiatement le service, mettez à jour votre moyen de paiement. "
            "Les codes redeviennent actifs dans les minutes qui suivent.</p>"
            "<p>Au-delà de 30 jours, l'abonnement sera définitivement résilié et les données supprimées "
            "conformément à notre politique RGPD.</p>"
            + _button("Réactiver maintenant", "{{portal_url}}")
        ),
        "text_content": (
            "Service ELSAI suspendu depuis le {{suspension_date}}.\n"
            "Réactivation immédiate : {{portal_url}}\n"
            "Données conservées 30 jours puis supprimées."
        ) + _FOOTER_TEXT,
        "active": True,
    },

    # --- B2B-4 Rapport mensuel ----------------------------------------------
    {
        "key": "b2b_monthly_report",
        "sequence_key": "b2b_monthly_report",
        "sequence_label": _B2B_MONTHLY,
        "audience": "b2b",
        "step_order": 1,
        "step_label": "Mensuel — Rapport d'usage",
        "delay_hours": 0,  # planifié par le cron mensuel, pas de délai relatif
        "subject": "Votre rapport ELSAI — {{month_label}}",
        "preview": "Les chiffres du mois, 100% anonymisés.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Voici le rapport d'usage ELSAI pour <strong>{{company_name}}</strong> — "
            "<strong>{{month_label}}</strong>.</p>"
            "<h3 style=\"color:#5A7E6B;\">Engagement</h3>"
            '<ul style="line-height:1.7;">'
            "<li>Codes actifs : {{active_codes}}/{{seats}}</li>"
            "<li>Sessions engagées : {{sessions_count}}</li>"
            "<li>Durée moyenne : {{avg_duration}} minutes</li>"
            "<li>Nouveaux utilisateurs ce mois : {{new_codes_activated}}</li>"
            "</ul>"
            "<h3 style=\"color:#5A7E6B;\">Thèmes principaux</h3>"
            "<p>{{top_themes_bulleted}}</p>"
            "<h3 style=\"color:#5A7E6B;\">Démarches abouties</h3>"
            '<ul style="line-height:1.7;">'
            "<li>Courriers générés : {{letters_generated}}</li>"
            "<li>Formulaires complétés : {{forms_completed}}</li>"
            "<li>Orientations : {{referrals_count}}</li>"
            "</ul>"
            "<p>Rappel : ces chiffres sont des agrégats. Nous ne pouvons pas relier un usage à un salarié spécifique.</p>"
            + _button("Voir le rapport détaillé", "{{admin_url}}/metrics")
            + '<p style="font-size:12px;color:#888;">'
            '<a href="{{admin_url}}/settings#notifications" style="color:#888;">'
            'Se désabonner de ces rapports</a></p>'
        ),
        "text_content": (
            "Rapport ELSAI {{month_label}} — {{company_name}}\n\n"
            "Codes actifs : {{active_codes}}/{{seats}} · Sessions : {{sessions_count}}\n"
            "Durée moy : {{avg_duration}} min · Nouveaux : {{new_codes_activated}}\n\n"
            "Thèmes : {{top_themes_bulleted}}\n"
            "Courriers : {{letters_generated}} · Formulaires : {{forms_completed}} · Orientations : {{referrals_count}}\n\n"
            "Détails : {{admin_url}}/metrics"
        ) + _FOOTER_TEXT,
        "active": True,
    },

    # --- B2C-1 Génération de courrier (inactif, en attente compte B2C) ------
    {
        "key": "b2c_letter_j0_ready",
        "sequence_key": "b2c_letter",
        "sequence_label": _B2C_LETTER,
        "audience": "b2c",
        "step_order": 1,
        "step_label": "J+0 — Courrier prêt",
        "delay_hours": 0,
        "subject": "Votre courrier est prêt — {{recipient_org}}",
        "preview": "Téléchargez-le, envoyez-le, et gardez la trace d'envoi.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Votre compte ELSAI est créé. Voici votre courrier destiné à "
            "<strong>{{recipient_org}}</strong>, objet : <em>{{subject_line}}</em>.</p>"
            + _button("Télécharger le courrier PDF", "{{letter_url}}")
            + "<p><strong>Conseils d'envoi :</strong></p>"
            '<ul style="line-height:1.7;">'
            "<li>Envoyez en recommandé avec accusé de réception si la démarche est importante.</li>"
            "<li>Conservez l'AR : il fait preuve de la date d'envoi.</li>"
            "<li>Une fois envoyé, revenez sur votre espace pour indiquer la date. "
            "Nous pourrons alors vous rappeler si aucune réponse n'arrive dans les délais légaux.</li>"
            "</ul>"
            "<p>Vous pouvez à tout moment supprimer votre compte et toutes vos données depuis votre espace.</p>"
        ),
        "text_content": (
            "Votre courrier pour {{recipient_org}} ({{subject_line}}) est prêt.\n"
            "Téléchargement : {{letter_url}}\n"
            "Conseil : recommandé avec AR. Indiquez la date d'envoi dans votre espace."
        ) + _FOOTER_TEXT,
        "active": False,
        "notes": "En attente de l'implémentation du compte B2C et de l'event LetterGenerated.",
    },
    {
        "key": "b2c_letter_j3_sent_check",
        "sequence_key": "b2c_letter",
        "sequence_label": _B2C_LETTER,
        "audience": "b2c",
        "step_order": 2,
        "step_label": "J+3 — Avez-vous envoyé ?",
        "delay_hours": 72,
        "subject": "Courrier pour {{recipient_org}} : envoyé ?",
        "preview": "Indiquez la date d'envoi pour activer le suivi automatique.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Trois jours depuis la génération de votre courrier pour <strong>{{recipient_org}}</strong>.</p>"
            "<p>Si vous l'avez envoyé, indiquez la date d'envoi depuis votre espace. Cela nous permet de :</p>"
            '<ul style="line-height:1.7;">'
            "<li>calculer le délai de réponse légal qui s'applique,</li>"
            "<li>vous alerter si ce délai est dépassé sans réponse,</li>"
            "<li>vous proposer une relance ou un recours le cas échéant.</li>"
            "</ul>"
            "<p>Si vous ne l'avez pas encore envoyé, pas de pression — revenez quand vous êtes prêt(e).</p>"
            + _button("Indiquer la date d'envoi", "{{account_url}}")
        ),
        "text_content": (
            "Avez-vous envoyé le courrier pour {{recipient_org}} ?\n"
            "Indiquez la date : {{account_url}}"
        ) + _FOOTER_TEXT,
        "active": False,
        "notes": "En attente compte B2C.",
    },
    {
        "key": "b2c_letter_legal_delay_reached",
        "sequence_key": "b2c_letter",
        "sequence_label": _B2C_LETTER,
        "audience": "b2c",
        "step_order": 3,
        "step_label": "J+{{legal_delay}} — Délai de réponse atteint",
        "delay_hours": 0,  # calculé dynamiquement d'après date d'envoi + délai légal
        "subject": "Pas de réponse de {{recipient_org}} ? Voici les options",
        "preview": "Le délai légal de réponse est aujourd'hui atteint.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Vous avez envoyé votre courrier à <strong>{{recipient_org}}</strong> le <strong>{{sent_date}}</strong>. "
            "Le délai légal de réponse de <strong>{{legal_delay_days}} jours</strong> est atteint aujourd'hui.</p>"
            "<p>Si vous avez reçu une réponse (même partielle) : indiquez-le pour clôturer le suivi.</p>"
            "<p>Si aucune réponse n'est arrivée, plusieurs options :</p>"
            '<ul style="line-height:1.7;">'
            "<li>Relance simple (souvent suffisante — modèle disponible en un clic)</li>"
            "<li>Recours gracieux auprès de {{recipient_org}}</li>"
            "<li>Recours hiérarchique ou médiateur selon la nature du dossier</li>"
            "</ul>"
            "<p>Revenez échanger avec ELSAI pour décider de la meilleure suite.</p>"
            + _button("Générer une relance", "{{account_url}}/letter/{{letter_id}}/followup")
        ),
        "text_content": (
            "Délai légal de {{legal_delay_days}} jours atteint pour {{recipient_org}}.\n"
            "Options : relance, recours gracieux, hiérarchique.\n"
            "Relance en 1 clic : {{account_url}}/letter/{{letter_id}}/followup"
        ) + _FOOTER_TEXT,
        "active": False,
        "notes": "En attente compte B2C. delay_hours calculé dynamiquement.",
    },
    {
        "key": "b2c_letter_j30_closure",
        "sequence_key": "b2c_letter",
        "sequence_label": _B2C_LETTER,
        "audience": "b2c",
        "step_order": 4,
        "step_label": "J+30 — Clôture ou recours ?",
        "delay_hours": 720,
        "subject": "Où en est votre démarche {{recipient_org}} ?",
        "preview": "Dernier point d'étape avant archivage automatique.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Un mois après votre courrier à <strong>{{recipient_org}}</strong>, un dernier point d'étape.</p>"
            "<p>Trois options s'offrent à vous :</p>"
            '<ul style="line-height:1.7;">'
            "<li><strong>Résolu</strong> — vous avez eu la réponse attendue. Clôturez le dossier.</li>"
            "<li><strong>En attente</strong> — prolongez le suivi pour 30 jours de plus.</li>"
            "<li><strong>Bloqué</strong> — nous pouvons vous aider à engager un recours.</li>"
            "</ul>"
            + _button("Mettre à jour le statut", "{{account_url}}/letter/{{letter_id}}")
        ),
        "text_content": (
            "Un mois depuis votre courrier à {{recipient_org}}.\n"
            "Statut : résolu / en attente / bloqué ?\n"
            "Mettre à jour : {{account_url}}/letter/{{letter_id}}"
        ) + _FOOTER_TEXT,
        "active": False,
        "notes": "En attente compte B2C.",
    },

    # --- B2C-2 Remplissage de formulaire (inactif) --------------------------
    {
        "key": "b2c_form_j0_ready",
        "sequence_key": "b2c_form",
        "sequence_label": _B2C_FORM,
        "audience": "b2c",
        "step_order": 1,
        "step_label": "J+0 — Formulaire prêt",
        "delay_hours": 0,
        "subject": "Formulaire {{form_type}} — prêt pour transmission",
        "preview": "Vérifiez, signez et transmettez selon la procédure indiquée.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Votre formulaire <strong>{{form_type}}</strong> destiné à <strong>{{target_organism}}</strong> "
            "est complété sur la base des éléments que vous m'avez confiés.</p>"
            + _button("Télécharger le formulaire pré-rempli", "{{form_url}}")
            + "<p><strong>Avant de transmettre :</strong></p>"
            '<ol style="line-height:1.7;">'
            "<li>Relisez chaque champ attentivement — vous restez responsable des informations déclarées.</li>"
            "<li>Signez à la main les emplacements prévus (hors signature électronique valide).</li>"
            "<li>Joignez les pièces justificatives listées page {{doc_page}}.</li>"
            "<li>Transmettez selon la voie indiquée par {{target_organism}} "
            "(en ligne / courrier / guichet).</li>"
            "</ol>"
        ),
        "text_content": (
            "Formulaire {{form_type}} pour {{target_organism}} prêt : {{form_url}}\n"
            "Relire, signer, joindre pièces (page {{doc_page}}), transmettre."
        ) + _FOOTER_TEXT,
        "active": False,
        "notes": "En attente compte B2C.",
    },
    {
        "key": "b2c_form_j5_ack",
        "sequence_key": "b2c_form",
        "sequence_label": _B2C_FORM,
        "audience": "b2c",
        "step_order": 2,
        "step_label": "J+5 — Accusé de réception ?",
        "delay_hours": 120,
        "subject": "Dossier {{form_type}} : transmis et accusé reçu ?",
        "preview": "Conserver l'AR est crucial pour la suite.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Avez-vous transmis votre dossier <strong>{{form_type}}</strong> à <strong>{{target_organism}}</strong> ?</p>"
            "<p>L'accusé de réception (papier, email ou récépissé en ligne) est un document important : "
            "il fait foi de la date de dépôt et du caractère complet du dossier. Classez-le précieusement.</p>"
            "<p>Indiquez la date de transmission dans votre espace pour activer le suivi automatique des délais.</p>"
            + _button("Indiquer la date de transmission", "{{account_url}}")
        ),
        "text_content": (
            "Avez-vous transmis le dossier {{form_type}} à {{target_organism}} ?\n"
            "Conservez l'AR. Indiquez la date : {{account_url}}"
        ) + _FOOTER_TEXT,
        "active": False,
        "notes": "En attente compte B2C.",
    },
    {
        "key": "b2c_form_j14_followup",
        "sequence_key": "b2c_form",
        "sequence_label": _B2C_FORM,
        "audience": "b2c",
        "step_order": 3,
        "step_label": "J+14 — Suivi d'instruction",
        "delay_hours": 336,
        "subject": "Instruction {{form_type}} — point d'étape",
        "preview": "Délai moyen d'instruction et ce que vous pouvez faire d'ici là.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Deux semaines depuis la transmission de votre dossier <strong>{{form_type}}</strong>.</p>"
            "<p>Le délai moyen d'instruction à {{target_organism}} pour ce type de dossier est de "
            "<strong>{{avg_instruction_days}} jours</strong>. Soyez particulièrement vigilant(e) à une "
            "éventuelle demande de pièces complémentaires : si vous recevez un courrier qui vous en demande, "
            "le délai est suspendu jusqu'à réception de vos compléments.</p>"
            "<p>Si vous n'avez aucune nouvelle à J+{{followup_days}}, envisagez une relance.</p>"
            + _button("Voir mon espace démarche", "{{account_url}}")
        ),
        "text_content": (
            "Instruction {{form_type}} : délai moyen {{avg_instruction_days}} jours.\n"
            "Vigilance : demandes de pièces suspendent le délai.\n"
            "Espace : {{account_url}}"
        ) + _FOOTER_TEXT,
        "active": False,
        "notes": "En attente compte B2C.",
    },

    # --- B2C-3 Suivi de recours (inactif) -----------------------------------
    {
        "key": "b2c_appeal_j0_started",
        "sequence_key": "b2c_appeal",
        "sequence_label": _B2C_APPEAL,
        "audience": "b2c",
        "step_order": 1,
        "step_label": "J+0 — Recours engagé",
        "delay_hours": 0,
        "subject": "Recours {{recipient_org}} — engagé",
        "preview": "Les délais contentieux démarrent aujourd'hui.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Votre recours <strong>{{appeal_type}}</strong> auprès de <strong>{{recipient_org}}</strong> "
            "a bien été engagé aujourd'hui.</p>"
            "<p><strong>Délais applicables :</strong> {{applicable_deadline_days}} jours à compter de ce jour. "
            "Passé ce délai, certaines voies de recours seront fermées.</p>"
            "<p>Conservez précieusement tous les échanges (courriers, emails, décisions). Ils sont essentiels "
            "si le dossier évolue vers une phase contentieuse.</p>"
            + _button("Voir le dossier", "{{account_url}}/appeal/{{appeal_id}}")
        ),
        "text_content": (
            "Recours {{appeal_type}} auprès de {{recipient_org}} engagé.\n"
            "Délai : {{applicable_deadline_days}} jours.\n"
            "Dossier : {{account_url}}/appeal/{{appeal_id}}"
        ) + _FOOTER_TEXT,
        "active": False,
        "notes": "En attente compte B2C.",
    },
    {
        "key": "b2c_appeal_j30_midway",
        "sequence_key": "b2c_appeal",
        "sequence_label": _B2C_APPEAL,
        "audience": "b2c",
        "step_order": 2,
        "step_label": "J+30 — Point mi-parcours",
        "delay_hours": 720,
        "subject": "Recours {{recipient_org}} — 30 jours",
        "preview": "Une réponse attendue sous {{days_remaining}} jours.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Un mois depuis l'engagement de votre recours auprès de <strong>{{recipient_org}}</strong>.</p>"
            "<p>Il reste <strong>{{days_remaining}} jours</strong> avant l'échéance.</p>"
            "<p>À savoir : en cas d'absence de réponse dans le délai, l'administration est réputée avoir "
            "pris une <strong>décision implicite de rejet</strong>. Cela ouvre la voie à un recours "
            "contentieux devant le tribunal administratif.</p>"
            + _button("Mettre à jour le dossier", "{{account_url}}/appeal/{{appeal_id}}")
        ),
        "text_content": (
            "Recours {{recipient_org}} — {{days_remaining}} jours restants.\n"
            "Absence de réponse = rejet implicite. Voie contentieuse ouverte.\n"
            "Dossier : {{account_url}}/appeal/{{appeal_id}}"
        ) + _FOOTER_TEXT,
        "active": False,
        "notes": "En attente compte B2C.",
    },
    {
        "key": "b2c_appeal_deadline",
        "sequence_key": "b2c_appeal",
        "sequence_label": _B2C_APPEAL,
        "audience": "b2c",
        "step_order": 3,
        "step_label": "Échéance contentieuse",
        "delay_hours": 0,  # calculé d'après date d'engagement + délai applicable
        "subject": "Action à décider avant le {{deadline_date}}",
        "preview": "Après cette date, certaines voies de recours seront fermées.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>L'échéance contentieuse de votre dossier {{recipient_org}} est <strong>{{deadline_date}}</strong>. "
            "Au-delà, vous perdez la possibilité de saisir le tribunal administratif pour cette décision.</p>"
            "<p>Trois options s'offrent à vous :</p>"
            '<ul style="line-height:1.7;">'
            "<li>Accepter la décision et clôturer le dossier.</li>"
            "<li>Saisir le tribunal administratif (possible sans avocat pour de nombreux contentieux sociaux).</li>"
            "<li>Consulter gratuitement un avocat (permanence du barreau) ou le Défenseur des droits.</li>"
            "</ul>"
            + _button("En discuter avec ELSAI", "{{account_url}}/appeal/{{appeal_id}}")
        ),
        "text_content": (
            "Échéance contentieuse : {{deadline_date}}.\n"
            "Options : accepter, TA, avocat/Défenseur des droits.\n"
            "Discuter : {{account_url}}/appeal/{{appeal_id}}"
        ) + _FOOTER_TEXT,
        "active": False,
        "notes": "En attente compte B2C. delay_hours calculé dynamiquement.",
    },

    # --- B2C-4 Rappel d'échéance (inactif) ---------------------------------
    {
        "key": "b2c_reminder_j_minus_30",
        "sequence_key": "b2c_reminder",
        "sequence_label": _B2C_REMINDER,
        "audience": "b2c",
        "step_order": 1,
        "step_label": "J-30 — Premier rappel",
        "delay_hours": -720,
        "subject": "{{event_type}} dans 30 jours",
        "preview": "L'échéance approche. Vérifiez vos pièces.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Un rappel : <strong>{{event_type}}</strong> est prévu le <strong>{{event_date}}</strong>.</p>"
            "<p>Un mois à l'avance pour vous permettre de rassembler tranquillement les pièces "
            "qui seront utiles le jour J.</p>"
            + _button("Préparer {{event_type}} avec ELSAI", "{{account_url}}/reminder/{{reminder_id}}")
        ),
        "text_content": (
            "{{event_type}} le {{event_date}} — dans 30 jours.\n"
            "Préparer : {{account_url}}/reminder/{{reminder_id}}"
        ) + _FOOTER_TEXT,
        "active": False,
        "notes": "En attente compte B2C.",
    },
    {
        "key": "b2c_reminder_j_minus_7",
        "sequence_key": "b2c_reminder",
        "sequence_label": _B2C_REMINDER,
        "audience": "b2c",
        "step_order": 2,
        "step_label": "J-7 — Préparation",
        "delay_hours": -168,
        "subject": "{{event_type}} dans 7 jours — préparation",
        "preview": "Checklist rapide pour arriver serein(e).",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p><strong>{{event_type}}</strong> le <strong>{{event_date}}</strong> à <strong>{{event_location}}</strong>.</p>"
            "<p>Sept jours pour vous préparer. Checklist générique (adaptez-la à votre cas) :</p>"
            '<ul style="line-height:1.7;">'
            "<li>Documents à apporter : {{required_docs_or_dash}}</li>"
            "<li>Heure de convocation : {{event_time}}</li>"
            "<li>Lieu exact et accès : {{event_location_details}}</li>"
            "<li>Justificatif d'identité : pièce d'identité valide</li>"
            "</ul>"
            "<p>Si vous avez le moindre doute sur un document manquant ou sur ce qui sera attendu de vous, "
            "revenez échanger avec moi — je peux vous aider à préparer ce que vous direz et à anticiper "
            "les questions difficiles.</p>"
            + _button("Préparer avec ELSAI", "{{account_url}}/reminder/{{reminder_id}}")
        ),
        "text_content": (
            "{{event_type}} dans 7 jours — {{event_date}} {{event_time}} à {{event_location}}.\n"
            "Documents : {{required_docs_or_dash}}\n"
            "Préparer : {{account_url}}/reminder/{{reminder_id}}"
        ) + _FOOTER_TEXT,
        "active": False,
        "notes": "En attente compte B2C.",
    },
    {
        "key": "b2c_reminder_j_minus_1",
        "sequence_key": "b2c_reminder",
        "sequence_label": _B2C_REMINDER,
        "audience": "b2c",
        "step_order": 3,
        "step_label": "J-1 — Rappel final",
        "delay_hours": -24,
        "subject": "Demain : {{event_type}}",
        "preview": "{{event_time}} à {{event_location}}. Courage.",
        "html_content": _wrap(
            "<p>Bonjour,</p>"
            "<p>Demain, <strong>{{event_type}}</strong> à <strong>{{event_time}}</strong>, "
            "<strong>{{event_location}}</strong>.</p>"
            "<p>Courage.</p>"
            + _button("Voir les détails et pièces", "{{account_url}}/reminder/{{reminder_id}}")
        ),
        "text_content": (
            "Demain : {{event_type}} à {{event_time}}, {{event_location}}. Courage."
        ) + _FOOTER_TEXT,
        "active": False,
        "notes": "En attente compte B2C.",
    },
]


def seed_email_templates(db: Session) -> int:
    """Insère les templates manquants. Ne modifie pas ceux déjà en base.

    Retourne le nombre de nouveaux templates insérés.
    """
    existing_keys = {row.key for row in db.query(EmailTemplate.key).all()}
    inserted = 0
    for spec in SEED_TEMPLATES:
        if spec["key"] in existing_keys:
            continue
        db.add(EmailTemplate(updated_by="seed", **spec))
        inserted += 1
    if inserted:
        db.commit()
    return inserted
