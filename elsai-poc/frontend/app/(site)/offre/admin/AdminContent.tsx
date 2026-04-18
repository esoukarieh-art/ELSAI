"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";
import {
  fetchOrganization,
  openBillingPortal,
  regenerateCode,
  resendActivationEmail,
  revokeCode,
  type OrganizationView,
} from "@/lib/api";

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente de paiement",
  active: "Actif",
  past_due: "Paiement en retard",
  canceled: "Résilié",
};

export default function AdminContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [org, setOrg] = useState<OrganizationView | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchOrganization(token);
      setOrg(data);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!token) {
    return (
      <>
        <PageHero eyebrow="Espace admin" title="Lien invalide">
          Le lien d'accès à votre espace admin doit contenir un token. Retrouvez-le dans
          l'email d'activation reçu après votre souscription.
        </PageHero>
      </>
    );
  }

  async function handleRevoke(codeId: string) {
    if (!token) return;
    if (!confirm("Révoquer ce code ? Le salarié ne pourra plus l'utiliser.")) return;
    setBusy(true);
    try {
      await revokeCode(token, codeId);
      await reload();
      setFlash("Code révoqué.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegenerate(codeId: string) {
    if (!token) return;
    if (!confirm("Regénérer ce code ? L'ancien sera révoqué.")) return;
    setBusy(true);
    try {
      await regenerateCode(token, codeId);
      await reload();
      setFlash("Nouveau code généré.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (!token) return;
    setBusy(true);
    try {
      const { sent } = await resendActivationEmail(token);
      setFlash(sent ? "Email renvoyé." : "Service email non configuré — contactez le support.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function handlePortal() {
    if (!org) return;
    setBusy(true);
    try {
      const url = await openBillingPortal(org.id);
      window.open(url, "_blank");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Espace admin entreprise"
        title={org ? org.company_name : "Chargement…"}
      >
        Gérez les codes d'accès distribués à vos salariés et votre abonnement.
      </PageHero>

      <Section>
        {err && (
          <p className="rounded-organic border-elsai-rose/40 bg-elsai-rose/10 text-elsai-rose-dark mb-6 border px-4 py-3 text-sm">
            {err}
          </p>
        )}
        {flash && (
          <p className="rounded-organic border-elsai-pin/40 bg-elsai-pin/10 text-elsai-pin-dark mb-6 border px-4 py-3 text-sm">
            {flash}
          </p>
        )}

        {org && (
          <>
            <dl className="rounded-organic border-elsai-pin/20 bg-elsai-creme mb-8 grid gap-4 border p-6 sm:grid-cols-4">
              <div>
                <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                  Statut
                </dt>
                <dd className="text-elsai-ink mt-1 font-semibold">
                  {STATUS_LABEL[org.status] ?? org.status}
                </dd>
              </div>
              <div>
                <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                  Formule
                </dt>
                <dd className="mt-1 capitalize">{org.plan}</dd>
              </div>
              <div>
                <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                  Sièges
                </dt>
                <dd className="mt-1">
                  {org.codes.filter((c) => !c.revoked_at).length} actifs / {org.seats}
                </dd>
              </div>
              <div>
                <dt className="text-elsai-pin text-xs font-semibold tracking-widest uppercase">
                  Admin
                </dt>
                <dd className="text-elsai-ink/80 mt-1 text-sm">{org.admin_email}</dd>
              </div>
            </dl>

            <div className="mb-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={busy}
                className="rounded-organic border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/5 border px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Renvoyer l'email d'activation
              </button>
              <button
                type="button"
                onClick={handlePortal}
                disabled={busy}
                className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Gérer facturation (Stripe) →
              </button>
            </div>

            <h2 className="text-elsai-pin-dark mb-4 font-serif text-2xl">Codes d'accès</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="text-elsai-ink/60 text-left text-xs tracking-wider uppercase">
                    <th className="py-3 pr-4">Code</th>
                    <th className="py-3 pr-4">État</th>
                    <th className="py-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {org.codes.map((c) => (
                    <tr key={c.id} className="border-elsai-pin/10 border-t">
                      <td className="py-3 pr-4 font-mono">{c.code}</td>
                      <td className="py-3 pr-4">
                        {c.revoked_at ? (
                          <span className="text-elsai-rose-dark">Révoqué</span>
                        ) : (
                          <span className="text-elsai-pin-dark">Actif</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {!c.revoked_at && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleRegenerate(c.id)}
                              disabled={busy}
                              className="text-elsai-pin-dark text-xs font-semibold underline disabled:opacity-50"
                            >
                              Regénérer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevoke(c.id)}
                              disabled={busy}
                              className="text-elsai-rose-dark text-xs font-semibold underline disabled:opacity-50"
                            >
                              Révoquer
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>
    </>
  );
}
