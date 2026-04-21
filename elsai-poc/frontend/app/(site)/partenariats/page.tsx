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
  title: "Partenariats — Construisons l'impact ensemble",
  description:
    "ELSAI se déploie en complémentarité des services sociaux publics. CCAS, collectivités, associations, France Services : construisons ensemble un relais numérique utile à vos usagers.",
  alternates: { canonical: "/partenariats" },
};

interface TitleBodyItem {
  title: string;
  body: string;
}
interface FormatItem {
  title: string;
  body: string;
  cost: string;
}

const FALLBACK_ENGAGEMENTS: TitleBodyItem[] = [
  { title: "Réorientation systématique", body: "Nous ne gardons pas l'usager chez nous. ELSAI oriente vers le bon service (CAF, CPAM, CCAS, France Services) avec un dossier déjà clarifié." },
  { title: "Transparence des pratiques", body: "Nos règles éthiques, notre gouvernance et nos sources de financement sont publiques. ELSAI est portée par un binôme assistante sociale diplômée + ingénieur." },
  { title: "Désengorgement des accueils", body: "En répondant aux questions simples de premier niveau, nous permettons à vos équipes de se concentrer sur l'accompagnement humain qui compte." },
  { title: "Donnée souveraine", body: "Hébergement en France, conformité RGPD, aucun transfert hors UE. Nous pouvons co-signer les engagements vis-à-vis de vos tutelles." },
];

const FALLBACK_CIBLES: TitleBodyItem[] = [
  { title: "CCAS & services sociaux départementaux", body: "Un relais 24h/24h pour répondre aux questions de premier niveau et libérer du temps aux travailleurs sociaux sur les accompagnements à forte valeur ajoutée." },
  { title: "France Services & maisons de services au public", body: "Un outil complémentaire pour prolonger l'accompagnement au-delà des heures d'ouverture et préparer les rendez-vous avec un dossier déjà clarifié." },
  { title: "Associations sociales & caritatives", body: "Pour les structures qui orientent déjà des publics vulnérables, ELSAI apporte une réponse immédiate sur les droits, en français clair." },
  { title: "Collectivités territoriales", body: "Dans le cadre des dispositifs «\u00A0Territoires zéro non-recours\u00A0», ELSAI peut être déployée comme brique numérique complémentaire." },
];

const FALLBACK_FORMATS: FormatItem[] = [
  { title: "Lien simple", body: "Renvoi depuis votre site vers ELSAI, sans intégration technique.", cost: "Gratuit" },
  { title: "Co-branding", body: "Page d'accueil aux couleurs partenaire, parcours dédié pour vos usagers.", cost: "À discuter" },
  { title: "Intégration métier", body: "Intégration dans votre SI ou votre portail usager, reporting dédié.", cost: "Sur devis" },
];

type SP = { preview?: string; token?: string };

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SP> | SP;
}) {
  const sp = (searchParams ? await searchParams : undefined) ?? {};
  const previewEnabled = sp.preview === "1" && !!sp.token;

  const content = await getPageContent("partenariats", {
    preview: previewEnabled,
    token: sp.token,
  });

  const hero = findBlock(content?.blocks, "hero");
  const pos = findBlock(content?.blocks, "positionnement");
  const cibles = findBlock(content?.blocks, "cibles");
  const formats = findBlock(content?.blocks, "formats");
  const entrepriseCta = findBlock(content?.blocks, "entreprise_cta");
  const finalCta = findBlock(content?.blocks, "final_cta");

  const heroEyebrow = blockString(hero, "eyebrow", "Partenariats");
  const heroTitle = blockString(hero, "title", "Construisons l'impact ensemble.");
  const heroSubtitle = blockString(
    hero,
    "subtitle",
    "ELSAI est un projet d'intérêt général qui se déploie en complémentarité des services sociaux publics. Nous ne remplaçons pas\u00A0: nous renforçons l'accès au droit.",
  );

  const posEyebrow = blockString(pos, "eyebrow", "Notre positionnement");
  const posTitle = blockString(
    pos,
    "title",
    "Un relais, pas un concurrent des services sociaux traditionnels.",
  );
  const posBody = blockString(
    pos,
    "body",
    "Le non-recours aux droits sociaux ne se résoudra pas avec un seul outil. ELSAI se pense comme un filtre de premier niveau qui prépare le terrain, et qui oriente vers vos services quand un accompagnement humain est nécessaire.",
  );
  const engagements = blockList<TitleBodyItem>(pos, "items", FALLBACK_ENGAGEMENTS);

  const ciblesEyebrow = blockString(cibles, "eyebrow", "À qui nous nous adressons");
  const ciblesTitle = blockString(
    cibles,
    "title",
    "Les structures avec qui nous souhaitons travailler.",
  );
  const ciblesItems = blockList<TitleBodyItem>(cibles, "items", FALLBACK_CIBLES);

  const formatsEyebrow = blockString(formats, "eyebrow", "Formats de partenariat");
  const formatsTitle = blockString(
    formats,
    "title",
    "Plusieurs niveaux d'intégration, selon vos besoins.",
  );
  const formatsItems = blockList<FormatItem>(formats, "items", FALLBACK_FORMATS);

  const entEyebrow = blockString(
    entrepriseCta,
    "eyebrow",
    "Vous êtes une entreprise\u00A0?",
  );
  const entTitle = blockString(
    entrepriseCta,
    "title",
    "Une offre dédiée pour équiper vos salariés d'un accueil social confidentiel.",
  );
  const entBody = blockString(
    entrepriseCta,
    "body",
    "Si vous représentez une entreprise qui souhaite proposer ELSAI à ses collaborateurs, une offre distincte existe à partir de 3 € par salarié et par mois.",
  );
  const entCtaLabel = blockString(entrepriseCta, "cta_label", "Voir l'offre entreprises →");
  const entCtaHref = blockString(entrepriseCta, "cta_href", "/offre");

  const finalTitle = blockString(finalCta, "title", "Discutons de votre projet");
  const finalBody = blockString(
    finalCta,
    "body",
    "Chaque territoire, chaque structure a ses spécificités. Nous co-construisons le format le plus adapté, et nous démarrons souvent par une expérimentation sur un périmètre réduit avant tout déploiement plus large.",
  );
  const finalCtaLabel = blockString(finalCta, "cta_label", "Prendre contact →");
  const finalCtaHref = blockString(
    finalCta,
    "cta_href",
    "/contact?sujet=partenariat-institutionnel",
  );
  const infoFormat = blockString(
    finalCta,
    "info_format",
    "Conventions sur mesure, expérimentations territoriales",
  );
  const infoConfidentialite = blockString(
    finalCta,
    "info_confidentialite",
    "Anonymat usager garanti — données agrégées uniquement",
  );
  const infoStatut = blockString(
    finalCta,
    "info_statut",
    "SAS en cours d'agrément ESUS, hébergement souverain France",
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

      <Section>
        <div className="max-w-3xl">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            {posEyebrow}
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">{posTitle}</h2>
          <p className="text-elsai-ink/85 mt-5 leading-relaxed">{posBody}</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {engagements.map((e, i) => (
            <div
              key={`${e.title}-${i}`}
              className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-7"
            >
              <h3 className="text-elsai-pin-dark font-serif text-xl">{e.title}</h3>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{e.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="soft">
        <div className="max-w-3xl">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            {ciblesEyebrow}
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">
            {ciblesTitle}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {ciblesItems.map((p, i) => (
            <div
              key={`${p.title}-${i}`}
              className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-7"
            >
              <h3 className="text-elsai-pin-dark font-serif text-xl">{p.title}</h3>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="max-w-3xl">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            {formatsEyebrow}
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">
            {formatsTitle}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {formatsItems.map((f, i) => (
            <div
              key={`${f.title}-${i}`}
              className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-7"
            >
              <h3 className="text-elsai-pin-dark font-serif text-xl">{f.title}</h3>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{f.body}</p>
              <p className="text-elsai-pin mt-4 text-sm font-semibold">{f.cost}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="soft">
        <div className="rounded-organic border-elsai-rose/25 bg-elsai-creme border p-8 md:p-10">
          <p className="text-elsai-rose-dark text-xs font-semibold tracking-[0.2em] uppercase">
            {entEyebrow}
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-2xl md:text-3xl">{entTitle}</h2>
          <p className="text-elsai-ink/85 mt-4 leading-relaxed">{entBody}</p>
          {entCtaLabel && (
            <Link
              href={entCtaHref || "/offre"}
              className="rounded-organic border-elsai-rose-dark/30 text-elsai-rose-dark hover:bg-elsai-rose/10 mt-5 inline-flex items-center gap-2 border px-5 py-3 text-sm font-semibold"
            >
              {entCtaLabel}
            </Link>
          )}
        </div>
      </Section>

      <Section tone="warm">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-elsai-pin-dark font-serif text-3xl">{finalTitle}</h2>
            <p className="text-elsai-ink/85 mt-4 leading-relaxed">{finalBody}</p>
            {finalCtaLabel && (
              <Link
                href={finalCtaHref || "/contact?sujet=partenariat-institutionnel"}
                className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark mt-6 inline-flex items-center gap-2 px-6 py-3.5 font-semibold"
              >
                {finalCtaLabel}
              </Link>
            )}
          </div>
          <dl className="rounded-organic border-elsai-pin/10 bg-elsai-creme space-y-4 border p-7">
            <div>
              <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                Format
              </dt>
              <dd>{infoFormat}</dd>
            </div>
            <div>
              <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                Confidentialité
              </dt>
              <dd>{infoConfidentialite}</dd>
            </div>
            <div>
              <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                Statut
              </dt>
              <dd>{infoStatut}</dd>
            </div>
          </dl>
        </div>
      </Section>
    </>
  );
}
