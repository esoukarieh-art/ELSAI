import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité d'ELSAI : données collectées, base légale, hébergement en France, durée de conservation, droits RGPD.",
  alternates: { canonical: "/confidentialite" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Confidentialité" title="Politique de confidentialité">
        Version provisoire — à faire valider par un DPO avant mise en production.
      </PageHero>

      <Section>
        <div className="text-elsai-ink/85 max-w-3xl space-y-14 leading-relaxed">
          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">Données collectées</h2>
            <p>
              ELSAI ne demande aucune donnée identifiante. Les conversations sont conservées
              temporairement pour maintenir le fil d'une session et peuvent être supprimées à tout
              moment via le bouton «&nbsp;Tout oublier&nbsp;».
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">Base légale</h2>
            <p>
              Consentement (utilisation du service) et intérêt légitime (sécurité, prévention des
              abus).
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">Hébergement</h2>
            <p>
              Les données sont hébergées en France chez un hébergeur souverain. Aucun transfert hors
              UE.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">
              Durée de conservation
            </h2>
            <p>
              Session&nbsp;: durée de la session utilisateur. Conversations sauvegardées&nbsp;: 30
              jours maximum, sauf demande d'effacement anticipée.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">Vos droits</h2>
            <p>
              Droit d'accès, de rectification, d'effacement, d'opposition, de portabilité.
              Contact&nbsp;:{" "}
              <a href="mailto:dpo@elsai.fr" className="text-elsai-pin-dark underline">
                dpo@elsai.fr
              </a>
              . Vous pouvez également saisir la CNIL.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">
              Sous-traitants techniques
            </h2>
            <p>
              Pour fournir le service, nous recourons à des sous-traitants dûment encadrés
              (art. 28 RGPD). Aucun contenu conversationnel n'est jamais transmis à ces
              sous-traitants.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="text-elsai-ink/60 text-left text-xs tracking-wider uppercase">
                    <th className="py-2 pr-4">Sous-traitant</th>
                    <th className="py-2 pr-4">Finalité</th>
                    <th className="py-2 pr-4">Données</th>
                    <th className="py-2 pr-4">Hébergement</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  <tr className="border-elsai-pin/10 border-t">
                    <td className="py-3 pr-4 font-semibold">Stripe Payments Europe Ltd.</td>
                    <td className="py-3 pr-4">Facturation B2B (offre entreprises)</td>
                    <td className="py-3 pr-4">
                      Raison sociale, email admin, SIRET, données de paiement
                    </td>
                    <td className="py-3 pr-4">Irlande (UE) / États-Unis</td>
                  </tr>
                  <tr className="border-elsai-pin/10 border-t">
                    <td className="py-3 pr-4 font-semibold">Brevo (Sendinblue SAS)</td>
                    <td className="py-3 pr-4">
                      Envoi d'emails transactionnels (codes d'accès, factures)
                    </td>
                    <td className="py-3 pr-4">Email admin, contenu de l'email</td>
                    <td className="py-3 pr-4">France (UE)</td>
                  </tr>
                  <tr className="border-elsai-pin/10 border-t">
                    <td className="py-3 pr-4 font-semibold">Anthropic / OpenAI</td>
                    <td className="py-3 pr-4">
                      Traitement du langage (chatbot, transcription vocale)
                    </td>
                    <td className="py-3 pr-4">
                      Contenu des messages (anonymes — aucun identifiant transmis)
                    </td>
                    <td className="py-3 pr-4">États-Unis (encadré par CCT)</td>
                  </tr>
                  <tr className="border-elsai-pin/10 border-t">
                    <td className="py-3 pr-4 font-semibold">Hébergeur applicatif</td>
                    <td className="py-3 pr-4">Stockage applicatif & base de données</td>
                    <td className="py-3 pr-4">Sessions anonymes, conversations</td>
                    <td className="py-3 pr-4">France (UE)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-elsai-ink/70 mt-4 text-sm">
              Les données traitées par Stripe et Brevo concernent uniquement la relation
              commerciale avec les entreprises clientes (B2B) — jamais les salariés utilisateurs
              du service, qui restent strictement anonymes.
            </p>
          </section>

          <section>
            <h2 className="text-elsai-pin-dark mb-3 font-serif text-2xl">Cookies</h2>
            <p>
              ELSAI n'utilise aucun cookie de tracking publicitaire. Seul un cookie technique
              strictement nécessaire à la session est utilisé (aucun bandeau requis selon la CNIL).
            </p>
          </section>

          <p className="text-elsai-ink/60 pt-6 text-sm">
            ⓘ Version provisoire à faire valider par un DPO avant mise en production.
          </p>
        </div>
      </Section>
    </>
  );
}
