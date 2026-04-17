"""Détection de signaux de danger — couche heuristique avant LLM.

Complémentaire à la détection par prompt mineur. Sert de filet de sécurité
même pour un parcours adulte : si des signaux de détresse extrême arrivent,
on veut pouvoir loguer l'événement et afficher une CTA d'urgence.
"""

import re

# Mots-clés sensibles (liste minimale non exhaustive — à enrichir en prod)
_PATTERNS = {
    "suicide": re.compile(
        r"\b(me tuer|suicid|en finir|plus envie de vivre|mourir)\b",
        re.IGNORECASE,
    ),
    "violence": re.compile(
        r"\b(tape|frappe|viol(é|ée|er)?|bat(s|tu|tre)|maltrait)\b",
        re.IGNORECASE,
    ),
    "abuse": re.compile(
        r"\b(touche|attouch|inceste|forc(é|ée)? \w* (à|a) faire)\b",
        re.IGNORECASE,
    ),
    "harassment": re.compile(
        r"\b(harcèl|harass|menace|intimid)\w*",
        re.IGNORECASE,
    ),
}

_EMERGENCY_CTAS = {
    "minor": {"label": "Appeler le 119 (gratuit, 24h/24)", "phone": "119"},
    "adult": {"label": "Appeler le 3919 (violences) ou 3114 (suicide)", "phone": "3114"},
}


def scan(text: str, profile: str = "adult") -> dict:
    """Retourne {danger: bool, signals: [str], cta: dict|None}."""
    signals = [name for name, pattern in _PATTERNS.items() if pattern.search(text)]
    if not signals:
        return {"danger": False, "signals": [], "cta": None}
    return {
        "danger": True,
        "signals": signals,
        "cta": _EMERGENCY_CTAS.get(profile, _EMERGENCY_CTAS["adult"]),
    }
