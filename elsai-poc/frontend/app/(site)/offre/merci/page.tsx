import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Merci — abonnement ELSAI confirmé",
  description: "Votre abonnement ELSAI est en cours d'activation.",
  alternates: { canonical: "/offre/merci" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Confirmation" title="Paiement reçu — merci !">
        Votre abonnement ELSAI est en cours d'activation. Vous allez recevoir un email
        dans les prochaines minutes avec vos codes d'accès et un lien vers votre espace admin.
      </PageHero>

      <Section>
        <div className="rounded-organic border-elsai-pin/20 bg-elsai-creme max-w-2xl border p-8">
          <h2 className="text-elsai-pin-dark font-serif text-2xl">Prochaines étapes</h2>
          <ol className="text-elsai-ink/85 mt-5 space-y-3 text-sm leading-relaxed">
            <li>
              <strong>1.</strong> Vérifiez la boîte de réception de l'email administrateur
              (pensez aux spams).
            </li>
            <li>
              <strong>2.</strong> Distribuez les codes d'accès à vos salariés avec le kit de
              communication fourni.
            </li>
            <li>
              <strong>3.</strong> Utilisez votre espace admin pour révoquer ou regénérer des
              codes à tout moment.
            </li>
          </ol>

          <p className="text-elsai-ink/70 mt-6 text-sm">
            Pas reçu l'email sous 10 min ?{" "}
            <Link href="/contact?sujet=activation" className="text-elsai-pin-dark underline">
              Contactez-nous
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
