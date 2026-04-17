import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Le journal d'ELSAI : réflexions, décisions de conception, avancées du projet. Un espace pour parler en transparence de ce qu'on construit.",
  alternates: { canonical: "/blog" },
};

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Blog & ressources" title="Bientôt ici.">
        Des décryptages de dispositifs, des retours d'usage et des notes de terrain pour les
        professionnels du social.
      </PageHero>
      <Section>
        <div className="rounded-organic border-elsai-pin/10 bg-elsai-creme max-w-2xl border p-10">
          <p className="text-elsai-ink/80 leading-relaxed">
            Le blog ouvre à l'été 2026. En attendant, si vous souhaitez être prévenu·e, écrivez-nous
            via la page{" "}
            <a className="text-elsai-pin-dark underline" href="/contact">
              Contact
            </a>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
