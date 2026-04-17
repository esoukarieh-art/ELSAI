import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description:
    "Le fonctionnement d'ELSAI en 4 étapes : tu poses ta question, ELSAI comprend, te guide étape par étape, tu gardes la main sur tes données.",
  alternates: { canonical: "/comment-ca-marche" },
};

const STEPS = [
  {
    n: "01",
    t: "Tu poses ta question",
    d: "En français courant. Pas besoin de connaître le nom des dispositifs. Tu peux aussi déposer un courrier ou un document.",
  },
  {
    n: "02",
    t: "ELSAI reformule et t'oriente",
    d: "On te répond clairement, avec des étapes concrètes et des liens utiles. On te dit aussi ce qu'ELSAI ne peut pas faire.",
  },
  {
    n: "03",
    t: "Tu décides",
    d: "Tu gardes la main. Tu peux poursuivre avec ELSAI, appeler un numéro, ou aller rencontrer un travailleur social.",
  },
  {
    n: "04",
    t: "Tu effaces si tu veux",
    d: "Un clic, tout disparaît. On ne conserve ni ton historique, ni tes documents, ni ton profil.",
  },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Comment ça marche" title="Simple. Anonyme. Réversible.">
        Un échange en 4 étapes, 24h/24. Tu gardes la main à chaque instant.
      </PageHero>

      <Section>
        <ol className="grid gap-6 md:grid-cols-2">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-organic border-elsai-pin/10 bg-elsai-creme border p-7">
              <div className="text-elsai-rose font-serif text-4xl">{s.n}</div>
              <h3 className="text-elsai-pin-dark mt-3 text-xl font-semibold">{s.t}</h3>
              <p className="text-elsai-ink/80 mt-2 leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="soft">
        <h2 className="text-elsai-pin-dark mb-8 font-serif text-3xl">
          Ce qu'ELSAI fait — et ce qu'il ne fait pas
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-organic border-elsai-pin/20 bg-elsai-creme border p-7">
            <h3 className="text-elsai-pin-dark mb-3 font-semibold">✓ ELSAI peut</h3>
            <ul className="text-elsai-ink/85 space-y-2">
              <li>Expliquer un courrier de la CAF ou des impôts</li>
              <li>Vérifier quels droits correspondent à ta situation</li>
              <li>Rédiger un modèle de courrier ou de recours</li>
              <li>Trouver le CCAS ou France Services le plus proche</li>
              <li>T'orienter vers un numéro ou un lieu d'urgence</li>
            </ul>
          </div>
          <div className="rounded-organic border-elsai-rose/30 bg-elsai-creme border p-7">
            <h3 className="text-elsai-rose-dark mb-3 font-semibold">✗ ELSAI ne peut pas</h3>
            <ul className="text-elsai-ink/85 space-y-2">
              <li>Remplacer un travailleur social humain</li>
              <li>Effectuer une démarche à ta place</li>
              <li>Garantir l'obtention d'un droit</li>
              <li>Intervenir en urgence vitale (→\u00A015, 17, 18, 112)</li>
              <li>Conserver ton historique à ton insu</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <div className="text-center">
          <Link
            href="/start"
            className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark inline-flex items-center gap-2 px-6 py-4 font-semibold"
          >
            Essayer maintenant →
          </Link>
        </div>
      </Section>
    </>
  );
}
