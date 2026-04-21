import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Section from "@/components/site/Section";
import {
  blockList,
  blockString,
  findBlock,
  getPageContent,
  resolveImageUrl,
} from "@/lib/pageContent";

export const metadata: Metadata = {
  title: "ELSAI — Service social numérique de premier accueil",
  description:
    "Assistant social numérique qui répond à vos questions administratives, sociales, familiales ou juridiques. Anonymement, sans rendez-vous, sans jugement. CAF, logement, emploi, MDPH, jeunes 12-18 ans.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ELSAI — Service social numérique de premier accueil",
    description:
      "Assistant social numérique qui répond à vos questions administratives, sociales, familiales ou juridiques. Anonymement, sans rendez-vous, sans jugement.",
    url: "/",
  },
};

// --- Fallback : contenu utilisé si l'API CMS est indisponible ---------------

const FALLBACK_CAS = [
  {
    tag: "À 18 ans",
    title: "Comprendre mes droits quand je deviens majeur·e",
    body: "Aide pour comprendre la CAF, la sécu, le logement étudiant, les aides jeunesse.",
  },
  {
    tag: "RSA refusé",
    title: "On m'a refusé le RSA, est-ce normal\u00A0?",
    body: "On relit ensemble la lettre, on vérifie vos droits, on prépare un recours.",
  },
  {
    tag: "Ado en difficulté",
    title: "Ça ne va pas à la maison ou au collège",
    body: "Un espace anonyme pour poser des mots. Sans jugement, sans dossier.",
  },
  {
    tag: "Logement d'urgence",
    title: "Je n'ai pas où dormir ce soir",
    body: "Les numéros utiles, les démarches immédiates, les lieux près de chez vous.",
  },
];

const FALLBACK_DIFF = [
  {
    title: "Anonyme par défaut",
    body: "Aucun nom, aucun email requis. Vous pouvez tout effacer en un clic, sans laisser de trace.",
  },
  {
    title: "Sans rendez-vous, sans déplacement",
    body: "Pour une question simple ou un conseil, pas besoin de prendre rendez-vous ni de vous déplacer. Vous posez votre question quand vous pouvez, d'où vous voulez.",
  },
  {
    title: "Sans le regard de l'autre",
    body: "Certaines situations sont difficiles à formuler en face d'un professionnel. Ici, vous pouvez prendre le temps, sans être jugé·e, sans avoir à justifier.",
  },
  {
    title: "Empathique et franc",
    body: "On vous écoute vraiment. Et si un droit n'existe pas, on vous le dit clairement — pas de faux espoirs.",
  },
];

interface CaseItem {
  tag: string;
  title: string;
  body: string;
}
interface DiffItem {
  title: string;
  body: string;
}

type SP = { preview?: string; token?: string };

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<SP> | SP;
}) {
  const sp = (searchParams ? await searchParams : undefined) ?? {};
  const previewEnabled = sp.preview === "1" && !!sp.token;

  const content = await getPageContent("home", {
    preview: previewEnabled,
    token: sp.token,
  });

  const hero = findBlock(content?.blocks, "hero");
  const diffBlock = findBlock(content?.blocks, "differentiators");
  const useCasesBlock = findBlock(content?.blocks, "use_cases");
  const forWhom = findBlock(content?.blocks, "for_whom");
  const employer = findBlock(content?.blocks, "employer");
  const finalCta = findBlock(content?.blocks, "final_cta");

  // Hero
  const heroEyebrow = blockString(hero, "eyebrow", "Service social numérique de premier accueil");
  const heroTitle = blockString(hero, "title", "Assistant social numérique");
  const heroSubtitle = blockString(
    hero,
    "subtitle",
    "Répond à toutes vos questions administratives, sociales, familiales ou juridiques et vous oriente vers le bon interlocuteur si besoin.",
  );
  const heroNote = blockString(hero, "note", "Anonymement. Sans rendez-vous. Sans jugement.");
  const ctaPrimaryLabel = blockString(hero, "cta_primary_label", "Poser ma question →");
  const ctaPrimaryHref = blockString(hero, "cta_primary_href", "/start");
  const ctaSecondaryLabel = blockString(hero, "cta_secondary_label", "Comment ça marche");
  const ctaSecondaryHref = blockString(hero, "cta_secondary_href", "/comment-ca-marche");
  const trustLine = blockString(
    hero,
    "trust_line",
    "✓ Sans inscription · ✓ Hébergé en France · ✓ Sans cookies",
  );
  const heroImage = resolveImageUrl(blockString(hero, "image_url", "/logo-elsai.svg"));
  const heroAlt = blockString(hero, "image_alt", "");

  // Differentiators
  const diffTitle = blockString(
    diffBlock,
    "title",
    "Un service accessible 24h/24h, créé par une assistante sociale diplômée.",
  );
  const diffItems = blockList<DiffItem>(diffBlock, "items", FALLBACK_DIFF);

  // Use cases
  const useCasesTitle = blockString(useCasesBlock, "title", "À quoi ça sert concrètement ?");
  const useCasesLinkLabel = blockString(
    useCasesBlock,
    "link_label",
    "Voir tous les exemples →",
  );
  const useCasesLinkHref = blockString(useCasesBlock, "link_href", "/exemples-concrets");
  const useCases = blockList<CaseItem>(useCasesBlock, "items", FALLBACK_CAS);

  // For whom
  const adultsTitle = blockString(forWhom, "adults_title", "Pour les adultes");
  const adultsBody = blockString(
    forWhom,
    "adults_body",
    "CAF, impôts, logement, emploi, surendettement, MDPH… On vous parle clairement, sans jargon, et on vous guide étape par étape.",
  );
  const adultsLinkLabel = blockString(forWhom, "adults_link_label", "Votre parcours →");
  const adultsLinkHref = blockString(forWhom, "adults_link_href", "/pour-qui#adultes");
  const minorsTitle = blockString(forWhom, "minors_title", "Pour les 12-18 ans");
  const minorsBody = blockString(
    forWhom,
    "minors_body",
    "Vos droits, l'école, la famille, ce qui ne va pas. On vous écoute, et si vous préférez qu'on vous tutoie, il suffit de le dire. Si c'est grave, on vous oriente vers le 119 ou une Maison des Ados.",
  );
  const minorsLinkLabel = blockString(forWhom, "minors_link_label", "Votre espace →");
  const minorsLinkHref = blockString(forWhom, "minors_link_href", "/pour-qui#mineurs");

  // Employer
  const employerEyebrow = blockString(employer, "eyebrow", "Vous êtes employeur ?");
  const employerTitle = blockString(
    employer,
    "title",
    "Offrez ELSAI à vos salariés, à partir de 3 € par mois.",
  );
  const employerBody = blockString(
    employer,
    "body",
    "Un avantage social concret, 100% confidentiel, qui soulage vos équipes sur leurs démarches personnelles — sans créer de service RH dédié.",
  );
  const employerCtaLabel = blockString(employer, "cta_label", "Voir l'offre →");
  const employerCtaHref = blockString(employer, "cta_href", "/offre");

  // Final CTA
  const finalTitle = blockString(
    finalCta,
    "title",
    "Vous pouvez tester ce service gratuitement.",
  );
  const finalBody = blockString(
    finalCta,
    "body",
    "Sans aucune inscription. Ce que vous écrivez peut s'effacer en un clic.",
  );
  const finalCtaLabel = blockString(finalCta, "cta_label", "Poser ma question");
  const finalCtaHref = blockString(finalCta, "cta_href", "/start");

  return (
    <>
      {previewEnabled && (
        <div className="bg-amber-500 text-center text-xs font-semibold uppercase tracking-wider text-white">
          Mode prévisualisation — brouillon non publié
        </div>
      )}

      {/* HERO */}
      <section className="bg-symbiose relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-16 md:grid-cols-2 md:pt-16 md:pb-20">
          <div>
            <p className="text-elsai-pin mb-5 text-xs font-semibold tracking-[0.2em] uppercase">
              {heroEyebrow}
            </p>
            <h1 className="text-elsai-pin-dark font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
              {heroTitle}
            </h1>
            <p className="text-elsai-ink mt-6 max-w-xl text-xl leading-relaxed md:text-2xl">
              {heroSubtitle}
            </p>
            <p className="text-elsai-ink/80 mt-5 max-w-lg text-lg leading-relaxed">
              <strong>{heroNote}</strong>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {ctaPrimaryLabel && (
                <Link
                  href={ctaPrimaryHref || "/start"}
                  className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark inline-flex items-center gap-2 px-6 py-4 text-base font-semibold transition-colors"
                >
                  {ctaPrimaryLabel}
                </Link>
              )}
              {ctaSecondaryLabel && (
                <Link
                  href={ctaSecondaryHref || "/comment-ca-marche"}
                  className="rounded-organic border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/5 inline-flex items-center border px-6 py-4 text-base font-semibold"
                >
                  {ctaSecondaryLabel}
                </Link>
              )}
            </div>
            {trustLine && (
              <p className="text-elsai-ink/60 mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {trustLine.split("·").map((chunk, i) => (
                  <span key={i}>{chunk.trim()}</span>
                ))}
              </p>
            )}
          </div>

          <div className="relative flex justify-center md:justify-end">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 opacity-50"
              style={{
                background:
                  "radial-gradient(circle at 60% 40%, rgba(125,158,141,0.22), transparent 60%)",
              }}
            />
            {heroImage && (
              <Image
                src={heroImage}
                alt={heroAlt}
                width={280}
                height={280}
                priority
                fetchPriority="high"
                unoptimized={heroImage.startsWith("http") || heroImage.includes("/api/public/uploads")}
                className="h-auto w-[220px] drop-shadow-sm md:w-[280px]"
              />
            )}
          </div>
        </div>
      </section>

      {/* DIFFERENTIATEURS */}
      <Section tone="soft">
        <h2 className="text-elsai-pin-dark max-w-3xl font-serif text-3xl tracking-tight md:text-4xl">
          {diffTitle}
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {diffItems.map((d, i) => (
            <div
              key={`${d.title}-${i}`}
              className="shadow-organic/50 rounded-organic border-elsai-pin/10 bg-elsai-creme border p-6"
            >
              <h3 className="text-elsai-pin-dark mb-2 text-lg font-semibold">{d.title}</h3>
              <p className="text-elsai-ink/80 text-sm leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CAS D'USAGE */}
      <Section>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-elsai-pin-dark font-serif text-3xl tracking-tight md:text-4xl">
            {useCasesTitle}
          </h2>
          {useCasesLinkLabel && (
            <Link
              href={useCasesLinkHref || "/exemples-concrets"}
              className="text-elsai-pin-dark text-sm font-semibold hover:underline"
            >
              {useCasesLinkLabel}
            </Link>
          )}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {useCases.map((c, i) => (
            <article
              key={`${c.title}-${i}`}
              className="group rounded-organic border-elsai-pin/10 bg-elsai-creme hover:border-elsai-pin/30 border p-7 transition-colors"
            >
              {c.tag && (
                <span className="bg-elsai-rose/10 text-elsai-rose-dark inline-block rounded-full px-2.5 py-1 text-xs font-semibold tracking-widest uppercase">
                  {c.tag}
                </span>
              )}
              <h3 className="text-elsai-ink mt-4 font-serif text-2xl leading-snug">{c.title}</h3>
              <p className="text-elsai-ink/75 mt-3 leading-relaxed">{c.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* POUR QUI */}
      <Section tone="warm">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-8">
            <h3 className="text-elsai-pin-dark font-serif text-2xl">{adultsTitle}</h3>
            <p className="text-elsai-ink/80 mt-3 leading-relaxed">{adultsBody}</p>
            {adultsLinkLabel && (
              <Link
                href={adultsLinkHref || "/pour-qui#adultes"}
                className="text-elsai-pin-dark mt-5 inline-block font-semibold hover:underline"
              >
                {adultsLinkLabel}
              </Link>
            )}
          </div>
          <div className="rounded-organic border-elsai-rose/30 bg-elsai-creme border p-8">
            <h3 className="text-elsai-rose-dark font-serif text-2xl">{minorsTitle}</h3>
            <p className="text-elsai-ink/80 mt-3 leading-relaxed">{minorsBody}</p>
            {minorsLinkLabel && (
              <Link
                href={minorsLinkHref || "/pour-qui#mineurs"}
                className="text-elsai-rose-dark mt-5 inline-block font-semibold hover:underline"
              >
                {minorsLinkLabel}
              </Link>
            )}
          </div>
        </div>
      </Section>

      {/* EMPLOYEURS */}
      <Section>
        <div className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-8 md:p-10">
          <div className="grid items-center gap-6 md:grid-cols-[1fr,auto]">
            <div>
              <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
                {employerEyebrow}
              </p>
              <h2 className="text-elsai-pin-dark mt-2 font-serif text-2xl md:text-3xl">
                {employerTitle}
              </h2>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{employerBody}</p>
            </div>
            {employerCtaLabel && (
              <Link
                href={employerCtaHref || "/offre"}
                className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark inline-flex items-center gap-2 px-6 py-3.5 font-semibold whitespace-nowrap"
              >
                {employerCtaLabel}
              </Link>
            )}
          </div>
        </div>
      </Section>

      {/* CTA FINAL */}
      <Section>
        <div className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic p-10 text-center md:p-14">
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl">{finalTitle}</h2>
          <p className="text-elsai-creme/90 mx-auto mt-4 max-w-xl text-lg">{finalBody}</p>
          {finalCtaLabel && (
            <Link
              href={finalCtaHref || "/start"}
              className="rounded-organic bg-elsai-creme text-elsai-pin-dark mt-8 inline-block px-8 py-4 font-semibold transition-colors hover:bg-white"
            >
              {finalCtaLabel}
            </Link>
          )}
        </div>
      </Section>
    </>
  );
}
