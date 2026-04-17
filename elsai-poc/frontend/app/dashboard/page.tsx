"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ForgetButton } from "@/components/ForgetButton";
import {
  clearAdminToken,
  type DashboardMetrics,
  fetchMetrics,
  getAdminToken,
  setAdminToken,
} from "@/lib/api";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  useEffect(() => {
    setAuthed(!!getAdminToken());
  }, []);

  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    const load = () =>
      fetchMetrics()
        .then((m) => {
          if (cancelled) return;
          setMetrics(m);
          setError(null);
        })
        .catch((e: Error) => {
          if (cancelled) return;
          if (e.message === "UNAUTHORIZED") {
            clearAdminToken();
            setAuthed(false);
            setError("Token admin invalide.");
          } else if (e.message === "ADMIN_DISABLED") {
            setError("Dashboard désactivé : ADMIN_TOKEN non configuré côté serveur.");
          } else {
            setError(e.message);
          }
        });

    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [authed]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setAdminToken(tokenInput.trim());
    setAuthed(true);
    setError(null);
  }

  function handleLogout() {
    clearAdminToken();
    setAuthed(false);
    setMetrics(null);
  }

  return (
    <main className="min-h-screen">
      <div className="from-elsai-pin via-elsai-rose to-elsai-pin h-1 w-full bg-gradient-to-r" />
      <header className="border-elsai-pin/10 flex items-center justify-between border-b bg-white/80 px-4 py-3 backdrop-blur">
        <Link href="/" className="text-elsai-pin-dark flex items-center gap-2 font-bold">
          <Image src="/logo-elsai.svg" alt="" width={32} height={32} />
          <span>← ELSAI</span>
        </Link>
        <div className="text-elsai-ink/70 flex items-center gap-4 text-sm">
          <span>Tableau de bord POC</span>
          {authed && (
            <button onClick={handleLogout} className="hover:text-elsai-pin transition-colors">
              Déconnexion admin
            </button>
          )}
          <ForgetButton />
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-6">
        {!authed ? (
          <form
            onSubmit={handleLogin}
            className="rounded-organic border-elsai-pin/15 shadow-organic mx-auto mt-10 max-w-md space-y-4 border bg-white/70 p-6 backdrop-blur"
          >
            <h1 className="text-elsai-pin-dark font-serif text-2xl">Accès restreint</h1>
            <p className="text-elsai-ink/70 text-sm leading-relaxed">
              Ce tableau de bord est réservé aux administrateurs. Saisissez votre token admin pour
              continuer.
            </p>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Token admin"
              className="border-elsai-pin/20 focus:border-elsai-pin rounded-organic w-full border bg-white/80 px-4 py-2 focus:outline-none"
              autoFocus
            />
            {error && <p className="text-elsai-urgence text-sm">{error}</p>}
            <button
              type="submit"
              className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark w-full px-6 py-2 transition-colors"
            >
              Valider
            </button>
          </form>
        ) : (
          <>
            <h1 className="text-elsai-pin-dark mb-6 font-serif text-3xl">
              Métriques <span className="text-elsai-rose">(anonymes)</span>
            </h1>

            {error && (
              <div className="rounded-organic border-elsai-urgence/30 bg-elsai-urgence/10 text-elsai-urgence mb-4 border p-4">
                {error}
              </div>
            )}

            {metrics && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <MetricCard label="Sessions totales" value={metrics.total_sessions} />
                <MetricCard label="Actives (1h)" value={metrics.active_last_hour} accent="rose" />
                <MetricCard label="Conversations" value={metrics.chats_total} />
                <MetricCard label="Documents analysés" value={metrics.ocr_total} />
                <MetricCard
                  label="Signaux de danger"
                  value={metrics.danger_detections_total}
                  accent="urgence"
                />
                <MetricCard
                  label="Droits à l'oubli"
                  value={metrics.forget_requests_total}
                  accent="rose"
                />
              </div>
            )}

            {metrics && Object.keys(metrics.profile_breakdown).length > 0 && (
              <div className="rounded-organic border-elsai-pin/15 shadow-organic mt-8 border bg-white/70 p-5 backdrop-blur">
                <h2 className="text-elsai-pin-dark mb-3 font-serif text-xl">
                  Répartition des profils
                </h2>
                <ul className="space-y-2">
                  {Object.entries(metrics.profile_breakdown).map(([k, v]) => (
                    <li
                      key={k}
                      className="border-elsai-pin/10 flex items-center justify-between border-b py-1 last:border-0"
                    >
                      <span className="text-elsai-ink flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            k === "minor" ? "bg-elsai-rose" : "bg-elsai-pin"
                          }`}
                        />
                        {k === "adult" ? "Majeurs" : "Mineurs 12-18"}
                      </span>
                      <span className="text-elsai-pin-dark font-mono font-bold">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-elsai-ink/60 mt-6 text-sm leading-relaxed">
              Rafraîchissement automatique toutes les 5 secondes. Aucune donnée utilisateur
              identifiable n'est exposée ici.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "rose" | "urgence";
}) {
  let style = "border-elsai-pin/15 bg-white/80 shadow-organic";
  let valueColor = "text-elsai-pin-dark";

  if (accent === "rose") {
    style = "border-elsai-rose/30 bg-elsai-rose/10 shadow-warm";
    valueColor = "text-elsai-rose-dark";
  } else if (accent === "urgence") {
    style = "border-elsai-urgence/30 bg-elsai-urgence/5";
    valueColor = "text-elsai-urgence";
  }

  return (
    <div className={`rounded-organic border p-5 backdrop-blur ${style}`}>
      <div className={`font-serif text-4xl font-bold ${valueColor}`}>{value}</div>
      <div className="text-elsai-ink/70 mt-1 text-sm">{label}</div>
    </div>
  );
}
