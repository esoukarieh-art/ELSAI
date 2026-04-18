"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";
import { createCheckout, type BillingCycle, type BillingPlan } from "@/lib/api";

const PLANS: Record<BillingPlan, { label: string; prix: number }> = {
  essentiel: { label: "Essentiel", prix: 3 },
  premium: { label: "Premium", prix: 5 },
};

function isPlan(v: string | null): v is BillingPlan {
  return v === "essentiel" || v === "premium";
}

export default function SouscrireContent() {
  const params = useSearchParams();
  const planParam = params.get("plan");
  const initialPlan: BillingPlan = isPlan(planParam) ? planParam : "essentiel";

  const [plan, setPlan] = useState<BillingPlan>(initialPlan);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [seats, setSeats] = useState(20);
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => {
    const monthly = seats * PLANS[plan].prix;
    return cycle === "monthly" ? monthly : Math.round(monthly * 12 * 0.9);
  }, [seats, plan, cycle]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { checkout_url } = await createCheckout({
        plan,
        billing_cycle: cycle,
        seats,
        company_name: companyName.trim(),
        admin_email: adminEmail.trim(),
        siret: siret.trim() || undefined,
      });
      window.location.href = checkout_url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de lancer le paiement. Réessayez ou contactez-nous.",
      );
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero eyebrow="Souscription" title="Finalisez votre abonnement ELSAI">
        Votre paiement est traité par Stripe. Après validation, vous recevez immédiatement
        vos codes d'accès par email.
      </PageHero>

      <Section>
        <form
          onSubmit={handleSubmit}
          className="grid gap-8 md:grid-cols-[1fr_360px]"
          noValidate
        >
          <div className="space-y-6">
            <fieldset className="rounded-organic border-elsai-pin/20 bg-elsai-creme border p-6">
              <legend className="text-elsai-pin px-2 text-xs font-semibold tracking-widest uppercase">
                Formule
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(PLANS) as BillingPlan[]).map((p) => (
                  <label
                    key={p}
                    className={`rounded-organic flex cursor-pointer flex-col gap-1 border p-4 transition-colors ${
                      plan === p
                        ? "border-elsai-pin bg-elsai-pin/5"
                        : "border-elsai-pin/20 hover:border-elsai-pin/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={p}
                      checked={plan === p}
                      onChange={() => setPlan(p)}
                      className="sr-only"
                    />
                    <span className="text-elsai-pin-dark font-serif text-lg">
                      {PLANS[p].label}
                    </span>
                    <span className="text-elsai-ink/70 text-sm">
                      {PLANS[p].prix} € / salarié / mois HT
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-5 flex gap-2 text-sm">
                {(["monthly", "yearly"] as BillingCycle[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCycle(c)}
                    aria-pressed={cycle === c}
                    className={`rounded-organic px-4 py-2 font-semibold transition-colors ${
                      cycle === c
                        ? "bg-elsai-pin text-elsai-creme"
                        : "border-elsai-pin/30 text-elsai-ink/70 border"
                    }`}
                  >
                    {c === "monthly" ? "Mensuel" : "Annuel −10%"}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-organic border-elsai-pin/20 bg-elsai-creme border p-6">
              <legend className="text-elsai-pin px-2 text-xs font-semibold tracking-widest uppercase">
                Entreprise
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-elsai-ink/80 font-semibold">Raison sociale *</span>
                  <input
                    required
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    maxLength={200}
                    className="rounded-organic border-elsai-pin/30 focus:border-elsai-pin mt-1 w-full border bg-white px-3 py-2 outline-none"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-elsai-ink/80 font-semibold">SIRET</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value.replace(/\s/g, ""))}
                    maxLength={14}
                    className="rounded-organic border-elsai-pin/30 focus:border-elsai-pin mt-1 w-full border bg-white px-3 py-2 outline-none"
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="text-elsai-ink/80 font-semibold">Email admin *</span>
                  <input
                    required
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="rounded-organic border-elsai-pin/30 focus:border-elsai-pin mt-1 w-full border bg-white px-3 py-2 outline-none"
                  />
                  <span className="text-elsai-ink/60 mt-1 block text-xs">
                    Recevra les codes d'accès et les factures. Un seul email par entreprise.
                  </span>
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="text-elsai-ink/80 font-semibold">
                    Nombre de salariés (sièges) *
                  </span>
                  <input
                    required
                    type="number"
                    min={1}
                    max={10000}
                    value={seats}
                    onChange={(e) => setSeats(Math.max(1, Number(e.target.value) || 1))}
                    className="rounded-organic border-elsai-pin/30 focus:border-elsai-pin mt-1 w-40 border bg-white px-3 py-2 outline-none"
                  />
                </label>
              </div>
            </fieldset>

            <label className="text-elsai-ink/80 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="accent-elsai-pin mt-1"
                required
              />
              <span>
                J'accepte les <Link href="/cgv" className="underline">CGV B2B</Link> et la{" "}
                <Link href="/confidentialite" className="underline">politique de confidentialité</Link>.
                Je confirme que Stripe (hébergé en UE/US) traite les données de paiement.
              </span>
            </label>

            {error && (
              <p className="rounded-organic border-elsai-rose/40 bg-elsai-rose/10 text-elsai-rose-dark border px-4 py-3 text-sm">
                {error}
              </p>
            )}
          </div>

          <aside className="rounded-organic border-elsai-pin/20 bg-elsai-creme sticky top-6 h-fit border p-6">
            <p className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
              Récapitulatif
            </p>
            <dl className="text-elsai-ink/80 mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Formule</dt>
                <dd className="font-semibold">{PLANS[plan].label}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Cadence</dt>
                <dd className="font-semibold">
                  {cycle === "monthly" ? "Mensuelle" : "Annuelle (−10%)"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Sièges</dt>
                <dd className="font-semibold">{seats}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Prix unitaire</dt>
                <dd>{PLANS[plan].prix} € / sal. / mois HT</dd>
              </div>
            </dl>
            <hr className="border-elsai-pin/15 my-4" />
            <div className="flex items-baseline justify-between">
              <span className="text-elsai-ink/70 text-sm">
                Total {cycle === "monthly" ? "/ mois" : "/ an"} HT
              </span>
              <span className="text-elsai-pin-dark font-serif text-2xl">
                {total.toLocaleString("fr-FR")} €
              </span>
            </div>
            <p className="text-elsai-ink/60 mt-1 text-xs">TVA 20 % en sus (collectée par Stripe).</p>
            <button
              type="submit"
              disabled={loading || !consent}
              className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark mt-6 inline-flex w-full items-center justify-center gap-2 px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Redirection…" : "Payer avec Stripe →"}
            </button>
            <p className="text-elsai-ink/60 mt-3 text-xs leading-relaxed">
              Paiement sécurisé par <strong>Stripe</strong>. CB, SEPA (B2B). Vous pourrez résilier
              depuis votre portail client dans les limites de l'engagement 12 mois (CGV).
            </p>
          </aside>
        </form>
      </Section>
    </>
  );
}
