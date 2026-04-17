import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Exemples concrets",
  description:
    "Des situations concrètes où ELSAI peut vous aider : ouverture de droits, refus de RSA, surendettement, violences, logement d'urgence.",
  alternates: { canonical: "/exemples-concrets" },
};

const CASES = [
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

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Exemples concrets" title="Des situations concrètes où ELSAI peut vous aider.">
        On ne remplace pas un humain. On vous aide à y voir plus clair.
      </PageHero>

      <Section>
        <ul className="grid gap-5 md:grid-cols-2">
          {CASES.map((c) => (
            <li
              key={c.title}
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
