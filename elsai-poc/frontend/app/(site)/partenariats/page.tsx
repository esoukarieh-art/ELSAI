import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

const PROFILS = [
  {
    t: "CCAS, CIAS, collectivités",
    d: "Nous déployons ELSAI comme extension numérique de votre permanence sociale : hors-horaires, anonyme, orientant vers vos services.",
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
        ELSAI est un projet d'intérêt général. Il se déploie en complément —
        jamais en remplacement — des services humains existants.
      </PageHero>

      <Section>
        <h2 className="font-serif text-3xl text-elsai-pin-dark mb-8">
          Nos interlocuteurs privilégiés
        </h2>
        <ul className="grid md:grid-cols-2 gap-5">
          {PROFILS.map((p) => (
            <li
              key={p.t}
              className="bg-elsai-creme rounded-organic p-7 border border-elsai-pin/10"
            >
              <h3 className="font-semibold text-elsai-pin-dark text-lg">
                {p.t}
              </h3>
              <p className="mt-3 text-elsai-ink/80 leading-relaxed">{p.d}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="soft">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-serif text-3xl text-elsai-pin-dark">
              Travaillons ensemble
            </h2>
            <p className="mt-4 text-elsai-ink/80 leading-relaxed">
              Nous recherchons des partenaires terrain pour co-construire
              les parcours, tester les V1, et remonter les angles morts. Les
              échanges se font en visio ou sur site.
            </p>
            <Link
              href="/contact?sujet=partenariat"
              className="inline-flex items-center gap-2 mt-6 bg-elsai-pin text-elsai-creme px-6 py-3.5 rounded-organic font-semibold shadow-organic hover:bg-elsai-pin-dark"
            >
              Prendre contact →
            </Link>
          </div>
          <dl className="bg-elsai-creme rounded-organic p-7 border border-elsai-pin/10 space-y-4">
            <div>
              <dt className="text-xs uppercase tracking-widest text-elsai-pin font-semibold">
                Format
              </dt>
              <dd>Expérimentations locales, conventions cadre, open data</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-elsai-pin font-semibold">
                Coût
              </dt>
              <dd>Gratuit pour les acteurs publics et associatifs</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-elsai-pin font-semibold">
                Engagement
              </dt>
              <dd>
                Co-construction, respect de vos protocoles, reporting
                anonyme sur les usages
              </dd>
            </div>
          </dl>
        </div>
      </Section>
    </>
  );
}
