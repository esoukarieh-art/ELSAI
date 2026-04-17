import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Éthique & confidentialité",
  description:
    "Anonymat par défaut, droit à l'oubli, hébergement en France, protection des mineurs avec orientation 119. Nos engagements éthiques détaillés.",
  alternates: { canonical: "/ethique" },
};

const PRINCIPES = [
  {
    t: "Anonymat par défaut",
    d: "Aucun nom, aucun email, aucune adresse. Tu peux utiliser ELSAI sans créer de compte. Ton seul identifiant est une session temporaire.",
  },
  {
    t: "Droit à l'oubli instantané",
    d: "Un bouton, et tout disparaît\u00A0: l'historique, les documents, les échanges. Sans délai, sans condition, sans justification.",
  },
  {
    t: "Hébergement souverain",
    d: "Toutes les données transitent sur des serveurs hébergés en France par un prestataire français (Scaleway / Clever Cloud).",
  },
  {
    t: "Transparence sur les limites",
    d: "ELSAI dit ce qu'il ne sait pas. Il n'invente pas de droits, ne promet rien, n'imite pas un professionnel humain.",
  },
  {
    t: "Protection des mineurs",
    d: "Un protocole dédié détecte les situations de danger (violences, idéations suicidaires, abus) et oriente systématiquement vers le 119 ou une Maison des Ados.",
  },
  {
    t: "Pas de profilage, pas de pub",
    d: "ELSAI est un projet d'intérêt général. Aucun ciblage publicitaire, aucun tracker, aucun cookie non-essentiel.",
  },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Notre éthique" title="Tu comptes plus que ta donnée.">
        ELSAI a été conçu pour des publics vulnérables. Chaque décision
        technique et éditoriale est guidée par ce principe.
      </PageHero>

      <Section>
        <div className="grid md:grid-cols-2 gap-6">
          {PRINCIPES.map((p) => (
            <article
              key={p.t}
              className="bg-elsai-creme rounded-organic p-7 border border-elsai-pin/10"
            >
              <h2 className="font-serif text-xl text-elsai-pin-dark">{p.t}</h2>
              <p className="mt-3 text-elsai-ink/80 leading-relaxed">{p.d}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="soft">
        <h2 className="font-serif text-3xl text-elsai-pin-dark">
          Notre posture éditoriale
        </h2>
        <div className="mt-6 prose prose-elsai max-w-3xl text-elsai-ink/85 leading-relaxed space-y-4">
          <p>
            ELSAI parle <strong>empathiquement</strong>, mais aussi <strong>franchement</strong>.
            Si un droit n'existe pas, on te le dit. Si une démarche est
            complexe, on ne le cache pas. Si ELSAI ne sait pas, il le dit aussi.
          </p>
          <p>
            Nous refusons la posture du «&nbsp;coach motivationnel&nbsp;» qui voudrait
            faire croire que tout se résout par la bonne attitude. Les droits
            sociaux sont un labyrinthe administratif — on peut t'y aider, pas
            le réécrire.
          </p>
          <p>
            ELSAI n'est <em>pas</em> un substitut à un travailleur social humain.
            C'est un sas, une première porte, un repère quand les permanences
            sont fermées.
          </p>
        </div>
      </Section>
    </>
  );
}
