import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Une question sur le projet, un partenariat, une remarque ? Écris-nous. ELSAI est un projet à taille humaine et chaque message est lu.",
  alternates: { canonical: "/contact" },
};

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
              <label htmlFor="nom" className="text-elsai-ink mb-1 block text-sm font-semibold">
                Votre nom
              </label>
              <input
                id="nom"
                name="nom"
                required
                className="rounded-organic border-elsai-pin/20 bg-white focus:border-elsai-pin focus:ring-2 focus:ring-elsai-pin/30 w-full border px-4 py-3 outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-elsai-ink mb-1 block text-sm font-semibold">
                Email professionnel
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-organic border-elsai-pin/20 bg-white focus:border-elsai-pin focus:ring-2 focus:ring-elsai-pin/30 w-full border px-4 py-3 outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="sujet" className="text-elsai-ink mb-1 block text-sm font-semibold">
                Sujet
              </label>
              <select
                id="sujet"
                name="sujet"
                className="rounded-organic border-elsai-pin/20 bg-white focus:border-elsai-pin focus:ring-2 focus:ring-elsai-pin/30 w-full border px-4 py-3 outline-none transition-colors"
              >
                <option>Partenariat</option>
                <option>Presse</option>
                <option>Signalement d'une erreur</option>
                <option>Candidature / contribution</option>
                <option>Autre</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="text-elsai-ink mb-1 block text-sm font-semibold">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                className="rounded-organic border-elsai-pin/20 bg-elsai-creme focus:border-elsai-pin w-full resize-y border px-4 py-3 outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark px-6 py-3.5 font-semibold"
            >
              Envoyer
            </button>
            <p className="text-elsai-ink/60 text-xs">
              En nous écrivant, vous acceptez que nous conservions votre email le temps nécessaire
              pour répondre.
            </p>
          </form>

          <aside className="space-y-6">
            <div className="bg-elsai-rose/10 rounded-organic border-elsai-rose/20 border p-6">
              <h3 className="text-elsai-rose-dark font-semibold">Vous êtes en difficulté&nbsp;?</h3>
              <p className="text-elsai-ink/80 mt-2 text-sm leading-relaxed">
                Cette page n'est pas un service d'assistance. Pour une demande d'aide, rendez-vous
                sur{" "}
                <a href="/start" className="text-elsai-pin-dark underline">
                  le service ELSAI
                </a>{" "}
                — anonyme et disponible 24/7.
              </p>
            </div>
            <div className="rounded-organic border-elsai-pin/10 bg-elsai-creme border p-6">
              <h3 className="text-elsai-pin-dark font-semibold">Urgence vitale</h3>
              <ul className="text-elsai-ink/85 mt-2 space-y-1 text-sm">
                <li>15 — SAMU</li>
                <li>17 — Police</li>
                <li>18 — Pompiers</li>
                <li>112 — Urgences UE</li>
                <li>119 — Enfance en danger</li>
                <li>3114 — Prévention du suicide</li>
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
