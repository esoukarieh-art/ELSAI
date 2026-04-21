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
  title: "Éthique & confidentialité",
  description:
    "Anonymat par défaut, droit à l'oubli, hébergement en France, protection des mineurs avec orientation 119. Nos engagements éthiques détaillés.",
  alternates: { canonical: "/ethique" },
};

interface Principle {
  title: string;
  body: string;
}

const FALLBACK_PRINCIPLES: Principle[] = [
  {
    title: "Accessible sans se déplacer, sans rendez-vous",
    body: "Pour une question simple ou un conseil, pas besoin de prendre rendez-vous ni de vous déplacer dans une permanence. Et sans avoir à formuler votre situation en face de quelqu'un — on sait que c'est parfois le plus dur.",
  },
  {
    title: "Anonymat par défaut",
    body: "Aucun nom, aucun email, aucune adresse. Vous pouvez utiliser ELSAI sans créer de compte. Votre seul identifiant est une session temporaire.",
  },
  {
    title: "Droit à l'oubli instantané",
    body: "Un bouton, et tout disparaît\u00A0: l'historique, les documents, les échanges. Sans délai, sans condition, sans justification.",
  },
  {
    title: "Hébergement souverain",
    body: "Toutes les données transitent sur des serveurs hébergés en France par un prestataire français (Scaleway / Clever Cloud).",
  },
  {
    title: "Transparence sur les limites",
    body: "ELSAI dit ce qu'il ne sait pas. Il n'invente pas de droits, ne promet rien, n'imite pas un professionnel humain.",
  },
  {
    title: "Conçu par une assistante sociale diplômée",
    body: "ELSAI a été pensé et co-conçu par une assistante sociale diplômée d'État, pour garantir la justesse de la posture, du vocabulaire et des orientations.",
  },
  {
    title: "Pas de profilage, pas de pub",
    body: "ELSAI est un projet d'intérêt général. Aucun ciblage publicitaire, aucun tracker, aucun cookie non-essentiel.",
  },
];

type SP = { preview?: string; token?: string };

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SP> | SP;
}) {
  const sp = (searchParams ? await searchParams : undefined) ?? {};
  const previewEnabled = sp.preview === "1" && !!sp.token;

  const content = await getPageContent("ethique", {
    preview: previewEnabled,
    token: sp.token,
  });

  const hero = findBlock(content?.blocks, "hero");
  const principlesBlock = findBlock(content?.blocks, "principles");
  const biz = findBlock(content?.blocks, "business_model");
  const posture = findBlock(content?.blocks, "posture");

  const heroEyebrow = blockString(hero, "eyebrow", "Notre éthique");
  const heroTitle = blockString(hero, "title", "Vous comptez plus que vos données.");
  const heroSubtitle = blockString(
    hero,
    "subtitle",
    "ELSAI a été conçu pour des publics vulnérables. Chaque décision technique a été guidée par ce principe.",
  );

  const principles = blockList<Principle>(
    principlesBlock,
    "items",
    FALLBACK_PRINCIPLES,
  );

  const bizEyebrow = blockString(biz, "eyebrow", "Modèle économique");
  const bizTitle = blockString(
    biz,
    "title",
    "Gratuit pour vous. Financé par les entreprises.",
  );
  const bizBody1 = blockString(
    biz,
    "body1",
    "Le service est entièrement gratuit pour les particuliers, sans palier payant, sans abonnement, sans publicité. C'est un principe fondateur\u00A0: le coût ne doit jamais être un obstacle pour une personne en difficulté sociale.",
  );
  const bizBody2 = blockString(
    biz,
    "body2",
    "Le fonctionnement de la plateforme est financé par des entreprises clientes qui souscrivent un abonnement pour offrir ELSAI à leurs salariés, ainsi que par des subventions et fonds dédiés à l'économie sociale et solidaire (BPI, fonds ESS, appels à projets publics).",
  );
  const bizBody3 = blockString(
    biz,
    "body3",
    "ELSAI est porté par une SAS en cours d'agrément ESUS (Entreprise Solidaire d'Utilité Sociale), un statut reconnu par l'État qui engage l'entreprise sur un objectif d'intérêt général.",
  );
  const bizLinkLabel = blockString(biz, "link_label", "Voir l'offre entreprises");
  const bizLinkHref = blockString(biz, "link_href", "/offre");

  const postureTitle = blockString(posture, "title", "Notre posture éditoriale");
  const postureBody1 = blockString(
    posture,
    "body1",
    "ELSAI parle empathiquement, mais aussi franchement. Si un droit n'existe pas, on vous le dit. Si une démarche est complexe, on ne le cache pas. Si ELSAI ne sait pas, il le dit aussi.",
  );
  const postureBody2 = blockString(
    posture,
    "body2",
    "Nous refusons la posture du «\u00A0coach motivationnel\u00A0» qui voudrait faire croire que tout se résout par la bonne attitude. Les droits sociaux sont un labyrinthe administratif — on peut vous y aider, pas le réécrire.",
  );
  const postureBody3 = blockString(
    posture,
    "body3",
    "ELSAI n'est pas un substitut à un travailleur social humain. C'est un sas, une première porte, un repère quand les permanences sont fermées.",
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
        <div className="grid gap-6 md:grid-cols-2">
          {principles.map((p, i) => (
            <article
              key={`${p.title}-${i}`}
              className="rounded-organic border-elsai-pin/10 bg-elsai-creme border p-7"
            >
              <h2 className="text-elsai-pin-dark font-serif text-xl">{p.title}</h2>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{p.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="soft">
        <div className="max-w-3xl">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            {bizEyebrow}
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl">{bizTitle}</h2>
          <div className="text-elsai-ink/85 mt-5 space-y-4 leading-relaxed">
            {bizBody1 && <p>{bizBody1}</p>}
            {bizBody2 && <p>{bizBody2}</p>}
            {bizBody3 && <p>{bizBody3}</p>}
            {bizLinkLabel && (
              <p className="text-sm">
                <Link href={bizLinkHref || "/offre"} className="text-elsai-pin-dark underline">
                  {bizLinkLabel}
                </Link>
              </p>
            )}
          </div>
        </div>
      </Section>

      <Section>
        <h2 className="text-elsai-pin-dark font-serif text-3xl">{postureTitle}</h2>
        <div className="prose prose-elsai text-elsai-ink/85 mt-6 max-w-3xl space-y-4 leading-relaxed">
          {postureBody1 && <p>{postureBody1}</p>}
          {postureBody2 && <p>{postureBody2}</p>}
          {postureBody3 && <p>{postureBody3}</p>}
        </div>
      </Section>
    </>
  );
}
