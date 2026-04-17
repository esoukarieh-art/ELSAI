import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Partenariats — Construisons l'impact ensemble",
  description:
    "Projet d'intérêt général en complémentarité des services humains. Pour les entreprises : un service social numérique de premier accueil pour vos salariés, anonyme et disponible 24h/24.",
  alternates: { canonical: "/partenariats" },
};

const OFFRE_STANDARD = [
  "Accès illimité pour tous vos salariés, 24h/24, anonyme",
  "Réponses aux questions administratives, sociales, familiales, juridiques",
  "Orientation vers les bons interlocuteurs publics (CAF, CPAM, France Services, CCAS…)",
  "Aide à préparer un rendez-vous avec un professionnel si besoin",
  "Reporting anonymisé des thématiques les plus fréquentes",
];

const OFFRE_PREMIUM = [
  "Tout ce qui est inclus dans l'offre standard",
  "Escalade vers un·e assistant·e social·e diplômé·e pour les situations complexes",
  "Appel téléphonique ou visio avec un·e professionnel·le humain·e",
  "Suivi confidentiel, toujours en complément des acteurs publics",
  "Tableau de bord QVT anonymisé pour la direction RH",
];

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Partenariats"
        title="Construisons l'impact ensemble."
      >
        ELSAI est un projet d'intérêt général qui se déploie <strong>en complémentarité</strong> des
        services humains existants. Nous ne remplaçons pas, nous <strong>renforçons l'accès au
        droit</strong>.
      </PageHero>

      <Section>
        <div className="max-w-3xl space-y-5">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            🏢 Entreprises
          </p>
          <h2 className="text-elsai-pin-dark font-serif text-3xl md:text-4xl">
            Soutenez vos collaborateurs.
          </h2>
          <p className="text-elsai-ink/85 leading-relaxed">
            Le bien-être de vos salariés passe aussi par leur <strong>sérénité administrative et
            personnelle</strong>. Un collaborateur préoccupé par un problème de logement, de
            surendettement ou de droits familiaux est un collaborateur moins serein.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-7">
            <h3 className="text-elsai-pin-dark font-serif text-xl">
              Un service social numérique de premier accueil
            </h3>
            <p className="text-elsai-ink/80 mt-3 leading-relaxed">
              Offrez à vos salariés un accès <strong>24h/24 et 7j/7</strong> à une plateforme
              anonyme pour clarifier leurs situations personnelles.
            </p>
          </div>
          <div className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-7">
            <h3 className="text-elsai-pin-dark font-serif text-xl">Libérer la parole</h3>
            <p className="text-elsai-ink/80 mt-3 leading-relaxed">
              Sans la peur du jugement ou du regard de l'employeur, vos salariés peuvent poser les
              mots sur leurs difficultés.
            </p>
          </div>
          <div className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-7">
            <h3 className="text-elsai-pin-dark font-serif text-xl">Gain d'efficacité</h3>
            <p className="text-elsai-ink/80 mt-3 leading-relaxed">
              ELSAI prépare le terrain, aide à constituer les dossiers et oriente vers les bons
              interlocuteurs — évitant les absences répétées pour des démarches floues.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="soft">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-8">
            <p className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
              Offre Standard
            </p>
            <h3 className="text-elsai-pin-dark mt-2 font-serif text-2xl">Service numérique</h3>
            <p className="text-elsai-ink/75 mt-2 text-sm">
              Un premier accueil 24h/24 pour tous vos salariés.
            </p>
            <ul className="text-elsai-ink/85 mt-5 space-y-2.5 text-sm">
              {OFFRE_STANDARD.map((i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-elsai-pin">✓</span>
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-organic border-elsai-rose/30 bg-elsai-creme border p-8">
            <p className="text-elsai-rose-dark text-xs font-semibold tracking-widest uppercase">
              Offre Premium
            </p>
            <h3 className="text-elsai-rose-dark mt-2 font-serif text-2xl">
              Numérique + humain
            </h3>
            <p className="text-elsai-ink/75 mt-2 text-sm">
              Pour les situations qui demandent une voix humaine derrière l'écran.
            </p>
            <ul className="text-elsai-ink/85 mt-5 space-y-2.5 text-sm">
              {OFFRE_PREMIUM.map((i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-elsai-rose-dark">✓</span>
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <div className="max-w-3xl">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            Notre point de vue
          </p>
          <h2 className="text-elsai-pin-dark mt-3 font-serif text-3xl md:text-4xl">
            Un relais, pas un concurrent des services sociaux traditionnels.
          </h2>
          <p className="text-elsai-ink/85 mt-5 leading-relaxed">
            Nous croyons à la <strong>force du réseau</strong>. ELSAI se positionne comme un{" "}
            <strong>filtre de premier niveau</strong> pour le secteur public.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-7">
            <h3 className="text-elsai-pin-dark font-serif text-xl">Réorientation intelligente</h3>
            <p className="text-elsai-ink/80 mt-3 leading-relaxed">
              Nous ne gardons pas l'usager chez nous&nbsp;: nous l'orientons vers le bon service
              (CAF, CPAM, CCAS, Maison France Services) <strong>avec un dossier déjà
              clarifié</strong>.
            </p>
          </div>
          <div className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-7">
            <h3 className="text-elsai-pin-dark font-serif text-xl">
              Désengorgement des accueils physiques
            </h3>
            <p className="text-elsai-ink/80 mt-3 leading-relaxed">
              En répondant aux questions simples de premier niveau, nous permettons aux
              professionnels du terrain de se concentrer sur <strong>l'accompagnement humain à
              forte valeur ajoutée</strong>.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="warm">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-elsai-pin-dark font-serif text-3xl">Discutons de votre besoin</h2>
            <p className="text-elsai-ink/85 mt-4 leading-relaxed">
              Chaque entreprise a ses spécificités&nbsp;: taille des équipes, métiers, contraintes
              RH. Nous co-construisons avec vous l'offre la plus adaptée, et nous démarrons souvent
              par une expérimentation sur un périmètre réduit.
            </p>
            <Link
              href="/contact?sujet=partenariat-entreprise"
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
              <dd>Abonnement par salarié, conventions sur mesure, expérimentations</dd>
            </div>
            <div>
              <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                Confidentialité
              </dt>
              <dd>Anonymat salarié garanti — la direction ne voit que des données agrégées</dd>
            </div>
            <div>
              <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                Engagement
              </dt>
              <dd>Service co-conçu avec une AS diplômée d'État, complément du secteur public</dd>
            </div>
          </dl>
        </div>
      </Section>
    </>
  );
}
