import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Partenariats",
  description:
    "Collectivités, associations, centres sociaux, établissements scolaires : proposez ELSAI aux publics que vous accompagnez. Formats et conditions.",
  alternates: { canonical: "/partenariats" },
};

const PROFILS = [
  {
    t: "CCAS, CIAS, collectivités",
    d: "Nous déployons ELSAI comme extension numérique de votre permanence sociale\u00A0: hors horaires, anonyme, orientant vers vos services.",
  },
  {
    t: "Associations de solidarité",
    d: "Intégrer ELSAI à votre site ou votre dispositif d'accueil, former vos bénévoles, mutualiser des contenus.",
  },
  {
    t: "Missions locales, MDA, PAEJ",
    d: "Un outil dédié aux 12-25 ans, avec un protocole de sécurité enfance intégré.",
  },
  {
    t: "Bailleurs sociaux, Action Logement",
    d: "Proposer à vos locataires un point d'accueil 24/7 pour les questions de droits et de budget.",
  },
];

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Partenariats"
        title="Nous construisons ELSAI avec celles et ceux qui sont sur le terrain."
      >
        ELSAI est un projet d'intérêt général. Il se déploie en complément — jamais en remplacement
        — des services humains existants.
      </PageHero>

      <Section>
        <h2 className="mb-8 font-serif text-3xl text-elsai-pin-dark">
          Nos interlocuteurs privilégiés
        </h2>
        <ul className="grid gap-5 md:grid-cols-2">
          {PROFILS.map((p) => (
            <li key={p.t} className="rounded-organic border border-elsai-pin/10 bg-elsai-creme p-7">
              <h3 className="text-lg font-semibold text-elsai-pin-dark">{p.t}</h3>
              <p className="mt-3 leading-relaxed text-elsai-ink/80">{p.d}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="soft">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl text-elsai-pin-dark">Travaillons ensemble</h2>
            <p className="mt-4 leading-relaxed text-elsai-ink/80">
              Nous recherchons des partenaires terrain pour co-construire les parcours, tester les
              V1, et remonter les angles morts. Les échanges se font en visio ou sur site.
            </p>
            <Link
              href="/contact?sujet=partenariat"
              className="mt-6 inline-flex items-center gap-2 rounded-organic bg-elsai-pin px-6 py-3.5 font-semibold text-elsai-creme shadow-organic hover:bg-elsai-pin-dark"
            >
              Prendre contact →
            </Link>
          </div>
          <dl className="space-y-4 rounded-organic border border-elsai-pin/10 bg-elsai-creme p-7">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-elsai-pin">
                Format
              </dt>
              <dd>Expérimentations locales, conventions cadre, open data</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-elsai-pin">
                Coût
              </dt>
              <dd>Gratuit pour les acteurs publics et associatifs</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-elsai-pin">
                Engagement
              </dt>
              <dd>Co-construction, respect de vos protocoles, reporting anonyme sur les usages</dd>
            </div>
          </dl>
        </div>
      </Section>
    </>
  );
}
