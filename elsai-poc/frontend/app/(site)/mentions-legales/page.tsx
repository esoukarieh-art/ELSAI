import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales et informations d'éditeur d'ELSAI : responsabilité éditoriale, hébergement, contact, propriété intellectuelle.",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Mentions légales" title="Transparence, données, accessibilité.">
        Dernière mise à jour : avril 2026.
      </PageHero>

      <Section>
        <div className="max-w-3xl space-y-14 text-elsai-ink/85 leading-relaxed">
          <section>
            <h2 className="font-serif text-2xl text-elsai-pin-dark mb-3">
              Éditeur
            </h2>
            <p>
              ELSAI est un projet porté par un collectif d'intérêt général.
              Les coordonnées précises de l'éditeur seront publiées au
              lancement officiel.
            </p>
          </section>

          <section id="rgpd">
            <h2 className="font-serif text-2xl text-elsai-pin-dark mb-3">
              Données personnelles & RGPD
            </h2>
            <p>
              ELSAI a été conçu pour collecter le strict minimum. Concrètement :
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                Aucun compte utilisateur n'est requis pour accéder au service.
              </li>
              <li>
                Une session technique temporaire est créée pour la conversation,
                et peut être effacée par l'utilisateur à tout moment.
              </li>
              <li>
                Aucune donnée n'est cédée à un tiers, ni utilisée à des fins
                publicitaires.
              </li>
              <li>
                Les données transitent sur des serveurs hébergés en France
                (Scaleway / Clever Cloud).
              </li>
              <li>
                Droit d'accès, de rectification et d'opposition au titre du
                RGPD, exerçable via la page{" "}
                <a href="/contact" className="underline text-elsai-pin-dark">
                  Contact
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-elsai-pin-dark mb-3">
              Cookies & mesure d'audience
            </h2>
            <p>
              ELSAI n'utilise pas de cookies publicitaires. La mesure d'audience
              est réalisée avec une solution respectueuse de la vie privée
              (Plausible ou Matomo auto-hébergé), sans traçage individuel.
            </p>
          </section>

          <section id="accessibilite">
            <h2 className="font-serif text-2xl text-elsai-pin-dark mb-3">
              Accessibilité
            </h2>
            <p>
              Ce site vise la conformité <strong>RGAA niveau AA</strong>. Si
              vous constatez un défaut d'accessibilité, merci de nous le
              signaler via la page Contact : nous le corrigerons en priorité.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-elsai-pin-dark mb-3">
              Propriété intellectuelle
            </h2>
            <p>
              Les contenus éditoriaux, logos et identité visuelle sont la
              propriété du projet ELSAI. Le code est ouvert à des fins
              d'audit et de partenariats (licence détaillée publiée au
              lancement).
            </p>
          </section>
        </div>
      </Section>
    </>
  );
}
