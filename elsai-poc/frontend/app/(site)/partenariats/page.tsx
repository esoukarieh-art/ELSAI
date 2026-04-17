import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Partenariats — Construisons l'impact ensemble",
  description:
    "ELSAI se déploie en complémentarité des services sociaux publics. CCAS, collectivités, associations, France Services : construisons ensemble un relais numérique utile à vos usagers.",
  alternates: { canonical: "/partenariats" },
};

const PARTENAIRES_CIBLES = [
  {
    titre: "CCAS & services sociaux départementaux",
    texte:
      "Un relais 24h/24 pour répondre aux questions de premier niveau et libérer du temps aux travailleurs sociaux sur les accompagnements à forte valeur ajoutée.",
  },
  {
    titre: "France Services & maisons de services au public",
    texte:
      "Un outil complémentaire pour prolonger l'accompagnement au-delà des heures d'ouverture et préparer les rendez-vous avec un dossier déjà clarifié.",
  },
  {
    titre: "Associations sociales & caritatives",
    texte:
      "Pour les structures qui orientent déjà des publics vulnérables, ELSAI apporte une réponse immédiate sur les droits, en français clair.",
  },
  {
    titre: "Collectivités territoriales",
    texte:
      "Dans le cadre des dispositifs « Territoires zéro non-recours », ELSAI peut être déployée comme brique numérique complémentaire.",
  },
];

const ENGAGEMENTS = [
  {
    titre: "Réorientation systématique",
    texte:
      "Nous ne gardons pas l'usager chez nous. ELSAI oriente vers le bon service (CAF, CPAM, CCAS, France Services) avec un dossier déjà clarifié.",
  },
  {
    titre: "Transparence des pratiques",
    texte:
      "Nos règles éthiques, notre gouvernance et nos sources de financement sont publiques. ELSAI est portée par un binôme assistante sociale diplômée + ingénieur.",
  },
  {
    titre: "Désengorgement des accueils",
    texte:
      "En répondant aux questions simples de premier niveau, nous permettons à vos équipes de se concentrer sur l'accompagnement humain qui compte.",
  },
  {
    titre: "Donnée souveraine",
    texte:
      "Hébergement en France, conformité RGPD, aucun transfert hors UE. Nous pouvons co-signer les engagements vis-à-vis de vos tutelles.",
  },
];

const FORMATS = [
  {
    titre: "Lien simple",
    desc: "Renvoi depuis votre site vers ELSAI, sans intégration technique.",
    cout: "Gratuit",
  },
  {
    titre: "Co-branding",
    desc: "Page d'accueil aux couleurs partenaire, parcours dédié pour vos usagers.",
    cout: "À discuter",
  },
  {
    titre: "Intégration métier",
    desc: "Intégration dans votre SI ou votre portail usager, reporting dédié.",
    cout: "Sur devis",
  },
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Partenariats" title="Construisons l'impact ensemble.">
        ELSAI est un projet d'intérêt général qui se déploie <strong>en complémentarité</strong>{" "}
        des services sociaux publics. Nous ne remplaçons pas&nbsp;: nous{" "}
        <strong>renforçons l'accès au droit</strong>.
      </PageHero>

      <Section>
        <div className="max-w-3xl">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            Notre positionnement
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">
            Un relais, pas un concurrent des services sociaux traditionnels.
          </h2>
          <p className="text-elsai-ink/85 mt-5 leading-relaxed">
            Le non-recours aux droits sociaux ne se résoudra pas avec un seul outil. ELSAI se
            pense comme un <strong>filtre de premier niveau</strong> qui prépare le terrain, et
            qui oriente vers vos services quand un accompagnement humain est nécessaire.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {ENGAGEMENTS.map((e) => (
            <div key={e.titre} className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-7">
              <h3 className="text-elsai-pin-dark font-serif text-xl">{e.titre}</h3>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{e.texte}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="soft">
        <div className="max-w-3xl">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            À qui nous nous adressons
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">
            Les structures avec qui nous souhaitons travailler.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {PARTENAIRES_CIBLES.map((p) => (
            <div key={p.titre} className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-7">
              <h3 className="text-elsai-pin-dark font-serif text-xl">{p.titre}</h3>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{p.texte}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="max-w-3xl">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            Formats de partenariat
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">
            Plusieurs niveaux d'intégration, selon vos besoins.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {FORMATS.map((f) => (
            <div key={f.titre} className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-7">
              <h3 className="text-elsai-pin-dark font-serif text-xl">{f.titre}</h3>
              <p className="text-elsai-ink/80 mt-3 leading-relaxed">{f.desc}</p>
              <p className="text-elsai-pin mt-4 text-sm font-semibold">{f.cout}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="soft">
        <div className="rounded-organic border-elsai-rose/25 bg-elsai-creme border p-8 md:p-10">
          <p className="text-elsai-rose-dark text-xs font-semibold tracking-[0.2em] uppercase">
            Vous êtes une entreprise&nbsp;?
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-2xl md:text-3xl">
            Une offre dédiée pour équiper vos salariés d'un accueil social confidentiel.
          </h2>
          <p className="text-elsai-ink/85 mt-4 leading-relaxed">
            Si vous représentez une entreprise qui souhaite proposer ELSAI à ses collaborateurs, une
            offre distincte existe à partir de 3 € par salarié et par mois.
          </p>
          <Link
            href="/offre"
            className="rounded-organic border-elsai-rose-dark/30 text-elsai-rose-dark hover:bg-elsai-rose/10 mt-5 inline-flex items-center gap-2 border px-5 py-3 text-sm font-semibold"
          >
            Voir l'offre entreprises →
          </Link>
        </div>
      </Section>

      <Section tone="warm">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-elsai-pin-dark font-serif text-3xl">Discutons de votre projet</h2>
            <p className="text-elsai-ink/85 mt-4 leading-relaxed">
              Chaque territoire, chaque structure a ses spécificités. Nous co-construisons le
              format le plus adapté, et nous démarrons souvent par une expérimentation sur un
              périmètre réduit avant tout déploiement plus large.
            </p>
            <Link
              href="/contact?sujet=partenariat-institutionnel"
              className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark mt-6 inline-flex items-center gap-2 px-6 py-3.5 font-semibold"
            >
              Prendre contact →
            </Link>
          </div>
          <dl className="rounded-organic border-elsai-pin/10 bg-elsai-creme space-y-4 border p-7">
            <div>
              <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                Format
              </dt>
              <dd>Conventions sur mesure, expérimentations territoriales</dd>
            </div>
            <div>
              <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                Confidentialité
              </dt>
              <dd>Anonymat usager garanti — données agrégées uniquement</dd>
            </div>
            <div>
              <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                Statut
              </dt>
              <dd>SAS en cours d'agrément ESUS, hébergement souverain France</dd>
            </div>
          </dl>
        </div>
      </Section>
    </>
  );
}
