"""Tests de la couche heuristique `services.safety`.

Objectif : verrouiller le comportement actuel (vrais positifs par catégorie)
et documenter les faux positifs connus pour guider l'enrichissement futur
des patterns (cf. roadmap #6).

Convention :
- Les cas `xfail` marquent des faux positifs/négatifs identifiés. Ils
  doivent devenir des `pass` quand les regex seront corrigées — ne pas
  simplement les supprimer.
"""
import pytest

from app.services.safety import _EMERGENCY_CTAS, scan


# ---------------------------------------------------------------------------
# Vrais positifs — chaque catégorie doit être détectée sur des formulations
# plausibles remontées en entretien.
# ---------------------------------------------------------------------------

SUICIDE_POSITIFS = [
    "je veux me tuer",
    "je pense au suicide depuis des semaines",
    "j'ai des idées suicidaires",
    "je veux en finir",
    "je n'ai plus envie de vivre",
    "je veux mourir",
]

VIOLENCE_POSITIFS = [
    "mon père me frappe quand il rentre",
    "il me tape dessus",
    "je me fais battre à la maison",
    "j'ai été violée l'an dernier",
    "c'est de la maltraitance",
]

ABUSE_POSITIFS = [
    "il me touche la nuit",
    "j'ai subi des attouchements",
    "c'est de l'inceste",
]

HARASSMENT_POSITIFS = [
    "je subis du harcèlement au collège",
    "il me menace tous les jours",
    "elle essaie de m'intimider",
]


@pytest.mark.parametrize("text", SUICIDE_POSITIFS)
def test_suicide_detecte(text):
    result = scan(text)
    assert result["danger"] is True
    assert "suicide" in result["signals"]


@pytest.mark.parametrize("text", VIOLENCE_POSITIFS)
def test_violence_detecte(text):
    result = scan(text)
    assert result["danger"] is True
    assert "violence" in result["signals"]


@pytest.mark.parametrize("text", ABUSE_POSITIFS)
def test_abuse_detecte(text):
    result = scan(text)
    assert result["danger"] is True
    assert "abuse" in result["signals"]


@pytest.mark.parametrize("text", HARASSMENT_POSITIFS)
def test_harassment_detecte(text):
    result = scan(text)
    assert result["danger"] is True
    assert "harassment" in result["signals"]


# ---------------------------------------------------------------------------
# Vrais négatifs — aucun danger ne doit remonter sur propos neutres.
# ---------------------------------------------------------------------------

NEUTRES = [
    "",
    "bonjour, comment ça va ?",
    "je cherche des aides pour payer mon loyer",
    "j'ai besoin de conseils pour trouver un emploi",
    "ma fille entre en 6e l'année prochaine",
    "je voudrais refaire mon CV",
]


@pytest.mark.parametrize("text", NEUTRES)
def test_neutre_pas_de_danger(text):
    result = scan(text)
    assert result["danger"] is False
    assert result["signals"] == []
    assert result["cta"] is None


# ---------------------------------------------------------------------------
# CTA selon profil.
# ---------------------------------------------------------------------------

def test_cta_mineur_renvoie_119():
    result = scan("je veux mourir", profile="minor")
    assert result["cta"] == _EMERGENCY_CTAS["minor"]
    assert result["cta"]["phone"] == "119"


def test_cta_adulte_renvoie_3114():
    result = scan("je veux mourir", profile="adult")
    assert result["cta"] == _EMERGENCY_CTAS["adult"]
    assert result["cta"]["phone"] == "3114"


def test_cta_profil_inconnu_fallback_adulte():
    result = scan("je veux mourir", profile="inconnu")
    assert result["cta"] == _EMERGENCY_CTAS["adult"]


# ---------------------------------------------------------------------------
# Multi-signaux : un message peut croiser plusieurs catégories.
# ---------------------------------------------------------------------------

def test_signaux_multiples():
    result = scan("mon père me frappe et je veux mourir")
    assert result["danger"] is True
    assert set(result["signals"]) >= {"violence", "suicide"}


# ---------------------------------------------------------------------------
# Faux positifs connus — documentés via xfail.
#
# Ces cas illustrent les limites des regex actuelles (cf. commentaire dans
# safety.py : "liste minimale non exhaustive"). Quand un pattern est durci,
# le xfail correspondant doit devenir un pass (retirer le décorateur).
# ---------------------------------------------------------------------------

FAUX_POSITIFS_CONNUS = [
    # `\btape\b` matche "tape" isolé → ambigu hors contexte violence
    ("je prends une tape de café le matin", "violence"),
    # `touche` est trop large : matche tout usage courant
    ("je ne touche plus à l'alcool", "abuse"),
    ("la touche entrée de mon clavier ne marche plus", "abuse"),
    # `menace` matche même au sens figuré
    ("la pluie menace de tomber ce soir", "harassment"),
]


@pytest.mark.parametrize("text,categorie", FAUX_POSITIFS_CONNUS)
@pytest.mark.xfail(
    reason="Faux positif connu — regex actuelle trop permissive (roadmap #6)",
    strict=True,
)
def test_faux_positifs_a_corriger(text, categorie):
    result = scan(text)
    assert categorie not in result["signals"]


# ---------------------------------------------------------------------------
# Faux négatifs connus — formulations qui devraient déclencher mais passent.
# ---------------------------------------------------------------------------

FAUX_NEGATIFS_CONNUS = [
    # Automutilation — absente des patterns actuels
    ("je me scarifie depuis des mois", "self_harm"),
    ("je me fais du mal la nuit", "self_harm"),
    # Troubles alimentaires
    ("je me fais vomir après chaque repas", "eating_disorder"),
    # Grooming / fugue — signalés dans la roadmap
    ("il m'a dit de pas en parler à mes parents", "grooming"),
    ("je vais fuguer cette nuit", "runaway"),
]


@pytest.mark.parametrize("text,categorie_attendue", FAUX_NEGATIFS_CONNUS)
@pytest.mark.xfail(
    reason="Catégorie non encore couverte par les patterns (roadmap #6)",
    strict=True,
)
def test_faux_negatifs_a_couvrir(text, categorie_attendue):
    result = scan(text)
    assert categorie_attendue in result["signals"]
