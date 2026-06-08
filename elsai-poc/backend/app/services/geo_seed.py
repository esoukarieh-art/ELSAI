"""Seed des départements français (96 métropole + DOM) et droits/situations."""

from sqlalchemy.orm import Session as DBSession

from ..models import Department, LifeSituation, Right

DEPARTMENTS = [
    ("01", "Ain", "ain", "Bourg-en-Bresse", "Auvergne-Rhône-Alpes"),
    ("02", "Aisne", "aisne", "Laon", "Hauts-de-France"),
    ("03", "Allier", "allier", "Moulins", "Auvergne-Rhône-Alpes"),
    (
        "04",
        "Alpes-de-Haute-Provence",
        "alpes-de-haute-provence",
        "Digne-les-Bains",
        "Provence-Alpes-Côte d'Azur",
    ),
    ("05", "Hautes-Alpes", "hautes-alpes", "Gap", "Provence-Alpes-Côte d'Azur"),
    ("06", "Alpes-Maritimes", "alpes-maritimes", "Nice", "Provence-Alpes-Côte d'Azur"),
    ("07", "Ardèche", "ardeche", "Privas", "Auvergne-Rhône-Alpes"),
    ("08", "Ardennes", "ardennes", "Charleville-Mézières", "Grand Est"),
    ("09", "Ariège", "ariege", "Foix", "Occitanie"),
    ("10", "Aube", "aube", "Troyes", "Grand Est"),
    ("11", "Aude", "aude", "Carcassonne", "Occitanie"),
    ("12", "Aveyron", "aveyron", "Rodez", "Occitanie"),
    ("13", "Bouches-du-Rhône", "bouches-du-rhone", "Marseille", "Provence-Alpes-Côte d'Azur"),
    ("14", "Calvados", "calvados", "Caen", "Normandie"),
    ("15", "Cantal", "cantal", "Aurillac", "Auvergne-Rhône-Alpes"),
    ("16", "Charente", "charente", "Angoulême", "Nouvelle-Aquitaine"),
    ("17", "Charente-Maritime", "charente-maritime", "La Rochelle", "Nouvelle-Aquitaine"),
    ("18", "Cher", "cher", "Bourges", "Centre-Val de Loire"),
    ("19", "Corrèze", "correze", "Tulle", "Nouvelle-Aquitaine"),
    ("21", "Côte-d'Or", "cote-dor", "Dijon", "Bourgogne-Franche-Comté"),
    ("22", "Côtes-d'Armor", "cotes-darmor", "Saint-Brieuc", "Bretagne"),
    ("23", "Creuse", "creuse", "Guéret", "Nouvelle-Aquitaine"),
    ("24", "Dordogne", "dordogne", "Périgueux", "Nouvelle-Aquitaine"),
    ("25", "Doubs", "doubs", "Besançon", "Bourgogne-Franche-Comté"),
    ("26", "Drôme", "drome", "Valence", "Auvergne-Rhône-Alpes"),
    ("27", "Eure", "eure", "Évreux", "Normandie"),
    ("28", "Eure-et-Loir", "eure-et-loir", "Chartres", "Centre-Val de Loire"),
    ("29", "Finistère", "finistere", "Quimper", "Bretagne"),
    ("2A", "Corse-du-Sud", "corse-du-sud", "Ajaccio", "Corse"),
    ("2B", "Haute-Corse", "haute-corse", "Bastia", "Corse"),
    ("30", "Gard", "gard", "Nîmes", "Occitanie"),
    ("31", "Haute-Garonne", "haute-garonne", "Toulouse", "Occitanie"),
    ("32", "Gers", "gers", "Auch", "Occitanie"),
    ("33", "Gironde", "gironde", "Bordeaux", "Nouvelle-Aquitaine"),
    ("34", "Hérault", "herault", "Montpellier", "Occitanie"),
    ("35", "Ille-et-Vilaine", "ille-et-vilaine", "Rennes", "Bretagne"),
    ("36", "Indre", "indre", "Châteauroux", "Centre-Val de Loire"),
    ("37", "Indre-et-Loire", "indre-et-loire", "Tours", "Centre-Val de Loire"),
    ("38", "Isère", "isere", "Grenoble", "Auvergne-Rhône-Alpes"),
    ("39", "Jura", "jura", "Lons-le-Saunier", "Bourgogne-Franche-Comté"),
    ("40", "Landes", "landes", "Mont-de-Marsan", "Nouvelle-Aquitaine"),
    ("41", "Loir-et-Cher", "loir-et-cher", "Blois", "Centre-Val de Loire"),
    ("42", "Loire", "loire", "Saint-Étienne", "Auvergne-Rhône-Alpes"),
    ("43", "Haute-Loire", "haute-loire", "Le Puy-en-Velay", "Auvergne-Rhône-Alpes"),
    ("44", "Loire-Atlantique", "loire-atlantique", "Nantes", "Pays de la Loire"),
    ("45", "Loiret", "loiret", "Orléans", "Centre-Val de Loire"),
    ("46", "Lot", "lot", "Cahors", "Occitanie"),
    ("47", "Lot-et-Garonne", "lot-et-garonne", "Agen", "Nouvelle-Aquitaine"),
    ("48", "Lozère", "lozere", "Mende", "Occitanie"),
    ("49", "Maine-et-Loire", "maine-et-loire", "Angers", "Pays de la Loire"),
    ("50", "Manche", "manche", "Saint-Lô", "Normandie"),
    ("51", "Marne", "marne", "Châlons-en-Champagne", "Grand Est"),
    ("52", "Haute-Marne", "haute-marne", "Chaumont", "Grand Est"),
    ("53", "Mayenne", "mayenne", "Laval", "Pays de la Loire"),
    ("54", "Meurthe-et-Moselle", "meurthe-et-moselle", "Nancy", "Grand Est"),
    ("55", "Meuse", "meuse", "Bar-le-Duc", "Grand Est"),
    ("56", "Morbihan", "morbihan", "Vannes", "Bretagne"),
    ("57", "Moselle", "moselle", "Metz", "Grand Est"),
    ("58", "Nièvre", "nievre", "Nevers", "Bourgogne-Franche-Comté"),
    ("59", "Nord", "nord", "Lille", "Hauts-de-France"),
    ("60", "Oise", "oise", "Beauvais", "Hauts-de-France"),
    ("61", "Orne", "orne", "Alençon", "Normandie"),
    ("62", "Pas-de-Calais", "pas-de-calais", "Arras", "Hauts-de-France"),
    ("63", "Puy-de-Dôme", "puy-de-dome", "Clermont-Ferrand", "Auvergne-Rhône-Alpes"),
    ("64", "Pyrénées-Atlantiques", "pyrenees-atlantiques", "Pau", "Nouvelle-Aquitaine"),
    ("65", "Hautes-Pyrénées", "hautes-pyrenees", "Tarbes", "Occitanie"),
    ("66", "Pyrénées-Orientales", "pyrenees-orientales", "Perpignan", "Occitanie"),
    ("67", "Bas-Rhin", "bas-rhin", "Strasbourg", "Grand Est"),
    ("68", "Haut-Rhin", "haut-rhin", "Colmar", "Grand Est"),
    ("69", "Rhône", "rhone", "Lyon", "Auvergne-Rhône-Alpes"),
    ("70", "Haute-Saône", "haute-saone", "Vesoul", "Bourgogne-Franche-Comté"),
    ("71", "Saône-et-Loire", "saone-et-loire", "Mâcon", "Bourgogne-Franche-Comté"),
    ("72", "Sarthe", "sarthe", "Le Mans", "Pays de la Loire"),
    ("73", "Savoie", "savoie", "Chambéry", "Auvergne-Rhône-Alpes"),
    ("74", "Haute-Savoie", "haute-savoie", "Annecy", "Auvergne-Rhône-Alpes"),
    ("75", "Paris", "paris", "Paris", "Île-de-France"),
    ("76", "Seine-Maritime", "seine-maritime", "Rouen", "Normandie"),
    ("77", "Seine-et-Marne", "seine-et-marne", "Melun", "Île-de-France"),
    ("78", "Yvelines", "yvelines", "Versailles", "Île-de-France"),
    ("79", "Deux-Sèvres", "deux-sevres", "Niort", "Nouvelle-Aquitaine"),
    ("80", "Somme", "somme", "Amiens", "Hauts-de-France"),
    ("81", "Tarn", "tarn", "Albi", "Occitanie"),
    ("82", "Tarn-et-Garonne", "tarn-et-garonne", "Montauban", "Occitanie"),
    ("83", "Var", "var", "Toulon", "Provence-Alpes-Côte d'Azur"),
    ("84", "Vaucluse", "vaucluse", "Avignon", "Provence-Alpes-Côte d'Azur"),
    ("85", "Vendée", "vendee", "La Roche-sur-Yon", "Pays de la Loire"),
    ("86", "Vienne", "vienne", "Poitiers", "Nouvelle-Aquitaine"),
    ("87", "Haute-Vienne", "haute-vienne", "Limoges", "Nouvelle-Aquitaine"),
    ("88", "Vosges", "vosges", "Épinal", "Grand Est"),
    ("89", "Yonne", "yonne", "Auxerre", "Bourgogne-Franche-Comté"),
    ("90", "Territoire de Belfort", "territoire-de-belfort", "Belfort", "Bourgogne-Franche-Comté"),
    ("91", "Essonne", "essonne", "Évry", "Île-de-France"),
    ("92", "Hauts-de-Seine", "hauts-de-seine", "Nanterre", "Île-de-France"),
    ("93", "Seine-Saint-Denis", "seine-saint-denis", "Bobigny", "Île-de-France"),
    ("94", "Val-de-Marne", "val-de-marne", "Créteil", "Île-de-France"),
    ("95", "Val-d'Oise", "val-doise", "Pontoise", "Île-de-France"),
    ("971", "Guadeloupe", "guadeloupe", "Basse-Terre", "Guadeloupe"),
    ("972", "Martinique", "martinique", "Fort-de-France", "Martinique"),
    ("973", "Guyane", "guyane", "Cayenne", "Guyane"),
    ("974", "La Réunion", "la-reunion", "Saint-Denis", "La Réunion"),
    ("976", "Mayotte", "mayotte", "Mamoudzou", "Mayotte"),
]

RIGHTS_SEED = [
    (
        "rsa",
        "Revenu de Solidarité Active",
        "Allocation pour majeurs sans ou avec peu de ressources, versée par la CAF/MSA. Calcul selon foyer et ressources.",
    ),
    (
        "aah",
        "Allocation aux Adultes Handicapés",
        "Allocation pour personnes en situation de handicap, après reconnaissance MDPH. Cumul possible avec un revenu d'activité.",
    ),
    (
        "apl",
        "Aide Personnalisée au Logement",
        "Aide au logement versée par la CAF, conditionnée aux ressources, au loyer et à la composition du foyer.",
    ),
    (
        "prime-activite",
        "Prime d'activité",
        "Complément de revenu pour travailleurs modestes, versé par la CAF.",
    ),
    (
        "are",
        "Allocation d'aide au Retour à l'Emploi",
        "Indemnisation chômage de France Travail, sous conditions d'activité antérieure.",
    ),
    (
        "cej",
        "Contrat d'Engagement Jeune",
        "Accompagnement intensif 16-25 ans, allocation jusqu'à ~520€/mois selon ressources, via Mission Locale ou France Travail.",
    ),
    (
        "c2s",
        "Complémentaire Santé Solidaire",
        "Mutuelle gratuite ou à 1€/jour, à demander à la CPAM.",
    ),
    (
        "dalo",
        "Droit Au Logement Opposable",
        "Recours pour personnes prioritaires en attente d'un logement social.",
    ),
    (
        "contrat-jeune-majeur",
        "Contrat Jeune Majeur (ASE)",
        "Prolongation de l'accompagnement ASE après 18 ans, à demander avant la majorité, selon départements.",
    ),
    (
        "rqth",
        "Reconnaissance Travailleur Handicapé",
        "Statut MDPH ouvrant droit à OETH, Cap Emploi, aménagements de poste.",
    ),
]

SITUATIONS_SEED = [
    (
        "jeune-majeur-isole",
        "Jeune majeur isolé",
        "adult",
        "Vous venez d'avoir 18 ans, vous êtes seul·e, sans ressources, parfois sortant de l'ASE.",
    ),
    (
        "sortie-ase",
        "Sortie de l'ASE",
        "adult",
        "Vous êtes accompagné·e par l'Aide Sociale à l'Enfance et la fin de la mesure approche, ou vient d'avoir lieu.",
    ),
    (
        "parent-isole",
        "Parent isolé",
        "adult",
        "Vous êtes seul·e à charge d'un ou plusieurs enfants.",
    ),
    (
        "recours-refus-caf",
        "Recours après un refus CAF",
        "adult",
        "La CAF vous a refusé un droit (RSA, APL...) et vous voulez contester.",
    ),
    (
        "perte-emploi",
        "Perte d'emploi récente",
        "adult",
        "Vous venez de perdre votre travail (licenciement, fin de CDD, démission).",
    ),
    (
        "logement-urgence",
        "Sans logement / hébergement d'urgence",
        "adult",
        "Vous n'avez pas où dormir ce soir ou pour les jours à venir.",
    ),
    (
        "handicap-recente",
        "Reconnaissance handicap en cours",
        "adult",
        "Vous avez déposé un dossier MDPH ou envisagez de le faire.",
    ),
    (
        "etudiant-precaire",
        "Étudiant·e en précarité",
        "adult",
        "Vous étudiez et n'arrivez plus à boucler vos fins de mois.",
    ),
]


def seed_departments(db: DBSession) -> None:
    for code, name, slug, prefecture, region in DEPARTMENTS:
        existing = db.query(Department).filter_by(code=code).first()
        if existing:
            continue
        db.add(Department(code=code, name=name, slug=slug, prefecture=prefecture, region=region))
    for slug, name, desc in RIGHTS_SEED:
        existing = db.query(Right).filter_by(slug=slug).first()
        if existing:
            continue
        db.add(Right(slug=slug, name=name, description_md=desc))
    for slug, name, profile, ctx in SITUATIONS_SEED:
        existing = db.query(LifeSituation).filter_by(slug=slug).first()
        if existing:
            continue
        db.add(LifeSituation(slug=slug, name=name, profile=profile, context_md=ctx))
    db.commit()
