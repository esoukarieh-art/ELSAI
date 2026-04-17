import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Blog & ressources" title="Bientôt ici.">
        Des décryptages de dispositifs, des retours d'usage et des notes
        de terrain pour les professionnels du social.
      </PageHero>
      <Section>
        <div className="bg-elsai-creme rounded-organic p-10 border border-elsai-pin/10 max-w-2xl">
          <p className="text-elsai-ink/80 leading-relaxed">
            Le blog ouvre à l'été 2026. En attendant, si vous souhaitez être
            prévenu·e, écrivez-nous via la page{" "}
            <a className="underline text-elsai-pin-dark" href="/contact">
              Contact
            </a>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
