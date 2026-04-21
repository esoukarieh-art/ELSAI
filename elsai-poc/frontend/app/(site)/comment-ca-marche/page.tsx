import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description:
    "Le fonctionnement d'ELSAI en 4 étapes : vous posez votre question, ELSAI comprend, vous guide étape par étape, vous gardez la main sur vos données.",
  alternates: { canonical: "/comment-ca-marche" },
};

const STEPS = [
  {
    n: "01",
    t: "Vous posez votre question",
    d: "En français courant. Pas besoin de connaître le nom des dispositifs. Vous pouvez aussi déposer un courrier ou un document.",
  },
  {
    n: "02",
    t: "ELSAI reformule et vous oriente",
    d: "On vous répond clairement, avec des étapes concrètes et des liens utiles. On vous dit aussi ce qu'ELSAI ne peut pas faire.",
  },
  {
    n: "03",
    t: "Vous décidez, vous gardez la main",
    d: "Vous pouvez poursuivre avec ELSAI, appeler un numéro, ou aller rencontrer un travailleur social.",
  },
  {
    n: "04",
    t: "Vous effacez si vous voulez",
    d: "Un clic, tout disparaît. On ne conserve ni votre historique, ni vos documents, ni votre profil.",
  },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Comment ça marche" title="Simple et anonyme.">
        Un échange en 4 étapes, 24h/24h. Vous gardez la main à chaque instant.
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
              <li>Expliquer un courrier administratif (CAF, CPAM, impôts, banque…)</li>
              <li>Vous indiquer quels droits vous pouvez ouvrir</li>
              <li>Rédiger un modèle de courrier ou de recours</li>
              <li>Trouver le service social ou la Maison France Services la plus proche de chez vous</li>
              <li>Vous orienter vers des numéros ou des lieux d'urgence</li>
            </ul>
          </div>
          <div className="rounded-organic border-elsai-rose/30 bg-elsai-creme border p-7">
            <h3 className="text-elsai-rose-dark mb-3 font-semibold">✗ ELSAI ne peut pas</h3>
            <ul className="text-elsai-ink/85 space-y-2">
              <li>Remplacer un travailleur social humain</li>
              <li>Effectuer une démarche à votre place</li>
              <li>Vous garantir l'obtention d'un droit</li>
              <li>Intervenir en urgence vitale (→ 15, 17, 18, 112)</li>
              <li>Conserver votre historique à votre insu</li>
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
