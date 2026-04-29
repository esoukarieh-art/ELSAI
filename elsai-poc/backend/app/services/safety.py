"""Détection de signaux de danger — couche heuristique avant LLM.

Complémentaire à la détection par prompt mineur. Sert de filet de sécurité
même pour un parcours adulte : si des signaux de détresse extrême arrivent,
on veut pouvoir loguer l'événement et afficher une CTA d'urgence.
"""

import re

# Mots-clés sensibles (heuristique — complémentaire à la détection LLM)
_PATTERNS = {
    "suicide": re.compile(
        r"\b(me tuer|suicid\w*|en finir|plus envie de vivre|mourir|disparaître|me pendre|sauter du)\b",
        re.IGNORECASE,
    ),
    "violence": re.compile(
        r"\b(tape|frappe|viol(é|ée|er)?|bat(s|tu|tre)|maltrait\w*|cogne|brutalis\w*)\b",
        re.IGNORECASE,
    ),
    "abuse": re.compile(
        r"\b(touche|attouch\w*|inceste|forc(é|ée)? \w* (à|a) faire)\b",
        re.IGNORECASE,
    ),
    "harassment": re.compile(
        r"\b(harcèl|harass|menace|intimid)\w*",
        re.IGNORECASE,
    ),
    "self_harm": re.compile(
        r"\b(me (coupe\w*|scarifi\w*|mutil\w*|brûle\w*|blesse\w*|fais du mal|faire du mal)|scarif\w*|automutil\w*)\b",
        re.IGNORECASE,
    ),
    "eating_disorder": re.compile(
        r"\b(anorex\w*|boulim\w*|vomir|me faire vomir|purg\w*|jeûn\w*|ne plus manger|trop gross\w*|trop maigre)\b",
        re.IGNORECASE,
    ),
    "grooming": re.compile(
        r"\b(un adulte|un homme plus (vieux|âgé)|une femme plus (vieille|âgée)|il m('|e )a demandé (des|une) photo|envoie(-| )moi (une|des) photo|notre secret|ne (le )?dis (à|a) personne|si tu m'aimes|cadeau contre)\b",
        re.IGNORECASE,
    ),
    "runaway": re.compile(
        r"\b(fugu\w*|partir de (la )?maison|m'enfuir|quitter la maison|plus rentrer (chez|à la maison)|(dormir|dors|dormi) dehors|à la rue)\b",
        re.IGNORECASE,
    ),
}

_EMERGENCY_CTAS = {
    "minor": {"label": "Appeler le 119 (gratuit, 24h/24)", "phone": "119"},
    "adult": {"label": "Appeler le 3919 (violences) ou 3114 (suicide)", "phone": "3114"},
}

# Marqueurs « parent qui décrit un enfant » — si présents, l'utilisateur n'est
# pas la personne en danger mais le proche inquiet. On affiche quand même la
# ressource (119) à titre informatif, sans armer l'alerte côté admin.
_THIRD_PARTY_CHILD = re.compile(
    r"\b(ma fille|mon fils|mon enfant|mes enfants|mon ado|mon adolescent\w*|"
    r"mon gamin|ma gamine|mon gosse|ma gosse|mon bébé|mon petit|ma petite)\b",
    re.IGNORECASE,
)

# Pronoms qui indiquent que l'utilisateur lui-même est victime ; dans ce cas
# on n'applique PAS la règle « tiers concerné », même si « ma mère / mon père »
# apparaît (ex. « ma mère me bat »).
_FIRST_PERSON_VICTIM = re.compile(
    r"\b(me |m'|moi)",
    re.IGNORECASE,
)


def scan(text: str, profile: str = "adult") -> dict:
    """Retourne {danger, signals, cta, third_party}.

    - `danger`: l'utilisateur lui-même est probablement en danger.
    - `third_party`: signaux détectés mais l'utilisateur parle d'un proche
      (typiquement un parent à propos de son enfant). `danger` est False
      mais `cta` reste fournie en mode informatif.
    """
    signals = [name for name, pattern in _PATTERNS.items() if pattern.search(text)]
    if not signals:
        return {"danger": False, "signals": [], "cta": None, "third_party": False}

    third_party = bool(_THIRD_PARTY_CHILD.search(text)) and not _FIRST_PERSON_VICTIM.search(text)
    cta = _EMERGENCY_CTAS.get(profile, _EMERGENCY_CTAS["adult"])

    if third_party:
        return {"danger": False, "signals": signals, "cta": cta, "third_party": True}
    return {"danger": True, "signals": signals, "cta": cta, "third_party": False}
