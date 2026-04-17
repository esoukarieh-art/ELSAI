import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Nous écrire.">
        Cette page est réservée aux professionnels, partenaires, journalistes, et contributeurs.
        Pour une demande d'aide personnelle,{" "}
        <a href="/start" className="text-elsai-pin-dark underline">
          rendez-vous sur le service
        </a>
        .
      </PageHero>

      <Section>
        <div className="grid gap-10 md:grid-cols-2">
          <form
            className="space-y-4"
            action="mailto:contact@elsai.fr"
            method="post"
            encType="text/plain"
          >
            <div>
              <label htmlFor="nom" className="mb-1 block text-sm font-semibold text-elsai-ink">
                Votre nom
              </label>
              <input
                id="nom"
                name="nom"
                required
                className="w-full rounded-organic border border-elsai-pin/20 bg-elsai-creme px-4 py-3 outline-none focus:border-elsai-pin"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold text-elsai-ink">
                Email professionnel
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-organic border border-elsai-pin/20 bg-elsai-creme px-4 py-3 outline-none focus:border-elsai-pin"
              />
            </div>
            <div>
              <label htmlFor="sujet" className="mb-1 block text-sm font-semibold text-elsai-ink">
                Sujet
              </label>
              <select
                id="sujet"
                name="sujet"
                className="w-full rounded-organic border border-elsai-pin/20 bg-elsai-creme px-4 py-3 outline-none focus:border-elsai-pin"
              >
                <option>Partenariat</option>
                <option>Presse</option>
                <option>Signalement d'une erreur</option>
                <option>Candidature / contribution</option>
                <option>Autre</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="mb-1 block text-sm font-semibold text-elsai-ink">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                className="w-full resize-y rounded-organic border border-elsai-pin/20 bg-elsai-creme px-4 py-3 outline-none focus:border-elsai-pin"
              />
            </div>
            <button
              type="submit"
              className="rounded-organic bg-elsai-pin px-6 py-3.5 font-semibold text-elsai-creme shadow-organic hover:bg-elsai-pin-dark"
            >
              Envoyer
            </button>
            <p className="text-xs text-elsai-ink/60">
              En nous écrivant, vous acceptez que nous conservions votre email le temps nécessaire
              pour répondre.
            </p>
          </form>

          <aside className="space-y-6">
            <div className="rounded-organic border border-elsai-rose/20 bg-elsai-rose/10 p-6">
              <h3 className="font-semibold text-elsai-rose-dark">Vous êtes en difficulté ?</h3>
              <p className="mt-2 text-sm leading-relaxed text-elsai-ink/80">
                Cette page n'est pas un service d'assistance. Pour une demande d'aide, rendez-vous
                sur{" "}
                <a href="/start" className="text-elsai-pin-dark underline">
                  le service ELSAI
                </a>{" "}
                — anonyme et disponible 24/7.
              </p>
            </div>
            <div className="rounded-organic border border-elsai-pin/10 bg-elsai-creme p-6">
              <h3 className="font-semibold text-elsai-pin-dark">Urgence vitale</h3>
              <ul className="mt-2 space-y-1 text-sm text-elsai-ink/85">
                <li>15 — SAMU</li>
                <li>17 — Police</li>
                <li>18 — Pompiers</li>
                <li>112 — Urgences UE</li>
                <li>119 — Enfance en danger</li>
                <li>3114 — Prévention suicide</li>
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
