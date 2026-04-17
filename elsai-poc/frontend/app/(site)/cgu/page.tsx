import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description:
    "Conditions générales d'utilisation du service ELSAI : objet, accès, limites, usage attendu et responsabilité.",
  alternates: { canonical: "/cgu" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <>
      <PageHero eyebrow="CGU" title="Conditions générales d'utilisation">
        Version provisoire — à faire valider par un conseil juridique avant mise en production.
      </PageHero>

      <Section>
        <div className="text-elsai-ink/85 max-w-3xl space-y-14 leading-relaxed">
          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">1. Objet</h2>
            <p>
              ELSAI est un service gratuit d'assistance conversationnelle sur les droits sociaux
              français.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">2. Accès au service</h2>
            <p>
              Le service est accessible sans inscription. Les mineurs de 12 à 18 ans peuvent
              l'utiliser librement dans le cadre de leurs droits personnels.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">3. Limites du service</h2>
            <p>
              ELSAI fournit une information générale et une orientation. Il ne remplace pas un avis
              juridique, médical, ni un accompagnement social professionnel.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">4. Usage attendu</h2>
            <p>
              L'utilisateur s'engage à ne pas utiliser le service à des fins illégales, à ne pas
              tenter de contourner les mesures de sécurité ou de nuire à son bon fonctionnement.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">5. Responsabilité</h2>
            <p>
              ELSAI s'efforce de fournir des informations à jour et exactes mais ne peut garantir
              l'exhaustivité ou l'applicabilité à chaque cas particulier.
            </p>
          </section>

          <p className="text-elsai-ink/60 pt-6 text-sm">
            ⓘ Version provisoire à faire valider par un conseil juridique avant mise en production.
          </p>
        </div>
      </Section>
    </>
  );
}
