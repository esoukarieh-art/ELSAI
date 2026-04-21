import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";
import PriceCalculator from "@/components/site/PriceCalculator";
import OffreToc from "@/components/site/OffreToc";
import {
  blockList,
  blockString,
  findBlock,
  getPageContent,
} from "@/lib/pageContent";

export const metadata: Metadata = {
  title: "Offre entreprises — Un service social pour vos salariés",
  description:
    "Offrez à vos équipes un accueil social confidentiel, disponible 24h/24h. À partir de 3 € par salarié et par mois. Anonymat garanti, hébergé en France.",
  alternates: { canonical: "/offre" },
};

// --- Types & fallbacks ------------------------------------------------------

interface Stat {
  chiffre: string;
  label: string;
}
interface TitleBodyItem {
  title: string;
  body: string;
}
interface TarifItem {
  nom: string;
  cible: string;
  prix: string;
  prix_unit: string;
  highlight?: string;
  engagement: string;
  cta_label: string;
  cta_href: string;
  inclus: string;
}
interface EtapeItem {
  num: string;
  titre: string;
  texte: string;
}
interface FaqItem {
  question: string;
  answer: string;
}

const FALLBACK_STATS: Stat[] = [
  { chiffre: "10 Md€", label: "d'aides sociales non réclamées chaque année en France" },
  { chiffre: "37 %", label: "des non-recours sont dus au manque d'information" },
  { chiffre: "34 %", label: "des ayants droit au RSA ne le demandent pas" },
  { chiffre: "44 %", label: "des ayants droit à la Complémentaire Santé Solidaire non plus" },
];

const FALLBACK_SALARIES: TitleBodyItem[] = [
  { title: "Accessible 24h/24h, 7j/7", body: "Une question administrative à 22h un dimanche ? Vos salariés obtiennent une réponse tout de suite, sans attendre un rendez-vous." },
  { title: "Anonymat total", body: "Vos salariés utilisent un code d'accès personnel. Ni vous ni nous ne savons qui pose quelle question." },
  { title: "IA supervisée par des assistantes sociales", body: "Ce n'est pas un chatbot générique. Les réponses sont construites et vérifiées par des professionnelles diplômées d'État." },
  { title: "Orientation vers les services publics", body: "ELSAI ne remplace pas le service social : elle clarifie la situation et oriente vers le bon interlocuteur (CAF, CPAM, CCAS, MDPH…)." },
];

const FALLBACK_ENTREPRISE: TitleBodyItem[] = [
  { title: "Moins d'absentéisme", body: "Les soucis de logement, de dette ou de famille sont une cause majeure d'arrêts et de baisse de productivité. ELSAI aide à les résoudre plus vite." },
  { title: "Un avantage social différenciant", body: "Rare dans les PME. Un signal fort pour la marque employeur, au même titre qu'une mutuelle renforcée ou un programme QVT." },
  { title: "Confidentialité totale", body: "Vous recevez uniquement des statistiques agrégées anonymisées. Aucun salarié n'est identifiable, jamais." },
  { title: "Coût maîtrisé", body: "À partir de 3 € par salarié et par mois, sans surprise. Bien en deçà du coût d'un service social interne." },
];

const FALLBACK_TARIFS: TarifItem[] = [
  {
    nom: "Essentiel",
    cible: "PME de 10 à 49 salariés",
    prix: "3 €",
    prix_unit: "par salarié / mois HT",
    highlight: "false",
    engagement: "Engagement 12 mois",
    cta_label: "Souscrire",
    cta_href: "/offre/souscrire?plan=essentiel",
    inclus:
      "Accès illimité au chatbot IA (codes salariés)\n2 consultations humaines par salarié / an\nReporting anonymisé trimestriel\nKit de communication interne fourni",
  },
  {
    nom: "Premium",
    cible: "PME & ETI de 50 à 499 salariés",
    prix: "5 €",
    prix_unit: "par salarié / mois HT",
    highlight: "true",
    engagement: "Engagement 12 mois",
    cta_label: "Souscrire",
    cta_href: "/offre/souscrire?plan=premium",
    inclus:
      "Accès illimité au chatbot IA (codes salariés)\n6 consultations humaines par salarié / an\nReporting anonymisé mensuel\n1 demi-journée de permanence sur site / mois\n2 ateliers collectifs / an (droits, budget, parentalité…)",
  },
  {
    nom: "Sur mesure",
    cible: "ETI & grands groupes (500+)",
    prix: "Sur devis",
    prix_unit: "tarification négociée",
    highlight: "false",
    engagement: "Engagement 24 mois",
    cta_label: "Parlons-en",
    cta_href: "/contact?sujet=offre-sur-mesure",
    inclus:
      "Accès illimité au chatbot IA (codes salariés)\nConsultations humaines selon besoin\nReporting anonymisé temps réel\nPermanence sur site selon besoin\nAteliers collectifs illimités\nIntégration SIRH possible",
  },
];

const FALLBACK_ETAPES: EtapeItem[] = [
  { num: "01", titre: "Contrat & codes d'accès", texte: "Nous signons le contrat, vous recevez un lot de codes d'accès personnels à distribuer à vos équipes." },
  { num: "02", titre: "Communication interne", texte: "Nous vous fournissons un kit prêt à l'emploi (affiche, email type, message Slack/Teams) pour annoncer le service." },
  { num: "03", titre: "Vos salariés utilisent ELSAI", texte: "Depuis leur téléphone ou leur ordinateur, à tout moment, en toute confidentialité. Vous recevez un reporting anonymisé." },
];

const FALLBACK_FAQ: FaqItem[] = [
  { question: "Comment est garantie la confidentialité vis-à-vis de l'employeur ?", answer: "Chaque salarié dispose d'un code d'accès personnel. Aucune donnée nominative n'est transmise à l'employeur. Le reporting que vous recevez ne contient que des statistiques agrégées (thématiques les plus consultées, taux d'utilisation global)." },
  { question: "Où sont hébergées les données ?", answer: "En France, chez un hébergeur souverain. Aucune donnée n'est transférée hors de l'Union européenne. Nos pratiques sont conformes au RGPD et détaillées sur notre page éthique." },
  { question: "Quelle est la différence avec un EAP (Employee Assistance Program) classique ?", answer: "Les EAP sont centrés sur le soutien psychologique. ELSAI est spécialisée sur les droits sociaux et les démarches administratives : logement, CAF, surendettement, santé, handicap, parentalité. C'est complémentaire." },
  { question: "Que se passe-t-il si un salarié a besoin d'un suivi long ?", answer: "ELSAI est un service de premier accueil. Pour les situations qui nécessitent un accompagnement dans la durée, nous orientons systématiquement vers le service compétent (CCAS, service social départemental, association spécialisée)." },
  { question: "Comment se passe la facturation ?", answer: "Facturation mensuelle ou annuelle, par virement SEPA ou prélèvement. Vous recevez une facture conforme chaque mois, exploitable directement par votre service comptable." },
  { question: "Peut-on tester avant de s'engager ?", answer: "Oui. Nous proposons une phase pilote de 3 mois sur un périmètre réduit (un service, un site) pour évaluer l'adoption et l'impact avant déploiement plus large." },
];

// Comparatif reste hardcodé (structure complexe, valeur éditoriale faible)
type Crit = { label: string; elsai: boolean | string; public: boolean | string; eap: boolean | string; chatbot: boolean | string };

const COMPARATIF: Crit[] = [
  { label: "Accessible 24h/24h", elsai: true, public: false, eap: "Heures bureau", chatbot: true },
  { label: "Expertise droits sociaux FR", elsai: true, public: true, eap: "Limitée", chatbot: false },
  { label: "Supervisé par AS diplômé·es", elsai: true, public: true, eap: "Variable", chatbot: false },
  { label: "Gratuit pour le salarié", elsai: true, public: "Avec délai", eap: true, chatbot: true },
  { label: "Anonymat total employeur", elsai: true, public: true, eap: "Variable", chatbot: true },
  { label: "Sans rendez-vous préalable", elsai: true, public: false, eap: false, chatbot: true },
  { label: "Réorientation vers services publics", elsai: true, public: true, eap: "Partiel", chatbot: "Partiel" },
  { label: "Tarif PME accessible", elsai: "3 €/sal/mois", public: "—", eap: "Élevé", chatbot: "Variable" },
];

function CellValue({ v }: { v: boolean | string }) {
  if (v === true) return <span className="text-elsai-pin font-semibold">✓</span>;
  if (v === false) return <span className="text-elsai-ink/30">—</span>;
  return <span className="text-elsai-ink/75 text-xs">{v}</span>;
}

type SP = { preview?: string; token?: string };

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SP> | SP;
}) {
  const sp = (searchParams ? await searchParams : undefined) ?? {};
  const previewEnabled = sp.preview === "1" && !!sp.token;

  const content = await getPageContent("offre", {
    preview: previewEnabled,
    token: sp.token,
  });

  const hero = findBlock(content?.blocks, "hero");
  const constat = findBlock(content?.blocks, "constat");
  const salaries = findBlock(content?.blocks, "salaries");
  const entreprise = findBlock(content?.blocks, "entreprise");
  const tarifs = findBlock(content?.blocks, "tarifs");
  const deploiement = findBlock(content?.blocks, "deploiement");
  const faqBlock = findBlock(content?.blocks, "faq");
  const finalCta = findBlock(content?.blocks, "final_cta");

  const heroEyebrow = blockString(hero, "eyebrow", "Offre entreprises");
  const heroTitle = blockString(
    hero,
    "title",
    "Un service social pour vos salariés, sans service RH dédié.",
  );
  const heroSubtitle = blockString(
    hero,
    "subtitle",
    "ELSAI équipe vos équipes d'un accueil social confidentiel, disponible 24h/24h. Un avantage social concret, à partir de 3 € par salarié et par mois.",
  );

  const constatEyebrow = blockString(constat, "eyebrow", "Le constat");
  const constatTitle = blockString(
    constat,
    "title",
    "Vos salariés aussi passent à côté de leurs droits.",
  );
  const constatBody = blockString(
    constat,
    "body",
    "Un collaborateur sur trois renonce à des aides sociales auxquelles il a droit, faute d'information ou par manque de temps pour faire les démarches. Ces difficultés pèsent sur la sérénité au travail — et finissent par vous coûter.",
  );
  const constatSource = blockString(
    constat,
    "source",
    "Source : DREES, enquête 2022 sur le non-recours aux prestations sociales.",
  );
  const stats = blockList<Stat>(constat, "stats", FALLBACK_STATS);

  const salariesEyebrow = blockString(salaries, "eyebrow", "Pour vos salariés");
  const salariesTitle = blockString(
    salaries,
    "title",
    "Un accueil social qu'ils n'auront trouvé nulle part ailleurs.",
  );
  const salariesItems = blockList<TitleBodyItem>(salaries, "items", FALLBACK_SALARIES);

  const entrepriseEyebrow = blockString(entreprise, "eyebrow", "Pour votre entreprise");
  const entrepriseTitle = blockString(
    entreprise,
    "title",
    "Un bénéfice concret, mesurable, différenciant.",
  );
  const entrepriseItems = blockList<TitleBodyItem>(
    entreprise,
    "items",
    FALLBACK_ENTREPRISE,
  );

  const tarifsEyebrow = blockString(tarifs, "eyebrow", "Tarifs");
  const tarifsTitle = blockString(
    tarifs,
    "title",
    "Trois formules, un principe\u00A0: la transparence.",
  );
  const tarifsIntro = blockString(
    tarifs,
    "intro",
    "Tarification au siège salarié, sans frais cachés. Tous les prix sont hors taxes.",
  );
  const tarifsFooter = blockString(
    tarifs,
    "footer",
    "Facturation mensuelle ou annuelle (remise −10% en annuel). Paiement par virement SEPA ou prélèvement. TVA 20% en sus.",
  );
  const tarifsItems = blockList<TarifItem>(tarifs, "items", FALLBACK_TARIFS);

  const deployEyebrow = blockString(deploiement, "eyebrow", "Déploiement");
  const deployTitle = blockString(
    deploiement,
    "title",
    "Opérationnel en moins de deux semaines.",
  );
  const etapes = blockList<EtapeItem>(deploiement, "items", FALLBACK_ETAPES);

  const faqEyebrow = blockString(faqBlock, "eyebrow", "Questions fréquentes");
  const faqTitle = blockString(
    faqBlock,
    "title",
    "Ce que les DRH nous demandent souvent.",
  );
  const faqItems = blockList<FaqItem>(faqBlock, "items", FALLBACK_FAQ);

  const finalTitle = blockString(
    finalCta,
    "title",
    "Discutons de votre besoin en 20 minutes.",
  );
  const finalBody = blockString(
    finalCta,
    "body",
    "Chaque entreprise a ses spécificités : taille, métiers, contraintes RH. Nous adaptons l'offre et démarrons souvent par une phase pilote sur un périmètre réduit.",
  );
  const finalCtaLabel = blockString(finalCta, "cta_label", "Demander un devis →");
  const finalCtaHref = blockString(finalCta, "cta_href", "/contact?sujet=offre-entreprise");

  return (
    <>
      {previewEnabled && (
        <div className="bg-amber-500 text-center text-xs font-semibold uppercase tracking-wider text-white">
          Mode prévisualisation — brouillon non publié
        </div>
      )}

      {/* Sommaire sticky (xl+) */}
      <div
        aria-hidden={false}
        className="pointer-events-none fixed top-0 right-0 z-30 hidden h-screen w-60 xl:block"
      >
        <div className="pointer-events-auto flex h-full items-center pr-6">
          <OffreToc />
        </div>
      </div>

      <PageHero eyebrow={heroEyebrow} title={heroTitle}>
        {heroSubtitle}
      </PageHero>

      <Section>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/contact?sujet=offre-entreprise"
            className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark inline-flex items-center gap-2 px-6 py-3.5 font-semibold"
          >
            Demander un devis →
          </Link>
          <Link
            href="#tarifs"
            className="text-elsai-pin-dark hover:bg-elsai-pin/5 rounded-organic border-elsai-pin/30 inline-flex items-center gap-2 border px-5 py-3 text-sm font-semibold"
          >
            Voir les tarifs
          </Link>
          <a
            href="/api/plaquette"
            download="ELSAI-offre-entreprises.pdf"
            className="text-elsai-pin-dark hover:bg-elsai-pin/5 rounded-organic border-elsai-pin/30 inline-flex items-center gap-2 border px-5 py-3 text-sm font-semibold"
          >
            Télécharger la plaquette (PDF)
          </a>
          <span className="bg-elsai-pin/10 text-elsai-pin-dark rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide">
            SAS en cours d'agrément ESUS
          </span>
          <span className="bg-elsai-rose/10 text-elsai-rose-dark rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide">
            Hébergé en France
          </span>
          <span className="bg-elsai-creme-dark/50 text-elsai-ink/80 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide">
            Conforme RGPD
          </span>
        </div>
      </Section>

      <Section tone="soft" id="constat">
        <div className="max-w-3xl">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            {constatEyebrow}
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">
            {constatTitle}
          </h2>
          <p className="text-elsai-ink/85 mt-5 leading-relaxed">{constatBody}</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={`${s.label}-${i}`}
              className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-6"
            >
              <p className="text-elsai-pin-dark font-serif text-3xl md:text-4xl">{s.chiffre}</p>
              <p className="text-elsai-ink/75 mt-2 text-sm leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>
        {constatSource && (
          <p className="text-elsai-ink/60 mt-6 text-xs">{constatSource}</p>
        )}
      </Section>

      <Section id="salaries">
        <div className="max-w-3xl">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            {salariesEyebrow}
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">
            {salariesTitle}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {salariesItems.map((b, i) => (
            <div
              key={`${b.title}-${i}`}
              className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-7"
            >
              <h3 className="text-elsai-pin-dark font-serif text-xl">{b.title}</h3>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="soft" id="entreprise">
        <div className="max-w-3xl">
          <p className="text-elsai-rose-dark text-xs font-semibold tracking-[0.2em] uppercase">
            {entrepriseEyebrow}
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">
            {entrepriseTitle}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {entrepriseItems.map((b, i) => (
            <div
              key={`${b.title}-${i}`}
              className="rounded-organic border-elsai-rose/25 bg-elsai-creme border p-7"
            >
              <h3 className="text-elsai-pin-dark font-serif text-xl">{b.title}</h3>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="tarifs">
        <div className="max-w-3xl scroll-mt-24">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            {tarifsEyebrow}
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">
            {tarifsTitle}
          </h2>
          <p className="text-elsai-ink/85 mt-5 leading-relaxed">{tarifsIntro}</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {tarifsItems.map((o) => {
            const isHighlight = String(o.highlight).toLowerCase() === "true";
            const inclusLines = (o.inclus || "")
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean);
            return (
              <div
                key={o.nom}
                className={`rounded-organic flex flex-col border p-7 ${
                  isHighlight
                    ? "border-elsai-rose/40 bg-elsai-creme shadow-organic relative"
                    : "border-elsai-pin/15 bg-elsai-creme"
                }`}
              >
                {isHighlight && (
                  <span className="bg-elsai-rose-dark text-elsai-creme absolute -top-3 left-7 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                    Le plus choisi
                  </span>
                )}
                <p
                  className={`text-xs font-semibold tracking-widest uppercase ${
                    isHighlight ? "text-elsai-rose-dark" : "text-elsai-pin"
                  }`}
                >
                  {o.nom}
                </p>
                <p className="text-elsai-ink/70 mt-1 text-sm">{o.cible}</p>
                <div className="mt-5">
                  <p className="text-elsai-pin-dark font-serif text-4xl">{o.prix}</p>
                  <p className="text-elsai-ink/60 mt-1 text-xs">{o.prix_unit}</p>
                </div>
                <ul className="text-elsai-ink/85 mt-6 flex-1 space-y-2.5 text-sm">
                  {inclusLines.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className={isHighlight ? "text-elsai-rose-dark" : "text-elsai-pin"}>
                        ✓
                      </span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-elsai-ink/60 mt-6 text-xs">{o.engagement}</p>
                <Link
                  href={o.cta_href || "#"}
                  className={`rounded-organic mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold transition-colors ${
                    isHighlight
                      ? "bg-elsai-rose-dark text-elsai-creme hover:bg-elsai-rose-dark/90"
                      : "bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark"
                  }`}
                >
                  {o.cta_label} →
                </Link>
              </div>
            );
          })}
        </div>

        {tarifsFooter && (
          <p className="text-elsai-ink/60 mt-6 text-xs">{tarifsFooter}</p>
        )}
      </Section>

      <Section tone="soft" id="simulateur">
        <div className="max-w-3xl scroll-mt-24">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">Simulateur</p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">
            Estimez le coût en quelques secondes.
          </h2>
        </div>
        <div className="mt-8">
          <PriceCalculator />
        </div>
      </Section>

      <Section id="comparatif">
        <div className="max-w-3xl scroll-mt-24">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            Comparatif
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">
            ELSAI vs les alternatives du marché.
          </h2>
          <p className="text-elsai-ink/85 mt-5 leading-relaxed">
            Nous ne prétendons pas remplacer les services sociaux publics ni les EAP.
            Nous occupons une place complémentaire&nbsp;: celle du premier accueil immédiat,
            spécialisé droits sociaux.
          </p>
        </div>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="text-left">
                <th className="text-elsai-ink/60 py-3 pr-4 text-xs font-semibold tracking-wider uppercase">
                  Critère
                </th>
                <th className="bg-elsai-pin text-elsai-creme rounded-t-organic py-3 text-center text-xs font-semibold tracking-wider uppercase">
                  ELSAI
                </th>
                <th className="text-elsai-ink/70 py-3 text-center text-xs font-semibold tracking-wider uppercase">
                  Services publics
                </th>
                <th className="text-elsai-ink/70 py-3 text-center text-xs font-semibold tracking-wider uppercase">
                  EAP classique
                </th>
                <th className="text-elsai-ink/70 py-3 text-center text-xs font-semibold tracking-wider uppercase">
                  Chatbot généraliste
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARATIF.map((c, i) => (
                <tr
                  key={c.label}
                  className={i % 2 === 0 ? "bg-elsai-creme/60" : "bg-transparent"}
                >
                  <td className="text-elsai-ink py-3 pr-4">{c.label}</td>
                  <td className="bg-elsai-pin/5 py-3 text-center">
                    <CellValue v={c.elsai} />
                  </td>
                  <td className="py-3 text-center">
                    <CellValue v={c.public} />
                  </td>
                  <td className="py-3 text-center">
                    <CellValue v={c.eap} />
                  </td>
                  <td className="py-3 text-center">
                    <CellValue v={c.chatbot} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section tone="soft" id="deploiement">
        <div className="max-w-3xl scroll-mt-24">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            {deployEyebrow}
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">
            {deployTitle}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {etapes.map((e, i) => (
            <div
              key={`${e.num}-${i}`}
              className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-7"
            >
              <p className="text-elsai-pin/60 font-serif text-2xl">{e.num}</p>
              <h3 className="text-elsai-pin-dark mt-2 font-serif text-xl">{e.titre}</h3>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{e.texte}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-organic border-elsai-pin/20 bg-elsai-creme border p-8 md:p-10">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            Ils nous feront confiance
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-2xl md:text-3xl">
            Bientôt, les premières entreprises partenaires.
          </h2>
          <p className="text-elsai-ink/85 mt-4 leading-relaxed">
            ELSAI est en phase de lancement. Nous constituons actuellement notre premier cercle
            d'entreprises pionnières sur une phase pilote de 3 mois, avec des conditions préférentielles.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-elsai-pin/15 bg-elsai-creme-dark/20 flex h-20 items-center justify-center rounded border border-dashed"
              >
                <span className="text-elsai-ink/40 text-xs uppercase tracking-wider">
                  Votre logo ici
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/contact?sujet=offre-entreprise"
            className="text-elsai-pin-dark mt-6 inline-block text-sm font-semibold hover:underline"
          >
            Rejoindre le cercle pionnier →
          </Link>
        </div>
      </Section>

      <Section>
        <div className="rounded-organic border-elsai-pin/20 bg-elsai-creme border p-8 md:p-10">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            Ce que vous ne verrez jamais
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-2xl md:text-3xl">
            L'identité de vos salariés qui utilisent ELSAI.
          </h2>
          <p className="text-elsai-ink/85 mt-4 leading-relaxed">
            La confidentialité est au cœur du service. Vous ne saurez jamais qui consulte, sur
            quel sujet, à quel moment. Notre reporting se limite à des statistiques agrégées&nbsp;:
            taux d'utilisation global, grandes thématiques, évolution dans le temps. Cette règle
            est non négociable — c'est ce qui rend le service réellement utile pour vos équipes.
          </p>
        </div>
      </Section>

      <Section tone="soft" id="faq">
        <div className="max-w-3xl scroll-mt-24">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            {faqEyebrow}
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">{faqTitle}</h2>
        </div>
        <div className="mt-10 space-y-3">
          {faqItems.map((f, i) => (
            <details
              key={`${f.question}-${i}`}
              className="rounded-organic border-elsai-pin/15 bg-elsai-creme group border p-6"
            >
              <summary className="text-elsai-pin-dark cursor-pointer font-serif text-lg">
                {f.question}
              </summary>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{f.answer}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section tone="warm" id="contact">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-elsai-pin-dark font-serif text-3xl">{finalTitle}</h2>
            <p className="text-elsai-ink/85 mt-4 leading-relaxed">{finalBody}</p>
            {finalCtaLabel && (
              <Link
                href={finalCtaHref || "/contact?sujet=offre-entreprise"}
                className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark mt-6 inline-flex items-center gap-2 px-6 py-3.5 font-semibold"
              >
                {finalCtaLabel}
              </Link>
            )}
          </div>
          <dl className="rounded-organic border-elsai-pin/10 bg-elsai-creme space-y-4 border p-7">
            <div>
              <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                Tarif de départ
              </dt>
              <dd>3 € / salarié / mois HT — offre Essentiel</dd>
            </div>
            <div>
              <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                Délai de mise en place
              </dt>
              <dd>2 semaines entre la signature et l'accès salariés</dd>
            </div>
            <div>
              <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                Agrément
              </dt>
              <dd>SAS en cours d'agrément ESUS (Entreprise Solidaire d'Utilité Sociale)</dd>
            </div>
          </dl>
        </div>
      </Section>
    </>
  );
}
