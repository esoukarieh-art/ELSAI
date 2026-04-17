"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchMetrics, type DashboardMetrics } from "@/lib/api";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchMetrics()
        .then((m) => !cancelled && setMetrics(m))
        .catch((e) => !cancelled && setError(e.message));

    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <main className="min-h-screen">
      <div className="h-1 w-full bg-gradient-to-r from-elsai-pin via-elsai-rose to-elsai-pin" />
      <header className="flex items-center justify-between border-b border-elsai-pin/10 bg-white/80 px-4 py-3 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 font-bold text-elsai-pin-dark">
          <Image src="/logo-elsai.svg" alt="" width={32} height={32} />
          <span>← ELSAI</span>
        </Link>
        <span className="text-sm text-elsai-ink/70">Tableau de bord POC</span>
      </header>

      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-6 font-serif text-3xl text-elsai-pin-dark">
          Métriques <span className="text-elsai-rose">(anonymes)</span>
        </h1>

        {error && (
          <div className="mb-4 rounded-organic border border-elsai-urgence/30 bg-elsai-urgence/10 p-4 text-elsai-urgence">
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
          <div className="mt-8 rounded-organic border border-elsai-pin/15 bg-white/70 p-5 shadow-organic backdrop-blur">
            <h2 className="mb-3 font-serif text-xl text-elsai-pin-dark">Répartition des profils</h2>
            <ul className="space-y-2">
              {Object.entries(metrics.profile_breakdown).map(([k, v]) => (
                <li
                  key={k}
                  className="flex items-center justify-between border-b border-elsai-pin/10 py-1 last:border-0"
                >
                  <span className="flex items-center gap-2 text-elsai-ink">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        k === "minor" ? "bg-elsai-rose" : "bg-elsai-pin"
                      }`}
                    />
                    {k === "adult" ? "Majeurs" : "Mineurs 12-18"}
                  </span>
                  <span className="font-mono font-bold text-elsai-pin-dark">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-6 text-sm leading-relaxed text-elsai-ink/60">
          Rafraîchissement automatique toutes les 5 secondes. Aucune donnée utilisateur identifiable
          n'est exposée ici.
        </p>
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
      <div className="mt-1 text-sm text-elsai-ink/70">{label}</div>
    </div>
  );
}
