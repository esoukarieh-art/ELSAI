import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Pour qui ?"
        title="Deux parcours, une même promesse : personne ne reste seul."
      >
        ELSAI parle différemment aux adultes et aux jeunes. Mais tous les deux sont écoutés
        pareillement — sans jugement, sans dossier.
      </PageHero>

      <Section id="adultes">
        <div className="grid items-start gap-8 md:grid-cols-[auto,1fr]">
          <div className="rounded-organic bg-elsai-pin p-8 text-elsai-creme shadow-organic md:sticky md:top-24">
            <p className="text-xs uppercase tracking-[0.2em] opacity-80">Parcours</p>
            <h2 className="mt-1 font-serif text-3xl">Adultes (18+)</h2>
            <p className="mt-3 leading-relaxed opacity-90">
              Vouvoiement, ton clair et précis, priorité à l'action.
            </p>
            <Link
              href="/start"
              className="mt-5 inline-block rounded-organic bg-elsai-creme px-5 py-3 font-semibold text-elsai-pin-dark hover:bg-white"
            >
              Commencer →
            </Link>
          </div>
          <div className="space-y-6">
            <h3 className="font-serif text-2xl text-elsai-pin-dark">
              Ce que vous pouvez nous demander
            </h3>
            <ul className="grid gap-3 text-elsai-ink/85 sm:grid-cols-2">
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
                  className="rounded-organic border border-elsai-pin/10 bg-elsai-creme px-4 py-3"
                >
                  {x}
                </li>
              ))}
            </ul>
            <p className="text-sm text-elsai-ink/70">
              Les situations d'urgence sont détectées et orientées vers le 115, le 3919, ou le 3114
              selon le contexte.
            </p>
          </div>
        </div>
      </Section>

      <Section id="mineurs" tone="warm">
        <div className="grid items-start gap-8 md:grid-cols-[auto,1fr]">
          <div className="rounded-organic bg-elsai-rose p-8 text-elsai-creme shadow-warm md:sticky md:top-24">
            <p className="text-xs uppercase tracking-[0.2em] opacity-80">Parcours</p>
            <h2 className="mt-1 font-serif text-3xl">12 → 18 ans</h2>
            <p className="mt-3 leading-relaxed opacity-90">
              Tutoiement, ton rassurant, espace safe. On ne te dit rien à tes parents — sauf si tu
              es en danger.
            </p>
            <Link
              href="/start"
              className="mt-5 inline-block rounded-organic bg-elsai-creme px-5 py-3 font-semibold text-elsai-rose-dark hover:bg-white"
            >
              Parler à ELSAI →
            </Link>
          </div>
          <div className="space-y-6">
            <h3 className="font-serif text-2xl text-elsai-rose-dark">Tu peux nous parler de…</h3>
            <ul className="grid gap-3 text-elsai-ink/85 sm:grid-cols-2">
              {[
                "Ce qui se passe à la maison",
                "L'école, le harcèlement, les notes",
                "Les amitiés, l'amour, les réseaux",
                "Ton corps, la santé, la contraception",
                "Tes droits (tu en as plein !)",
                "Quand ça va pas dans ta tête",
                "Les violences que tu subis ou vois",
                "Comment trouver de l'aide humaine",
              ].map((x) => (
                <li
                  key={x}
                  className="rounded-organic border border-elsai-rose/20 bg-elsai-creme px-4 py-3"
                >
                  {x}
                </li>
              ))}
            </ul>
            <div className="rounded-organic border border-elsai-urgence/30 bg-elsai-urgence/10 p-5 text-sm text-elsai-ink">
              <p className="mb-1 font-semibold text-elsai-urgence">
                Si tu es en danger maintenant :
              </p>
              <p>
                Appelle le <strong>119</strong> (Enfance en danger, 24h/24, gratuit, anonyme). ELSAI
                te le rappellera aussi si besoin.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
