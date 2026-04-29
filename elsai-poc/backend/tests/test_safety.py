"""Tests de safety.scan — corpus de calibration éthique.

Objectif : **mesurer** l'état actuel de la détection, pas encore la durcir.
Chaque cas douteux (faux positif ou faux négatif) est marqué `xfail(strict=True)`
pour qu'il reste visible dans le rapport de test sans casser la suite.
Quand on durcira la regex (ticket à part), les xfail deviendront des passages
normaux — ou on les flippera en négatifs vrais.

Les 4 catégories :
  - TRUE_POSITIVES : détresse explicite → DOIT être détectée.
  - TRUE_NEGATIVES : neutre / anodin → NE DOIT PAS être détecté.
  - KNOWN_FP       : ambigu, actuellement détecté à tort (xfail).
  - KNOWN_FN       : détresse manquée aujourd'hui (xfail).
"""

from __future__ import annotations

import pytest

from app.services.safety import scan

# --- Vrais positifs : l'intention est nette ---------------------------------
TRUE_POSITIVES = [
    ("je veux me tuer", "suicide"),
    ("j'ai envie d'en finir ce soir", "suicide"),
    ("je n'ai plus envie de vivre", "suicide"),
    ("mon mari me frappe tous les soirs", "violence"),
    ("il m'a violée quand j'avais 14 ans", "violence"),
    ("mon oncle me touche la nuit", "abuse"),
    ("je suis victime d'inceste", "abuse"),
    ("mon chef me harcèle au travail", "harassment"),
    ("il me menace de me virer", "harassment"),
    # Promus depuis KNOWN_FN après patch `\w*` sur suicid/maltrait/attouch.
    ("je subis de la maltraitance depuis l'enfance", "violence"),
    ("il y a eu des attouchements", "abuse"),
    # Promus depuis KNOWN_FN après enrichissement vocabulaire suicide/violence.
    ("j'aimerais disparaître pour toujours", "suicide"),
    ("il me cogne quand il rentre", "violence"),
    ("j'ai envie de sauter du pont", "suicide"),
    # Nouvelles catégories (automutilation, TCA, grooming, fugue).
    ("je me coupe les bras quand ça va mal", "self_harm"),
    ("je me scarifie depuis des mois", "self_harm"),
    ("je me fais vomir après chaque repas", "eating_disorder"),
    ("je suis anorexique depuis mes 13 ans", "eating_disorder"),
    ("un homme plus vieux me demande des photos sur Snap", "grooming"),
    ("il dit que c'est notre secret, que je dois pas le dire à mes parents", "grooming"),
    ("je veux fuguer de la maison ce week-end", "runaway"),
    ("je dors dehors depuis deux nuits", "runaway"),
]


# --- Vrais négatifs : rien à signaler ---------------------------------------
TRUE_NEGATIVES = [
    "j'ai besoin d'aide pour remplir un dossier CAF",
    "je cherche un logement social",
    "bonjour, comment ça va",
    "je suis fatigué mais ça va passer",
    "mon enfant est malade, que faire",
    "",
]


# --- Faux positifs connus : regex trop large --------------------------------
# Chaque cas est accompagné du signal indûment levé.
KNOWN_FP = [
    ("il m'a donné une tape amicale dans le dos", "violence"),
    ("ça me touche vraiment beaucoup, merci", "abuse"),
    ("c'est à mourir de rire", "suicide"),
    ("je vais mourir de faim avant le dîner", "suicide"),
    ("il faut qu'on frappe à la porte du voisin", "violence"),
]


# --- Faux négatifs connus : détresse non captée aujourd'hui -----------------
# Ces formulations existent réellement et devraient déclencher la CTA.
KNOWN_FN = [
    "je ne veux plus être là",
    "ma mère me bat quand elle a bu",  # "bat" seul non matché (regex exige bats/battu/battre)
    "mon conjoint me gifle régulièrement",
]


@pytest.mark.parametrize("text,expected_signal", TRUE_POSITIVES)
def test_true_positive_detected(text: str, expected_signal: str):
    result = scan(text, profile="adult")
    assert result["danger"] is True, f"raté : {text!r}"
    assert expected_signal in result["signals"]
    assert result["cta"] is not None


@pytest.mark.parametrize("text", TRUE_NEGATIVES)
def test_true_negative_not_detected(text: str):
    result = scan(text, profile="adult")
    assert result["danger"] is False, f"faux positif sur : {text!r} → signals={result['signals']}"
    assert result["cta"] is None


@pytest.mark.fp
@pytest.mark.parametrize("text,leaked_signal", KNOWN_FP)
@pytest.mark.xfail(strict=True, reason="faux positif connu — regex à durcir")
def test_known_false_positive(text: str, leaked_signal: str):
    # Si ce test PASSE, c'est que la regex a été durcie → basculer en TRUE_NEGATIVE.
    result = scan(text, profile="adult")
    assert result["danger"] is False


@pytest.mark.fn
@pytest.mark.parametrize("text", KNOWN_FN)
@pytest.mark.xfail(strict=True, reason="faux négatif connu — vocabulaire à enrichir")
def test_known_false_negative(text: str):
    # Si ce test PASSE, c'est que la regex a été enrichie → basculer en TRUE_POSITIVE.
    result = scan(text, profile="adult")
    assert result["danger"] is True


def test_cta_differs_by_profile():
    minor = scan("je veux me tuer", profile="minor")
    adult = scan("je veux me tuer", profile="adult")
    assert minor["cta"]["phone"] == "119"
    assert adult["cta"]["phone"] != "119"


def test_unknown_profile_falls_back_to_adult():
    r = scan("je veux me tuer", profile="inconnu")
    assert r["cta"]["phone"] != "119"


def test_multiple_signals_accumulated():
    r = scan("il me frappe et me menace tous les jours", profile="adult")
    assert "violence" in r["signals"]
    assert "harassment" in r["signals"]


def test_case_insensitive():
    assert scan("JE VEUX ME TUER")["danger"] is True


def test_empty_signals_when_no_match():
    r = scan("bonjour")
    assert r["signals"] == []


# --- Tiers concerné : parent qui décrit l'enfant ----------------------------
# L'utilisateur n'est pas en danger lui-même mais s'inquiète d'un proche.
# `danger=False` (pas d'alerte admin) mais `cta` reste fournie en mode info.
THIRD_PARTY_CASES = [
    "ma fille n'arrête pas de fuguer",
    "mon fils a fugué hier soir",
    "mon ado fugue tous les week-ends",
    "mon enfant se scarifie, je ne sais plus quoi faire",
]


@pytest.mark.parametrize("text", THIRD_PARTY_CASES)
def test_third_party_downgrades_danger(text: str):
    r = scan(text, profile="adult")
    assert r["third_party"] is True, f"tiers non détecté : {text!r}"
    assert r["danger"] is False, f"alerte armée à tort sur tiers : {text!r}"
    assert r["signals"], "signaux toujours présents pour orienter la réponse"
    assert r["cta"] is not None, "CTA info à conserver pour le parent"


def test_first_person_victim_overrides_third_party_marker():
    # « ma mère me bat » : « ma mère » est un proche mais « me » indique
    # que l'utilisateur est la victime → on garde danger=True.
    r = scan("ma mère me frappe quand elle rentre", profile="adult")
    assert r["danger"] is True
    assert r["third_party"] is False
