import type { Metadata } from "next";
import Link from "next/link";
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
    t: "Accessible sans se déplacer, sans rendez-vous",
    d: "Pour une question simple ou un conseil, pas besoin de prendre rendez-vous ni de vous déplacer dans une permanence. Et sans avoir à formuler votre situation en face de quelqu'un — on sait que c'est parfois le plus dur.",
  },
  {
    t: "Anonymat par défaut",
    d: "Aucun nom, aucun email, aucune adresse. Vous pouvez utiliser ELSAI sans créer de compte. Votre seul identifiant est une session temporaire.",
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
    t: "Conçu par une assistante sociale diplômée",
    d: "ELSAI a été pensé et co-conçu par une assistante sociale diplômée d'État, pour garantir la justesse de la posture, du vocabulaire et des orientations.",
  },
  {
    t: "Pas de profilage, pas de pub",
    d: "ELSAI est un projet d'intérêt général. Aucun ciblage publicitaire, aucun tracker, aucun cookie non-essentiel.",
  },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Notre éthique" title="Vous comptez plus que vos données.">
        ELSAI a été conçu pour des publics vulnérables. Chaque décision technique a été guidée par
        ce principe.
      </PageHero>

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {PRINCIPES.map((p) => (
            <article
              key={p.t}
              className="rounded-organic border-elsai-pin/10 bg-elsai-creme border p-7"
            >
              <h2 className="text-elsai-pin-dark font-serif text-xl">{p.t}</h2>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{p.d}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="soft">
        <div className="max-w-3xl">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            Modèle économique
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl">
            Gratuit pour vous. Financé par les entreprises.
          </h2>
          <div className="text-elsai-ink/85 mt-5 space-y-4 leading-relaxed">
            <p>
              Le service est <strong>entièrement gratuit pour les particuliers</strong>, sans
              palier payant, sans abonnement, sans publicité. C'est un principe fondateur&nbsp;:
              le coût ne doit jamais être un obstacle pour une personne en difficulté sociale.
            </p>
            <p>
              Le fonctionnement de la plateforme est financé par des <strong>entreprises
              clientes</strong> qui souscrivent un abonnement pour offrir ELSAI à leurs
              salariés, ainsi que par des <strong>subventions et fonds dédiés à l'économie
              sociale et solidaire</strong> (BPI, fonds ESS, appels à projets publics).
            </p>
            <p>
              ELSAI est porté par une SAS en cours d'<strong>agrément ESUS</strong> (Entreprise
              Solidaire d'Utilité Sociale), un statut reconnu par l'État qui engage l'entreprise
              sur un objectif d'intérêt général.
            </p>
            <p className="text-sm">
              <Link href="/offre" className="text-elsai-pin-dark underline">
                Voir l'offre entreprises
              </Link>
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <h2 className="text-elsai-pin-dark font-serif text-3xl">Notre posture éditoriale</h2>
        <div className="prose prose-elsai text-elsai-ink/85 mt-6 max-w-3xl space-y-4 leading-relaxed">
          <p>
            ELSAI parle <strong>empathiquement</strong>, mais aussi <strong>franchement</strong>. Si
            un droit n'existe pas, on vous le dit. Si une démarche est complexe, on ne le cache pas.
            Si ELSAI ne sait pas, il le dit aussi.
          </p>
          <p>
            Nous refusons la posture du «&nbsp;coach motivationnel&nbsp;» qui voudrait faire croire
            que tout se résout par la bonne attitude. Les droits sociaux sont un labyrinthe
            administratif — on peut vous y aider, pas le réécrire.
          </p>
          <p>
            ELSAI n'est <em>pas</em> un substitut à un travailleur social humain. C'est un sas, une
            première porte, un repère quand les permanences sont fermées.
          </p>
        </div>
      </Section>
    </>
  );
}
