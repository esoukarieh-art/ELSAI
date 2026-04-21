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
  title: "Comment ça marche",
  description:
    "Le fonctionnement d'ELSAI en 4 étapes : vous posez votre question, ELSAI comprend, vous guide étape par étape, vous gardez la main sur vos données.",
  alternates: { canonical: "/comment-ca-marche" },
};

interface Step {
  number: string;
  title: string;
  body: string;
}

interface LabelItem {
  label: string;
}

const FALLBACK_STEPS: Step[] = [
  {
    number: "01",
    title: "Vous posez votre question",
    body: "En français courant. Pas besoin de connaître le nom des dispositifs. Vous pouvez aussi déposer un courrier ou un document.",
  },
  {
    number: "02",
    title: "ELSAI reformule et vous oriente",
    body: "On vous répond clairement, avec des étapes concrètes et des liens utiles. On vous dit aussi ce qu'ELSAI ne peut pas faire.",
  },
  {
    number: "03",
    title: "Vous décidez, vous gardez la main",
    body: "Vous pouvez poursuivre avec ELSAI, appeler un numéro, ou aller rencontrer un travailleur social.",
  },
  {
    number: "04",
    title: "Vous effacez si vous voulez",
    body: "Un clic, tout disparaît. On ne conserve ni votre historique, ni vos documents, ni votre profil.",
  },
];

const FALLBACK_CAN: LabelItem[] = [
  { label: "Expliquer un courrier administratif (CAF, CPAM, impôts, banque…)" },
  { label: "Vous indiquer quels droits vous pouvez ouvrir" },
  { label: "Rédiger un modèle de courrier ou de recours" },
  { label: "Trouver le service social ou la Maison France Services la plus proche de chez vous" },
  { label: "Vous orienter vers des numéros ou des lieux d'urgence" },
];

const FALLBACK_CANT: LabelItem[] = [
  { label: "Remplacer un travailleur social humain" },
  { label: "Effectuer une démarche à votre place" },
  { label: "Vous garantir l'obtention d'un droit" },
  { label: "Intervenir en urgence vitale (→ 15, 17, 18, 112)" },
  { label: "Conserver votre historique à votre insu" },
];

type SP = { preview?: string; token?: string };

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SP> | SP;
}) {
  const sp = (searchParams ? await searchParams : undefined) ?? {};
  const previewEnabled = sp.preview === "1" && !!sp.token;

  const content = await getPageContent("comment-ca-marche", {
    preview: previewEnabled,
    token: sp.token,
  });

  const hero = findBlock(content?.blocks, "hero");
  const stepsBlock = findBlock(content?.blocks, "steps");
  const caps = findBlock(content?.blocks, "capabilities");
  const finalCta = findBlock(content?.blocks, "final_cta");

  const heroEyebrow = blockString(hero, "eyebrow", "Comment ça marche");
  const heroTitle = blockString(hero, "title", "Simple et anonyme.");
  const heroSubtitle = blockString(
    hero,
    "subtitle",
    "Un échange en 4 étapes, 24h/24h. Vous gardez la main à chaque instant.",
  );

  const steps = blockList<Step>(stepsBlock, "items", FALLBACK_STEPS);

  const capsTitle = blockString(
    caps,
    "title",
    "Ce qu'ELSAI fait — et ce qu'il ne fait pas",
  );
  const canTitle = blockString(caps, "can_title", "✓ ELSAI peut");
  const canItems = blockList<LabelItem>(caps, "can_items", FALLBACK_CAN);
  const cantTitle = blockString(caps, "cant_title", "✗ ELSAI ne peut pas");
  const cantItems = blockList<LabelItem>(caps, "cant_items", FALLBACK_CANT);

  const ctaLabel = blockString(finalCta, "cta_label", "Essayer maintenant →");
  const ctaHref = blockString(finalCta, "cta_href", "/start");

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
        <ol className="grid gap-6 md:grid-cols-2">
          {steps.map((s, i) => (
            <li
              key={`${s.number}-${i}`}
              className="rounded-organic border-elsai-pin/10 bg-elsai-creme border p-7"
            >
              <div className="text-elsai-rose font-serif text-4xl">{s.number}</div>
              <h3 className="text-elsai-pin-dark mt-3 text-xl font-semibold">{s.title}</h3>
              <p className="text-elsai-ink/80 mt-2 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="soft">
        <h2 className="text-elsai-pin-dark mb-8 font-serif text-3xl">{capsTitle}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-organic border-elsai-pin/20 bg-elsai-creme border p-7">
            <h3 className="text-elsai-pin-dark mb-3 font-semibold">{canTitle}</h3>
            <ul className="text-elsai-ink/85 space-y-2">
              {canItems.map((x, i) => (
                <li key={`${x.label}-${i}`}>{x.label}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-organic border-elsai-rose/30 bg-elsai-creme border p-7">
            <h3 className="text-elsai-rose-dark mb-3 font-semibold">{cantTitle}</h3>
            <ul className="text-elsai-ink/85 space-y-2">
              {cantItems.map((x, i) => (
                <li key={`${x.label}-${i}`}>{x.label}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {ctaLabel && (
        <Section>
          <div className="text-center">
            <Link
              href={ctaHref || "/start"}
              className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark inline-flex items-center gap-2 px-6 py-4 font-semibold"
            >
              {ctaLabel}
            </Link>
          </div>
        </Section>
      )}
    </>
  );
}
