"""Seed initial du glossaire — sigles courants du droit social français."""

from sqlalchemy.orm import Session as DBSession

from ..models import GlossaryTerm

GLOSSARY_SEED = [
    {
        "slug": "rsa",
        "sigle": "RSA",
        "full_name": "Revenu de Solidarité Active",
        "definition_md": (
            "Allocation versée par la CAF (ou la MSA pour les agriculteurs) aux personnes "
            "majeures ayant peu ou pas de ressources. Calculée en fonction de la composition "
            "du foyer et des autres revenus. Demande en ligne sur caf.fr."
        ),
    },
    {
        "slug": "aah",
        "sigle": "AAH",
        "full_name": "Allocation aux Adultes Handicapés",
        "definition_md": (
            "Allocation versée par la CAF aux personnes en situation de handicap, après "
            "reconnaissance par la MDPH. Conditions de taux d'incapacité et de ressources. "
            "Cumul possible avec un revenu d'activité depuis 2022."
        ),
    },
    {
        "slug": "apl",
        "sigle": "APL",
        "full_name": "Aide Personnalisée au Logement",
        "definition_md": (
            "Aide au logement versée par la CAF pour les locataires (parc social ou privé "
            "conventionné) ou accédants à la propriété. Calculée selon ressources, loyer et "
            "composition du foyer."
        ),
    },
    {
        "slug": "mdph",
        "sigle": "MDPH",
        "full_name": "Maison Départementale des Personnes Handicapées",
        "definition_md": (
            "Guichet unique départemental pour toutes les demandes liées au handicap : AAH, "
            "PCH, RQTH, orientation scolaire ou professionnelle, carte mobilité inclusion. "
            "Une MDPH par département."
        ),
    },
    {
        "slug": "ase",
        "sigle": "ASE",
        "full_name": "Aide Sociale à l'Enfance",
        "definition_md": (
            "Service du département chargé de la protection des mineurs en danger ou en "
            "risque. Mesures éducatives à domicile, placement, accompagnement jeune majeur "
            "(jusqu'à 21 ans selon départements)."
        ),
    },
    {
        "slug": "caf",
        "sigle": "CAF",
        "full_name": "Caisse d'Allocations Familiales",
        "definition_md": (
            "Organisme qui verse les prestations familiales et sociales : RSA, APL, "
            "allocations familiales, prime d'activité, AAH (sauf MSA), allocation jeune "
            "enfant... Démarches en ligne sur caf.fr."
        ),
    },
    {
        "slug": "cmu-c",
        "sigle": "CMU-C",
        "full_name": "Couverture Maladie Universelle Complémentaire",
        "definition_md": (
            "Ancien nom de la Complémentaire Santé Solidaire (C2S). Mutuelle gratuite ou "
            "à 1€/jour selon ressources, pour la prise en charge des frais médicaux. "
            "Demande à la CPAM."
        ),
    },
    {
        "slug": "c2s",
        "sigle": "C2S",
        "full_name": "Complémentaire Santé Solidaire",
        "definition_md": (
            "Successeur de la CMU-C et de l'ACS depuis novembre 2019. Prise en charge des "
            "frais médicaux à 100%, gratuite ou à 1€/jour selon ressources. Demande à la "
            "CPAM."
        ),
    },
    {
        "slug": "fjt",
        "sigle": "FJT",
        "full_name": "Foyer Jeunes Travailleurs",
        "definition_md": (
            "Logement temporaire pour les 16-30 ans en insertion (apprentis, jeunes "
            "travailleurs, étudiants). Loyer modéré, accompagnement social. Convention APL "
            "souvent applicable."
        ),
    },
    {
        "slug": "rapo",
        "sigle": "RAPO",
        "full_name": "Recours Administratif Préalable Obligatoire",
        "definition_md": (
            "Recours à formuler avant tout recours juridictionnel contre une décision de la "
            "CAF, de Pôle Emploi, etc. Délai de 2 mois après notification. Lettre "
            "recommandée recommandée."
        ),
    },
    {
        "slug": "siao",
        "sigle": "SIAO",
        "full_name": "Service Intégré d'Accueil et d'Orientation",
        "definition_md": (
            "Plateforme départementale qui coordonne les demandes d'hébergement d'urgence "
            "et d'insertion. Joignable via le 115 pour les demandes urgentes."
        ),
    },
    {
        "slug": "dalo",
        "sigle": "DALO",
        "full_name": "Droit Au Logement Opposable",
        "definition_md": (
            "Dispositif permettant aux personnes prioritaires (mal-logées, sans logement) "
            "de saisir une commission départementale puis le tribunal administratif pour "
            "obtenir un logement social."
        ),
    },
    {
        "slug": "rqth",
        "sigle": "RQTH",
        "full_name": "Reconnaissance de la Qualité de Travailleur Handicapé",
        "definition_md": (
            "Statut accordé par la MDPH ouvrant droit à l'obligation d'emploi (OETH), à un "
            "accompagnement Cap Emploi, à des aménagements de poste, et à certaines aides "
            "AGEFIPH."
        ),
    },
    {
        "slug": "prime-activite",
        "sigle": "Prime d'activité",
        "full_name": "Prime d'activité",
        "definition_md": (
            "Complément de revenu versé par la CAF aux travailleurs (salariés ou "
            "indépendants) modestes. Cumulable avec un emploi. Demande en ligne sur "
            "caf.fr, simulation possible."
        ),
    },
    {
        "slug": "msa",
        "sigle": "MSA",
        "full_name": "Mutualité Sociale Agricole",
        "definition_md": (
            "Équivalent de la CAF + CPAM pour les exploitants et salariés agricoles. Verse "
            "les prestations familiales, le RSA, gère la santé et la retraite agricole."
        ),
    },
    {
        "slug": "cpam",
        "sigle": "CPAM",
        "full_name": "Caisse Primaire d'Assurance Maladie",
        "definition_md": (
            "Caisse locale de la Sécurité Sociale qui rembourse les frais médicaux, gère "
            "la C2S, l'arrêt de travail, le congé maternité. Démarches via ameli.fr."
        ),
    },
    {
        "slug": "pole-emploi",
        "sigle": "France Travail",
        "full_name": "France Travail (ex Pôle Emploi)",
        "definition_md": (
            "Service public de l'emploi depuis le 1er janvier 2024 (anciennement Pôle "
            "Emploi). Inscription obligatoire pour percevoir l'ARE. Accompagnement, "
            "formations, offres d'emploi."
        ),
    },
    {
        "slug": "are",
        "sigle": "ARE",
        "full_name": "Allocation d'aide au Retour à l'Emploi",
        "definition_md": (
            "Indemnisation chômage versée par France Travail. Conditions : avoir travaillé "
            "au moins 6 mois sur les 24 derniers (36 pour les 53 ans et plus), être "
            "involontairement privé d'emploi."
        ),
    },
    {
        "slug": "mission-locale",
        "sigle": "Mission Locale",
        "full_name": "Mission Locale",
        "definition_md": (
            "Structure d'accompagnement des 16-25 ans sortis du système scolaire. Aide à "
            "l'emploi, à la formation, au logement. Porte d'entrée pour le Contrat "
            "d'Engagement Jeune (CEJ)."
        ),
    },
    {
        "slug": "cej",
        "sigle": "CEJ",
        "full_name": "Contrat d'Engagement Jeune",
        "definition_md": (
            "Successeur de la Garantie Jeunes depuis mars 2022. Accompagnement intensif de "
            "15-20h/semaine pendant 6 à 12 mois, avec une allocation jusqu'à ~520€/mois "
            "selon ressources. Mission Locale ou France Travail."
        ),
    },
]


def seed_glossary(db: DBSession) -> None:
    for entry in GLOSSARY_SEED:
        existing = db.query(GlossaryTerm).filter_by(slug=entry["slug"]).first()
        if existing:
            continue
        db.add(
            GlossaryTerm(
                slug=entry["slug"],
                sigle=entry["sigle"],
                full_name=entry["full_name"],
                definition_md=entry["definition_md"],
            )
        )
    db.commit()
