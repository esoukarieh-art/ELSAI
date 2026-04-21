import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";
import {
  blockList,
  blockString,
  findBlock,
  getPageContent,
} from "@/lib/pageContent";

export const metadata: Metadata = {
  title: "Exemples concrets",
  description:
    "Des situations concrètes où ELSAI peut vous aider : ouverture de droits, refus de RSA, surendettement, violences, logement d'urgence.",
  alternates: { canonical: "/exemples-concrets" },
};

interface Case {
  title: string;
  body: string;
}

const FALLBACK_CASES: Case[] = [
  {
    title: "Je ne sais pas quels sont mes droits",
    body: "CAF, aides au logement, sécurité sociale, bourse… ELSAI fait un diagnostic de votre situation et vous oriente vers les droits auxquels vous pouvez éventuellement prétendre.",
  },
  {
    title: "On m'a refusé le RSA",
    body: "On relit ensemble la lettre de refus, on vérifie si c'est justifié, et on prépare un recours si justifié.",
  },
  {
    title: "Je ne me sens pas bien au collège ou à la maison",
    body: "Famille, école, relations : un espace anonyme pour poser des mots. Si ELSAI perçoit un danger, elle vous orientera vers le bon interlocuteur.",
  },
  {
    title: "Je ne sais pas où dormir ce soir",
    body: "ELSAI vous explique les numéros à contacter et les démarches à engager en fonction de votre lieu de vie.",
  },
  {
    title: "J'ai des problèmes financiers importants",
    body: "Diagnostic de la situation, conseils financiers, et aide à la constitution d'une déclaration de surendettement auprès de la Banque de France si besoin.",
  },
  {
    title: "Je subis des violences",
    body: "ELSAI vous explique les démarches que vous pouvez engager pour vous protéger, et vous oriente vers les bons interlocuteurs (3919, 119, Ligne Azur, dépôt de plainte, main courante, hébergement).",
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

  const content = await getPageContent("exemples-concrets", {
    preview: previewEnabled,
    token: sp.token,
  });

  const hero = findBlock(content?.blocks, "hero");
  const casesBlock = findBlock(content?.blocks, "cases");

  const heroEyebrow = blockString(hero, "eyebrow", "Exemples concrets");
  const heroTitle = blockString(
    hero,
    "title",
    "Des situations concrètes où ELSAI peut vous aider.",
  );
  const heroSubtitle = blockString(
    hero,
    "subtitle",
    "On ne remplace pas un humain. On vous aide à y voir plus clair.",
  );

  const cases = blockList<Case>(casesBlock, "items", FALLBACK_CASES);

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
        <ul className="grid gap-5 md:grid-cols-2">
          {cases.map((c, i) => (
            <li
              key={`${c.title}-${i}`}
              className="rounded-organic border-elsai-pin/10 bg-elsai-creme border p-7"
            >
              <h2 className="font-serif text-xl leading-snug">{c.title}</h2>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{c.body}</p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
