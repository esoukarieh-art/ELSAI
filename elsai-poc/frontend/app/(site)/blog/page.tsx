import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Blog & ressources" title="Bientôt ici.">
        Des décryptages de dispositifs, des retours d'usage et des notes de terrain pour les
        professionnels du social.
      </PageHero>
      <Section>
        <div className="max-w-2xl rounded-organic border border-elsai-pin/10 bg-elsai-creme p-10">
          <p className="leading-relaxed text-elsai-ink/80">
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
