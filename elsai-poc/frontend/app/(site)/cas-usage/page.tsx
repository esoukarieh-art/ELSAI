import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Cas d'usage",
  description:
    "À quoi sert ELSAI concrètement ? RSA refusé, entrée dans la majorité, logement d'urgence, difficultés à l'école : des exemples réels.",
  alternates: { canonical: "/cas-usage" },
};

const CASES = [
  {
    tag: "Majeur",
    title: "J'ai 18 ans et je ne sais pas quels sont mes droits",
    body: "CAF, aides au logement, sécu, bourse étudiante. ELSAI te dresse la liste de ce à quoi tu as droit selon ta situation (emploi, études, handicap, vie seul·e).",
  },
  {
    tag: "Majeur",
    title: "On m'a refusé le RSA",
    body: "On relit ensemble la lettre de refus, on vérifie si c'est justifié, et on prépare un recours (RAPO ou recours au tribunal administratif) si besoin.",
  },
  {
    tag: "Mineur",
    title: "Je suis ado et ça ne va pas",
    body: "Famille, école, relations\u00A0: un espace anonyme pour poser des mots. Si c'est grave (violences, danger), ELSAI t'oriente vers le 119 ou une Maison des Ados.",
  },
  {
    tag: "Majeur",
    title: "Je n'ai pas où dormir ce soir",
    body: "115 en priorité, accueils de jour, CHRS, hébergement d'urgence femmes… ELSAI te donne ce qui existe près de toi et prépare ta demande.",
  },
  {
    tag: "Majeur",
    title: "Je suis en surendettement",
    body: "Constituer un dossier Banque de France, comprendre les étapes, mettre en pause les créanciers\u00A0: on te guide sans te juger.",
  },
  {
    tag: "Majeur / Mineur",
    title: "Je subis des violences",
    body: "3919 (femmes), 119 (mineurs), Ligne Azur (LGBT+). ELSAI t'explique tes recours (dépôt de plainte, main courante, hébergement) et respecte ton rythme.",
  },
  {
    tag: "Majeur",
    title: "Handicap\u00A0: MDPH, AAH, RQTH",
    body: "Monter un dossier MDPH, comprendre les délais, faire un recours\u00A0: ELSAI traduit le jargon administratif en étapes concrètes.",
  },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Cas d'usage" title="Des situations concrètes où ELSAI peut t'aider.">
        On ne remplace pas un humain. On t'aide à y voir clair avant.
      </PageHero>

      <Section>
        <ul className="grid gap-5 md:grid-cols-2">
          {CASES.map((c) => (
            <li
              key={c.title}
              className="rounded-organic border-elsai-pin/10 bg-elsai-creme border p-7"
            >
              <span className="bg-elsai-pin/10 text-elsai-pin-dark inline-block rounded-full px-2.5 py-1 text-xs font-semibold tracking-widest uppercase">
                {c.tag}
              </span>
              <h2 className="mt-4 font-serif text-xl leading-snug">{c.title}</h2>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{c.body}</p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
