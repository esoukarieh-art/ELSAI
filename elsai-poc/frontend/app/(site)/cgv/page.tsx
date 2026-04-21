import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Conditions générales de vente (B2B)",
  description:
    "Conditions générales de vente ELSAI pour les entreprises : offres, tarifs, engagement, facturation, résiliation, confidentialité.",
  alternates: { canonical: "/cgv" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <>
      <PageHero eyebrow="CGV B2B" title="Conditions générales de vente">
        Version provisoire — à faire valider par un conseil juridique avant mise en production.
        Applicable à toute souscription aux offres Essentiel, Premium et Sur mesure d'ELSAI.
      </PageHero>

      <Section>
        <div className="text-elsai-ink/85 max-w-3xl space-y-12 leading-relaxed">
          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">1. Objet</h2>
            <p>
              Les présentes CGV régissent l'ensemble des relations contractuelles entre ELSAI (SAS
              en cours d'agrément ESUS, ci-après « le Prestataire ») et toute entreprise (ci-après
              « le Client ») souscrivant à l'un des services ELSAI dans le cadre de son activité
              professionnelle. Toute souscription vaut acceptation sans réserve des présentes CGV.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">2. Description du service</h2>
            <p>
              ELSAI fournit au Client un accès, pour un nombre défini de sièges salariés, à :
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>l'assistant social conversationnel ELSAI (chatbot supervisé) 24h/24h, 7j/7&nbsp;;</li>
              <li>des consultations humaines par des assistantes sociales diplômées, selon quota inclus dans l'offre&nbsp;;</li>
              <li>un reporting anonymisé (aucune donnée nominative)&nbsp;;</li>
              <li>un kit de communication interne.</li>
            </ul>
            <p className="mt-3">
              Les spécificités de chaque offre (Essentiel, Premium, Sur mesure) sont décrites sur la
              page{" "}
              <Link href="/offre" className="text-elsai-pin-dark underline">
                Offre entreprises
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">3. Souscription & accès</h2>
            <p>
              La souscription s'effectue en ligne via le formulaire <em>/offre/souscrire</em> ou par
              devis (offre Sur mesure). À la validation du paiement, le Client reçoit par email :
              (i) les codes d'accès personnels à distribuer à ses salariés, (ii) un lien vers son
              espace admin ELSAI, (iii) un lien vers le portail de facturation. Les codes sont
              strictement confidentiels&nbsp;; leur diffusion au-delà du périmètre contractuel est
              interdite.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">4. Tarifs</h2>
            <p>
              Les tarifs sont exprimés en euros hors taxes (HT), par siège salarié et par mois.
              TVA au taux en vigueur (20 % en France) en sus. Tarifs publics au jour de
              souscription :
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Essentiel : 3 € / siège / mois HT</li>
              <li>Premium : 5 € / siège / mois HT</li>
              <li>Sur mesure : tarification négociée par devis</li>
            </ul>
            <p className="mt-3">
              Une remise de 10 % est appliquée en cas de paiement annuel à échoir. Les tarifs
              peuvent être révisés annuellement, avec préavis de trois (3) mois notifié au Client.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">
              5. Durée & engagement
            </h2>
            <p>
              Les offres Essentiel et Premium sont souscrites pour une <strong>durée initiale de
              douze (12) mois</strong> à compter de l'activation, reconduite tacitement par périodes
              de douze (12) mois. L'offre Sur mesure est souscrite pour une durée initiale de
              vingt-quatre (24) mois, sauf stipulation contraire au devis.
            </p>
            <p className="mt-3">
              Le Client peut ajuster le nombre de sièges à la hausse à tout moment (facturation
              proratisée) ou à la baisse en fin de période d'engagement.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">6. Facturation & paiement</h2>
            <p>
              La facturation est émise mensuellement ou annuellement selon la cadence choisie.
              Modes de paiement acceptés : carte bancaire (via Stripe) et prélèvement SEPA B2B. Les
              factures sont émises électroniquement, au nom du Client, conformes aux mentions
              légales françaises (TVA intracommunautaire, SIRET, etc.).
            </p>
            <p className="mt-3">
              Délai de paiement : à réception pour le paiement CB, 30 jours pour le SEPA. Tout
              retard entraîne de plein droit l'application de pénalités au taux BCE majoré de 10
              points, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 €
              (art. L.441-10 du Code de commerce).
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">
              7. Résiliation
            </h2>
            <p>
              <strong>Résiliation par le Client en fin d'engagement :</strong> notification par
              lettre recommandée ou depuis l'espace admin, avec un préavis de deux (2) mois avant
              l'échéance.
            </p>
            <p className="mt-3">
              <strong>Résiliation anticipée :</strong> en cas de résiliation avant le terme de la
              période d'engagement à l'initiative du Client, pour un autre motif qu'un manquement
              grave du Prestataire, le solde de la période d'engagement restant dû demeure
              exigible.
            </p>
            <p className="mt-3">
              <strong>Résiliation pour manquement :</strong> chacune des parties peut résilier le
              contrat en cas de manquement grave de l'autre partie non régularisé dans un délai
              de trente (30) jours suivant mise en demeure restée infructueuse.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">
              8. Confidentialité & anonymat des salariés
            </h2>
            <p>
              Le Prestataire s'engage à ne jamais communiquer au Client l'identité des salariés
              utilisant le service, ni le contenu des échanges, même sur demande. Les codes
              d'accès sont distribués par le Client selon ses propres modalités, sans collecte
              d'identifiant côté ELSAI. Le reporting fourni au Client est strictement agrégé et
              anonymisé (taux d'usage global, grandes thématiques). Cette règle est non
              négociable&nbsp;: elle est la condition même de l'efficacité du service.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">
              9. Données personnelles
            </h2>
            <p>
              Le traitement des données est détaillé dans la{" "}
              <Link href="/confidentialite" className="text-elsai-pin-dark underline">
                politique de confidentialité
              </Link>
              . Pour les données salariés, le Prestataire agit en qualité de responsable de
              traitement propre (et non de sous-traitant du Client), dans la mesure où il
              détermine seul les finalités et moyens du traitement (conseil social anonyme). Le
              Client reconnaît et accepte cette qualification.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">
              10. Obligations du Client
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>distribuer les codes d'accès exclusivement à ses salariés&nbsp;;</li>
              <li>ne pas revendre, sous-licencier ni mettre à disposition le service à des tiers&nbsp;;</li>
              <li>révoquer sans délai les codes des salariés quittant l'entreprise&nbsp;;</li>
              <li>notifier au Prestataire tout usage frauduleux constaté.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">
              11. Disponibilité & maintenance
            </h2>
            <p>
              Le Prestataire s'engage à une disponibilité du service d'au moins 99 % en moyenne
              mensuelle, hors maintenance programmée (annoncée 48 h à l'avance) et cas de force
              majeure. ELSAI n'étant pas un service d'urgence, aucune garantie n'est donnée sur le
              délai de réponse humaine en dehors des quotas contractuels.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">
              12. Responsabilité
            </h2>
            <p>
              ELSAI fournit une information générale et une orientation&nbsp;; il ne se substitue
              pas à un avis juridique, médical ou à un accompagnement social professionnel. La
              responsabilité du Prestataire est limitée, tous préjudices confondus, aux sommes
              effectivement versées par le Client sur les douze (12) derniers mois. Le Prestataire
              ne peut être tenu responsable de tout préjudice indirect (perte de chance, perte
              d'exploitation, atteinte à l'image).
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">
              13. Sous-traitants techniques
            </h2>
            <p>
              Le Prestataire recourt aux sous-traitants suivants, dûment encadrés par des accords
              conformes au RGPD (art. 28)&nbsp;: <strong>Stripe Payments Europe Ltd.</strong> (Irlande,
              UE) pour la facturation ;{" "}
              <strong>Sendinblue SAS / Brevo</strong> (France, UE) pour l'envoi des emails
              transactionnels ; hébergeur souverain français pour le stockage applicatif. Aucune
              donnée conversationnelle ne transite par Stripe ou Brevo.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">
              14. Droit applicable & juridiction
            </h2>
            <p>
              Les présentes CGV sont soumises au droit français. Tout litige relatif à leur
              interprétation ou à leur exécution relèvera, à défaut de résolution amiable, des
              tribunaux compétents de Paris, nonobstant pluralité de défendeurs ou appel en
              garantie.
            </p>
          </section>

          <p className="text-elsai-ink/60 pt-6 text-sm">
            ⓘ Version provisoire à faire valider par un conseil juridique avant mise en
            production. Dernière mise à jour&nbsp;: avril 2026.
          </p>
        </div>
      </Section>
    </>
  );
}
