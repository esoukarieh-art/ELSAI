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
    "j'aimerais disparaître pour toujours",
    "je ne veux plus être là",
    "il me cogne quand il rentre",
    "ma mère me bat quand elle a bu",  # "bat" seul non matché (regex exige bats/battu/battre)
    "je subis de la maltraitance depuis l'enfance",  # \bmaltrait\b bloque le suffixe -ance
    "il y a eu des attouchements",  # \battouch\b bloque le suffixe -ements
    "mon conjoint me gifle régulièrement",
    "j'ai envie de sauter du pont",
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
