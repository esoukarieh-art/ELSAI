import { NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import * as React from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLORS = {
  pin: "#5a7e6b",
  pinDark: "#3f5c4d",
  rose: "#9b7f7f",
  roseDark: "#6f5757",
  creme: "#f5f5ed",
  cremeDark: "#e8e8dc",
  ink: "#2c3b33",
  inkMuted: "#5a6e63",
};

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: COLORS.creme,
    padding: 36,
    fontSize: 10,
    color: COLORS.ink,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.pin,
  },
  logo: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLORS.pinDark,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 9,
    color: COLORS.inkMuted,
    fontFamily: "Helvetica-Oblique",
  },
  eyebrow: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.pin,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  h1: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLORS.pinDark,
    lineHeight: 1.15,
    marginBottom: 10,
  },
  h2: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: COLORS.pinDark,
    marginBottom: 8,
    marginTop: 14,
  },
  h3: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.pinDark,
    marginBottom: 4,
  },
  p: {
    lineHeight: 1.55,
    marginBottom: 6,
  },
  pSmall: {
    fontSize: 9,
    lineHeight: 1.5,
    color: COLORS.inkMuted,
  },
  strong: {
    fontFamily: "Helvetica-Bold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: COLORS.cremeDark,
    borderRadius: 6,
    padding: 10,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLORS.pinDark,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
    color: COLORS.inkMuted,
    lineHeight: 1.4,
  },
  cardRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  card: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: COLORS.cremeDark,
    borderRadius: 6,
    padding: 10,
  },
  tierRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  tier: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: COLORS.cremeDark,
    borderRadius: 6,
    padding: 10,
  },
  tierHighlight: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: COLORS.rose,
    borderRadius: 6,
    padding: 10,
  },
  tierName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.pin,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  tierNameRose: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.roseDark,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  tierPrice: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLORS.pinDark,
    marginTop: 4,
  },
  tierUnit: {
    fontSize: 8,
    color: COLORS.inkMuted,
    marginBottom: 6,
  },
  bullet: {
    fontSize: 9,
    lineHeight: 1.45,
    marginBottom: 2,
  },
  pillRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
  },
  pill: {
    backgroundColor: COLORS.pin,
    color: "white",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillSoft: {
    backgroundColor: COLORS.cremeDark,
    color: COLORS.ink,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ctaBox: {
    marginTop: 14,
    backgroundColor: COLORS.pin,
    borderRadius: 6,
    padding: 12,
  },
  ctaTitle: {
    color: "white",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  ctaText: {
    color: "white",
    fontSize: 9,
    opacity: 0.95,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLORS.inkMuted,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.cremeDark,
    paddingTop: 6,
  },
});

function Plaquette() {
  return React.createElement(
    Document,
    { title: "ELSAI — Offre entreprises", author: "ELSAI" },
    // Page 1 ----------------------------------------------------------
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.logo }, "ELSAI"),
        React.createElement(Text, { style: styles.tagline }, "Service social numérique de premier accueil"),
      ),

      React.createElement(Text, { style: styles.eyebrow }, "Offre entreprises"),
      React.createElement(
        Text,
        { style: styles.h1 },
        "Un service social pour vos salariés, sans service RH dédié.",
      ),
      React.createElement(
        Text,
        { style: styles.p },
        "ELSAI équipe vos équipes d'un accueil social confidentiel, disponible 24h/24. Un avantage social concret, ",
        React.createElement(Text, { style: styles.strong }, "à partir de 3 € par salarié et par mois"),
        ".",
      ),

      React.createElement(
        View,
        { style: styles.pillRow },
        React.createElement(Text, { style: styles.pill }, "SAS en cours d'agrément ESUS"),
        React.createElement(Text, { style: styles.pillSoft }, "Hébergé en France"),
        React.createElement(Text, { style: styles.pillSoft }, "Conforme RGPD"),
      ),

      React.createElement(Text, { style: styles.h2 }, "Le constat"),
      React.createElement(
        Text,
        { style: styles.p },
        "Un collaborateur sur trois renonce à des aides sociales auxquelles il a droit, faute d'information ou par manque de temps. Ces difficultés pèsent sur la sérénité au travail — et finissent par coûter à l'entreprise.",
      ),
      React.createElement(
        View,
        { style: styles.statsRow },
        React.createElement(
          View,
          { style: styles.statBox },
          React.createElement(Text, { style: styles.statValue }, "10 Md€"),
          React.createElement(Text, { style: styles.statLabel }, "d'aides sociales non réclamées chaque année"),
        ),
        React.createElement(
          View,
          { style: styles.statBox },
          React.createElement(Text, { style: styles.statValue }, "37 %"),
          React.createElement(Text, { style: styles.statLabel }, "des non-recours dus au manque d'information"),
        ),
        React.createElement(
          View,
          { style: styles.statBox },
          React.createElement(Text, { style: styles.statValue }, "34 %"),
          React.createElement(Text, { style: styles.statLabel }, "des ayants droit au RSA ne le demandent pas"),
        ),
        React.createElement(
          View,
          { style: styles.statBox },
          React.createElement(Text, { style: styles.statValue }, "44 %"),
          React.createElement(Text, { style: styles.statLabel }, "des ayants droit à la CSS non plus"),
        ),
      ),
      React.createElement(Text, { style: styles.pSmall }, "Source : DREES, enquête 2022 sur le non-recours."),

      React.createElement(Text, { style: styles.h2 }, "Ce qu'ELSAI apporte à vos salariés"),
      React.createElement(
        View,
        { style: styles.cardRow },
        React.createElement(
          View,
          { style: styles.card },
          React.createElement(Text, { style: styles.h3 }, "Accessible 24h/24"),
          React.createElement(Text, { style: styles.pSmall }, "Une réponse tout de suite, sans rendez-vous."),
        ),
        React.createElement(
          View,
          { style: styles.card },
          React.createElement(Text, { style: styles.h3 }, "Anonymat total"),
          React.createElement(Text, { style: styles.pSmall }, "Codes d'accès personnels. Ni employeur ni ELSAI ne savent qui pose quoi."),
        ),
        React.createElement(
          View,
          { style: styles.card },
          React.createElement(Text, { style: styles.h3 }, "Supervisée par AS diplômé·es"),
          React.createElement(Text, { style: styles.pSmall }, "Pas un chatbot générique — vérifié par des pros."),
        ),
      ),

      React.createElement(Text, { style: styles.h2 }, "Trois formules, tarification au siège"),
      React.createElement(
        View,
        { style: styles.tierRow },
        React.createElement(
          View,
          { style: styles.tier },
          React.createElement(Text, { style: styles.tierName }, "Essentiel"),
          React.createElement(Text, { style: styles.pSmall }, "PME 10-49 salariés"),
          React.createElement(Text, { style: styles.tierPrice }, "3 €"),
          React.createElement(Text, { style: styles.tierUnit }, "/ salarié / mois HT"),
          React.createElement(Text, { style: styles.bullet }, "• Chatbot IA illimité"),
          React.createElement(Text, { style: styles.bullet }, "• 2 consultations / sal / an"),
          React.createElement(Text, { style: styles.bullet }, "• Reporting trimestriel"),
          React.createElement(Text, { style: styles.bullet }, "• Kit communication interne"),
        ),
        React.createElement(
          View,
          { style: styles.tierHighlight },
          React.createElement(Text, { style: styles.tierNameRose }, "Premium ★"),
          React.createElement(Text, { style: styles.pSmall }, "PME & ETI 50-499 sal."),
          React.createElement(Text, { style: styles.tierPrice }, "5 €"),
          React.createElement(Text, { style: styles.tierUnit }, "/ salarié / mois HT"),
          React.createElement(Text, { style: styles.bullet }, "• Chatbot IA illimité"),
          React.createElement(Text, { style: styles.bullet }, "• 6 consultations / sal / an"),
          React.createElement(Text, { style: styles.bullet }, "• Reporting mensuel"),
          React.createElement(Text, { style: styles.bullet }, "• Permanence 1/2j / mois"),
          React.createElement(Text, { style: styles.bullet }, "• 2 ateliers collectifs / an"),
        ),
        React.createElement(
          View,
          { style: styles.tier },
          React.createElement(Text, { style: styles.tierName }, "Sur mesure"),
          React.createElement(Text, { style: styles.pSmall }, "ETI & grands groupes 500+"),
          React.createElement(Text, { style: styles.tierPrice }, "Sur devis"),
          React.createElement(Text, { style: styles.tierUnit }, "tarification négociée"),
          React.createElement(Text, { style: styles.bullet }, "• Chatbot IA illimité"),
          React.createElement(Text, { style: styles.bullet }, "• Consultations selon besoin"),
          React.createElement(Text, { style: styles.bullet }, "• Reporting temps réel"),
          React.createElement(Text, { style: styles.bullet }, "• Ateliers illimités"),
          React.createElement(Text, { style: styles.bullet }, "• Intégration SIRH possible"),
        ),
      ),

      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(Text, null, "ELSAI — contact@elsai.fr — elsai.fr/offre"),
        React.createElement(Text, null, "1 / 2"),
      ),
    ),

    // Page 2 ----------------------------------------------------------
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.logo }, "ELSAI"),
        React.createElement(Text, { style: styles.tagline }, "Service social numérique de premier accueil"),
      ),

      React.createElement(Text, { style: styles.h2 }, "Bénéfices pour l'entreprise"),
      React.createElement(
        View,
        { style: styles.cardRow },
        React.createElement(
          View,
          { style: styles.card },
          React.createElement(Text, { style: styles.h3 }, "Moins d'absentéisme"),
          React.createElement(Text, { style: styles.pSmall }, "Les soucis sociaux non résolus sont une cause majeure d'arrêts et de baisse de productivité."),
        ),
        React.createElement(
          View,
          { style: styles.card },
          React.createElement(Text, { style: styles.h3 }, "Attractivité employeur"),
          React.createElement(Text, { style: styles.pSmall }, "Un avantage social rare dans les PME. Signal fort pour la marque employeur."),
        ),
        React.createElement(
          View,
          { style: styles.card },
          React.createElement(Text, { style: styles.h3 }, "Confidentialité totale"),
          React.createElement(Text, { style: styles.pSmall }, "Reporting agrégé anonymisé uniquement. Aucun salarié identifiable, jamais."),
        ),
      ),

      React.createElement(Text, { style: styles.h2 }, "Déploiement en moins de 2 semaines"),
      React.createElement(
        View,
        { style: styles.cardRow },
        React.createElement(
          View,
          { style: styles.card },
          React.createElement(Text, { style: styles.h3 }, "1. Contrat & codes"),
          React.createElement(Text, { style: styles.pSmall }, "Signature puis envoi d'un lot de codes personnels pour vos équipes."),
        ),
        React.createElement(
          View,
          { style: styles.card },
          React.createElement(Text, { style: styles.h3 }, "2. Communication"),
          React.createElement(Text, { style: styles.pSmall }, "Kit prêt à l'emploi : affiche, email type, message Slack / Teams."),
        ),
        React.createElement(
          View,
          { style: styles.card },
          React.createElement(Text, { style: styles.h3 }, "3. Usage confidentiel"),
          React.createElement(Text, { style: styles.pSmall }, "Vos salariés utilisent ELSAI. Vous recevez un reporting anonymisé."),
        ),
      ),

      React.createElement(Text, { style: styles.h2 }, "Ce que vous ne verrez jamais"),
      React.createElement(
        Text,
        { style: styles.p },
        "L'identité de vos salariés qui utilisent ELSAI. Le reporting que vous recevez est exclusivement agrégé et anonymisé : taux d'utilisation global, grandes thématiques, évolution dans le temps. Cette règle est ",
        React.createElement(Text, { style: styles.strong }, "non négociable"),
        " — c'est ce qui rend le service réellement utile pour vos équipes.",
      ),

      React.createElement(Text, { style: styles.h2 }, "Questions fréquentes"),
      React.createElement(Text, { style: styles.h3 }, "Quelle différence avec un EAP classique ?"),
      React.createElement(
        Text,
        { style: styles.p },
        "Les EAP sont centrés sur le soutien psychologique. ELSAI est spécialisée sur les droits sociaux et les démarches administratives : logement, CAF, surendettement, santé, handicap, parentalité. C'est complémentaire.",
      ),
      React.createElement(Text, { style: styles.h3 }, "Où sont hébergées les données ?"),
      React.createElement(
        Text,
        { style: styles.p },
        "En France, chez un hébergeur souverain. Aucune donnée n'est transférée hors de l'Union européenne. Conformité RGPD documentée sur la page éthique.",
      ),
      React.createElement(Text, { style: styles.h3 }, "Peut-on tester avant de s'engager ?"),
      React.createElement(
        Text,
        { style: styles.p },
        "Oui. Nous proposons une phase pilote de 3 mois sur un périmètre réduit (un service, un site) pour évaluer l'adoption avant déploiement plus large.",
      ),

      React.createElement(
        View,
        { style: styles.ctaBox },
        React.createElement(Text, { style: styles.ctaTitle }, "Discutons de votre besoin en 20 minutes"),
        React.createElement(
          Text,
          { style: styles.ctaText },
          "contact@elsai.fr · elsai.fr/offre · Demande de devis : elsai.fr/contact?sujet=offre-entreprise",
        ),
      ),

      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(Text, null, "ELSAI — contact@elsai.fr — elsai.fr/offre"),
        React.createElement(Text, null, "2 / 2"),
      ),
    ),
  );
}

export async function GET() {
  const buffer = await renderToBuffer(Plaquette() as unknown as React.ReactElement);
  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="ELSAI-offre-entreprises.pdf"',
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
