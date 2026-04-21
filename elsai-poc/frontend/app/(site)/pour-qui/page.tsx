import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Pour qui\u00A0? Adultes, 12-18 ans & employeurs",
  description:
    "ELSAI accompagne trois publics : les adultes (CAF, impôts, logement, MDPH…), les mineurs de 12 à 18 ans avec un protocole de sécurité, et les employeurs qui souhaitent équiper leurs salariés.",
  alternates: { canonical: "/pour-qui" },
};

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Pour qui&nbsp;?"
        title="Trois parcours, une même promesse&nbsp;: personne ne reste seul."
      >
        ELSAI parle différemment aux adultes, aux jeunes et aux entreprises qui veulent équiper
        leurs salariés. Chacun avec la bonne posture.
      </PageHero>

      <Section id="adultes">
        <div className="grid items-start gap-8 md:grid-cols-[auto,1fr]">
          <div className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic p-8 md:sticky md:top-24">
            <p className="text-xs tracking-[0.2em] uppercase opacity-80">Parcours</p>
            <h2 className="mt-1 font-serif text-3xl">Adultes (18+)</h2>
            <p className="mt-3 leading-relaxed opacity-90">
              Vouvoiement, ton clair et précis, priorité à l'action.
            </p>
            <Link
              href="/start"
              className="rounded-organic bg-elsai-creme text-elsai-pin-dark mt-5 inline-block px-5 py-3 font-semibold hover:bg-white"
            >
              Commencer →
            </Link>
          </div>
          <div className="space-y-6">
            <h3 className="text-elsai-pin-dark font-serif text-2xl">
              Ce que vous pouvez nous demander
            </h3>
            <ul className="text-elsai-ink/85 grid gap-3 sm:grid-cols-2">
              {[
                "CAF, APL, RSA, prime d'activité",
                "Impôts, déclaration, contentieux",
                "Logement, expulsion, impayés",
                "Emploi, France Travail, formation",
                "Santé, CSS, AME, CPAM",
                "Surendettement, Banque de France",
                "Handicap, MDPH, AAH, RQTH",
                "Retraite, minimum vieillesse (ASPA)",
              ].map((x) => (
                <li
                  key={x}
                  className="rounded-organic border-elsai-pin/10 bg-elsai-creme border px-4 py-3"
                >
                  {x}
                </li>
              ))}
            </ul>
            <p className="text-elsai-ink/70 text-sm">
              Les situations d'urgence sont détectées et orientées vers le 115, le 3919, ou le 3114
              selon le contexte.
            </p>
          </div>
        </div>
      </Section>

      <Section id="mineurs" tone="warm">
        <div className="grid items-start gap-8 md:grid-cols-[auto,1fr]">
          <div className="bg-elsai-rose text-elsai-creme rounded-organic shadow-warm p-8 md:sticky md:top-24">
            <p className="text-xs tracking-[0.2em] uppercase opacity-80">Parcours</p>
            <h2 className="mt-1 font-serif text-3xl">12 → 18 ans</h2>
            <p className="mt-3 leading-relaxed opacity-90">
              Vouvoiement par défaut, tutoiement si vous préférez. Espace bienveillant. On ne dit
              rien à vos parents — sauf si vous êtes en danger.
            </p>
            <Link
              href="/start"
              className="rounded-organic bg-elsai-creme text-elsai-rose-dark mt-5 inline-block px-5 py-3 font-semibold hover:bg-white"
            >
              Parler à ELSAI →
            </Link>
          </div>
          <div className="space-y-6">
            <h3 className="text-elsai-rose-dark font-serif text-2xl">Vous pouvez nous parler de…</h3>
            <ul className="text-elsai-ink/85 grid gap-3 sm:grid-cols-2">
              {[
                "Ce qui se passe à la maison",
                "L'école, le harcèlement, les notes",
                "Les amitiés, l'amour, les réseaux",
                "Votre corps, la santé, la contraception",
                "Vos droits (vous en avez plein\u00A0!)",
                "Quand ça ne va pas dans votre tête",
                "Les violences que vous subissez ou voyez",
                "Comment trouver de l'aide humaine",
              ].map((x) => (
                <li
                  key={x}
                  className="rounded-organic border-elsai-rose/20 bg-elsai-creme border px-4 py-3"
                >
                  {x}
                </li>
              ))}
            </ul>
            <div className="bg-elsai-urgence/10 border-elsai-urgence/30 rounded-organic text-elsai-ink border p-5 text-sm">
              <p className="text-elsai-urgence mb-1 font-semibold">
                Si vous êtes en danger maintenant&nbsp;:
              </p>
              <p>
                Appelez le <strong>119</strong> (Enfance en danger, 24h/24h, gratuit, anonyme). ELSAI
                vous le rappellera aussi si besoin.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section id="employeurs">
        <div className="grid items-start gap-8 md:grid-cols-[auto,1fr]">
          <div className="rounded-organic border-elsai-pin/20 bg-elsai-creme shadow-organic border p-8 md:sticky md:top-24">
            <p className="text-elsai-pin text-xs tracking-[0.2em] uppercase">Parcours</p>
            <h2 className="text-elsai-pin-dark mt-1 font-serif text-3xl">Employeurs</h2>
            <p className="text-elsai-ink/80 mt-3 leading-relaxed">
              Vouvoiement, ton business, orienté décision. Une offre claire pour équiper vos
              salariés d'un accueil social confidentiel.
            </p>
            <Link
              href="/offre"
              className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark mt-5 inline-block px-5 py-3 font-semibold"
            >
              Voir l'offre entreprises →
            </Link>
          </div>
          <div className="space-y-6">
            <h3 className="text-elsai-pin-dark font-serif text-2xl">
              Ce que vous cherchez probablement
            </h3>
            <ul className="text-elsai-ink/85 grid gap-3 sm:grid-cols-2">
              {[
                "Un avantage social différenciant",
                "Une alternative aux EAP classiques",
                "Réduire l'absentéisme lié aux démarches",
                "Soigner la marque employeur",
                "Une solution rapide à déployer",
                "Une confidentialité totale salariés",
                "Un coût maîtrisé (à partir de 3 €/mois)",
                "Un reporting anonymisé exploitable",
              ].map((x) => (
                <li
                  key={x}
                  className="rounded-organic border-elsai-pin/15 bg-elsai-creme border px-4 py-3"
                >
                  {x}
                </li>
              ))}
            </ul>
            <p className="text-elsai-ink/70 text-sm">
              Trois formules (Essentiel, Premium, Sur mesure) selon la taille de votre structure.
              Tarification au siège, engagement 12 mois, facturation mensuelle ou annuelle.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
