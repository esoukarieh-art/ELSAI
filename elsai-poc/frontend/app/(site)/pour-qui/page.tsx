import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";
import {
  blockList,
  blockString,
  findBlock,
  getPageContent,
} from "@/lib/pageContent";

export const metadata: Metadata = {
  title: "Pour qui\u00A0? Adultes, 12-18 ans & employeurs",
  description:
    "ELSAI accompagne trois publics : les adultes (CAF, impôts, logement, MDPH…), les mineurs de 12 à 18 ans avec un protocole de sécurité, et les employeurs qui souhaitent équiper leurs salariés.",
  alternates: { canonical: "/pour-qui" },
};

interface LabelItem {
  label: string;
}

const FALLBACK_ADULT_ITEMS: LabelItem[] = [
  { label: "CAF, APL, RSA, prime d'activité" },
  { label: "Impôts, déclaration, contentieux" },
  { label: "Logement, expulsion, impayés" },
  { label: "Emploi, France Travail, formation" },
  { label: "Santé, CSS, AME, CPAM" },
  { label: "Surendettement, Banque de France" },
  { label: "Handicap, MDPH, AAH, RQTH" },
  { label: "Retraite, minimum vieillesse (ASPA)" },
];

const FALLBACK_MINOR_ITEMS: LabelItem[] = [
  { label: "Ce qui se passe à la maison" },
  { label: "L'école, le harcèlement, les notes" },
  { label: "Les amitiés, l'amour, les réseaux" },
  { label: "Votre corps, la santé, la contraception" },
  { label: "Vos droits (vous en avez plein\u00A0!)" },
  { label: "Quand ça ne va pas dans votre tête" },
  { label: "Les violences que vous subissez ou voyez" },
  { label: "Comment trouver de l'aide humaine" },
];

const FALLBACK_EMPLOYER_ITEMS: LabelItem[] = [
  { label: "Un avantage social différenciant" },
  { label: "Une alternative aux EAP classiques" },
  { label: "Réduire l'absentéisme lié aux démarches" },
  { label: "Soigner la marque employeur" },
  { label: "Une solution rapide à déployer" },
  { label: "Une confidentialité totale salariés" },
  { label: "Un coût maîtrisé (à partir de 3 €/mois)" },
  { label: "Un reporting anonymisé exploitable" },
];

type SP = { preview?: string; token?: string };

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SP> | SP;
}) {
  const sp = (searchParams ? await searchParams : undefined) ?? {};
  const previewEnabled = sp.preview === "1" && !!sp.token;

  const content = await getPageContent("pour-qui", {
    preview: previewEnabled,
    token: sp.token,
  });

  const hero = findBlock(content?.blocks, "hero");
  const adults = findBlock(content?.blocks, "adults");
  const minors = findBlock(content?.blocks, "minors");
  const employers = findBlock(content?.blocks, "employers");

  const heroEyebrow = blockString(hero, "eyebrow", "Pour qui\u00A0?");
  const heroTitle = blockString(
    hero,
    "title",
    "Trois parcours, une même promesse\u00A0: personne ne reste seul.",
  );
  const heroSubtitle = blockString(
    hero,
    "subtitle",
    "ELSAI parle différemment aux adultes, aux jeunes et aux entreprises qui veulent équiper leurs salariés. Chacun avec la bonne posture.",
  );

  const adultsEyebrow = blockString(adults, "eyebrow", "Parcours");
  const adultsTitle = blockString(adults, "title", "Adultes (18+)");
  const adultsIntro = blockString(
    adults,
    "intro",
    "Vouvoiement, ton clair et précis, priorité à l'action.",
  );
  const adultsCtaLabel = blockString(adults, "cta_label", "Commencer →");
  const adultsCtaHref = blockString(adults, "cta_href", "/start");
  const adultsHeading = blockString(
    adults,
    "heading",
    "Ce que vous pouvez nous demander",
  );
  const adultsItems = blockList<LabelItem>(adults, "items", FALLBACK_ADULT_ITEMS);
  const adultsFooter = blockString(
    adults,
    "footer",
    "Les situations d'urgence sont détectées et orientées vers le 115, le 3919, ou le 3114 selon le contexte.",
  );

  const minorsEyebrow = blockString(minors, "eyebrow", "Parcours");
  const minorsTitle = blockString(minors, "title", "12 → 18 ans");
  const minorsIntro = blockString(
    minors,
    "intro",
    "Vouvoiement par défaut, tutoiement si vous préférez. Espace bienveillant. On ne dit rien à vos parents — sauf si vous êtes en danger.",
  );
  const minorsCtaLabel = blockString(minors, "cta_label", "Parler à ELSAI →");
  const minorsCtaHref = blockString(minors, "cta_href", "/start");
  const minorsHeading = blockString(
    minors,
    "heading",
    "Vous pouvez nous parler de…",
  );
  const minorsItems = blockList<LabelItem>(minors, "items", FALLBACK_MINOR_ITEMS);
  const dangerTitle = blockString(
    minors,
    "danger_title",
    "Si vous êtes en danger maintenant\u00A0:",
  );
  const dangerBody = blockString(
    minors,
    "danger_body",
    "Appelez le 119 (Enfance en danger, 24h/24h, gratuit, anonyme). ELSAI vous le rappellera aussi si besoin.",
  );

  const empEyebrow = blockString(employers, "eyebrow", "Parcours");
  const empTitle = blockString(employers, "title", "Employeurs");
  const empIntro = blockString(
    employers,
    "intro",
    "Vouvoiement, ton business, orienté décision. Une offre claire pour équiper vos salariés d'un accueil social confidentiel.",
  );
  const empCtaLabel = blockString(employers, "cta_label", "Voir l'offre entreprises →");
  const empCtaHref = blockString(employers, "cta_href", "/offre");
  const empHeading = blockString(
    employers,
    "heading",
    "Ce que vous cherchez probablement",
  );
  const empItems = blockList<LabelItem>(employers, "items", FALLBACK_EMPLOYER_ITEMS);
  const empFooter = blockString(
    employers,
    "footer",
    "Trois formules (Essentiel, Premium, Sur mesure) selon la taille de votre structure. Tarification au siège, engagement 12 mois, facturation mensuelle ou annuelle.",
  );

  return (
    <>
      {previewEnabled && (
        <div className="bg-amber-500 text-center text-xs font-semibold uppercase tracking-wider text-white">
          Mode prévisualisation — brouillon non publié
        </div>
      )}

      <PageHero eyebrow={heroEyebrow} title={heroTitle}>
        {heroSubtitle}
      </PageHero>

      <Section id="adultes">
        <div className="grid items-start gap-8 md:grid-cols-[auto,1fr]">
          <div className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic p-8 md:sticky md:top-24">
            <p className="text-xs tracking-[0.2em] uppercase opacity-80">{adultsEyebrow}</p>
            <h2 className="mt-1 font-serif text-3xl">{adultsTitle}</h2>
            <p className="mt-3 leading-relaxed opacity-90">{adultsIntro}</p>
            {adultsCtaLabel && (
              <Link
                href={adultsCtaHref || "/start"}
                className="rounded-organic bg-elsai-creme text-elsai-pin-dark mt-5 inline-block px-5 py-3 font-semibold hover:bg-white"
              >
                {adultsCtaLabel}
              </Link>
            )}
          </div>
          <div className="space-y-6">
            <h3 className="text-elsai-pin-dark font-serif text-2xl">{adultsHeading}</h3>
            <ul className="text-elsai-ink/85 grid gap-3 sm:grid-cols-2">
              {adultsItems.map((x, i) => (
                <li
                  key={`${x.label}-${i}`}
                  className="rounded-organic border-elsai-pin/10 bg-elsai-creme border px-4 py-3"
                >
                  {x.label}
                </li>
              ))}
            </ul>
            {adultsFooter && (
              <p className="text-elsai-ink/70 text-sm">{adultsFooter}</p>
            )}
          </div>
        </div>
      </Section>

      <Section id="mineurs" tone="warm">
        <div className="grid items-start gap-8 md:grid-cols-[auto,1fr]">
          <div className="bg-elsai-rose text-elsai-creme rounded-organic shadow-warm p-8 md:sticky md:top-24">
            <p className="text-xs tracking-[0.2em] uppercase opacity-80">{minorsEyebrow}</p>
            <h2 className="mt-1 font-serif text-3xl">{minorsTitle}</h2>
            <p className="mt-3 leading-relaxed opacity-90">{minorsIntro}</p>
            {minorsCtaLabel && (
              <Link
                href={minorsCtaHref || "/start"}
                className="rounded-organic bg-elsai-creme text-elsai-rose-dark mt-5 inline-block px-5 py-3 font-semibold hover:bg-white"
              >
                {minorsCtaLabel}
              </Link>
            )}
          </div>
          <div className="space-y-6">
            <h3 className="text-elsai-rose-dark font-serif text-2xl">{minorsHeading}</h3>
            <ul className="text-elsai-ink/85 grid gap-3 sm:grid-cols-2">
              {minorsItems.map((x, i) => (
                <li
                  key={`${x.label}-${i}`}
                  className="rounded-organic border-elsai-rose/20 bg-elsai-creme border px-4 py-3"
                >
                  {x.label}
                </li>
              ))}
            </ul>
            {(dangerTitle || dangerBody) && (
              <div className="bg-elsai-urgence/10 border-elsai-urgence/30 rounded-organic text-elsai-ink border p-5 text-sm">
                {dangerTitle && (
                  <p className="text-elsai-urgence mb-1 font-semibold">{dangerTitle}</p>
                )}
                {dangerBody && <p>{dangerBody}</p>}
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section id="employeurs">
        <div className="grid items-start gap-8 md:grid-cols-[auto,1fr]">
          <div className="rounded-organic border-elsai-pin/20 bg-elsai-creme shadow-organic border p-8 md:sticky md:top-24">
            <p className="text-elsai-pin text-xs tracking-[0.2em] uppercase">{empEyebrow}</p>
            <h2 className="text-elsai-pin-dark mt-1 font-serif text-3xl">{empTitle}</h2>
            <p className="text-elsai-ink/80 mt-3 leading-relaxed">{empIntro}</p>
            {empCtaLabel && (
              <Link
                href={empCtaHref || "/offre"}
                className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark mt-5 inline-block px-5 py-3 font-semibold"
              >
                {empCtaLabel}
              </Link>
            )}
          </div>
          <div className="space-y-6">
            <h3 className="text-elsai-pin-dark font-serif text-2xl">{empHeading}</h3>
            <ul className="text-elsai-ink/85 grid gap-3 sm:grid-cols-2">
              {empItems.map((x, i) => (
                <li
                  key={`${x.label}-${i}`}
                  className="rounded-organic border-elsai-pin/15 bg-elsai-creme border px-4 py-3"
                >
                  {x.label}
                </li>
              ))}
            </ul>
            {empFooter && <p className="text-elsai-ink/70 text-sm">{empFooter}</p>}
          </div>
        </div>
      </Section>
    </>
  );
}
