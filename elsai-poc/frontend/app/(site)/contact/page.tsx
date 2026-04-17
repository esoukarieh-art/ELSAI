import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Nous écrire.">
        Cette page est réservée aux professionnels, partenaires, journalistes,
        et contributeurs. Pour une demande d'aide personnelle,{" "}
        <a href="/start" className="underline text-elsai-pin-dark">
          rendez-vous sur le service
        </a>
        .
      </PageHero>

      <Section>
        <div className="grid md:grid-cols-2 gap-10">
          <form
            className="space-y-4"
            action="mailto:contact@elsai.fr"
            method="post"
            encType="text/plain"
          >
            <div>
              <label
                htmlFor="nom"
                className="block text-sm font-semibold text-elsai-ink mb-1"
              >
                Votre nom
              </label>
              <input
                id="nom"
                name="nom"
                required
                className="w-full bg-elsai-creme border border-elsai-pin/20 rounded-organic px-4 py-3 focus:border-elsai-pin outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-elsai-ink mb-1"
              >
                Email professionnel
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full bg-elsai-creme border border-elsai-pin/20 rounded-organic px-4 py-3 focus:border-elsai-pin outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="sujet"
                className="block text-sm font-semibold text-elsai-ink mb-1"
              >
                Sujet
              </label>
              <select
                id="sujet"
                name="sujet"
                className="w-full bg-elsai-creme border border-elsai-pin/20 rounded-organic px-4 py-3 focus:border-elsai-pin outline-none"
              >
                <option>Partenariat</option>
                <option>Presse</option>
                <option>Signalement d'une erreur</option>
                <option>Candidature / contribution</option>
                <option>Autre</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-semibold text-elsai-ink mb-1"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                className="w-full bg-elsai-creme border border-elsai-pin/20 rounded-organic px-4 py-3 focus:border-elsai-pin outline-none resize-y"
              />
            </div>
            <button
              type="submit"
              className="bg-elsai-pin text-elsai-creme px-6 py-3.5 rounded-organic font-semibold shadow-organic hover:bg-elsai-pin-dark"
            >
              Envoyer
            </button>
            <p className="text-xs text-elsai-ink/60">
              En nous écrivant, vous acceptez que nous conservions votre email
              le temps nécessaire pour répondre.
            </p>
          </form>

          <aside className="space-y-6">
            <div className="bg-elsai-rose/10 rounded-organic p-6 border border-elsai-rose/20">
              <h3 className="font-semibold text-elsai-rose-dark">
                Vous êtes en difficulté ?
              </h3>
              <p className="mt-2 text-sm text-elsai-ink/80 leading-relaxed">
                Cette page n'est pas un service d'assistance. Pour une demande
                d'aide, rendez-vous sur{" "}
                <a href="/start" className="underline text-elsai-pin-dark">
                  le service ELSAI
                </a>{" "}
                — anonyme et disponible 24/7.
              </p>
            </div>
            <div className="bg-elsai-creme rounded-organic p-6 border border-elsai-pin/10">
              <h3 className="font-semibold text-elsai-pin-dark">
                Urgence vitale
              </h3>
              <ul className="mt-2 text-sm text-elsai-ink/85 space-y-1">
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
