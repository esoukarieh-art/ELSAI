"use client";

import { useEffect, useState } from "react";

import { type DashboardMetrics, fetchMetrics } from "@/lib/api";

export default function AdminHome() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchMetrics()
        .then((m) => {
          if (!cancelled) {
            setMetrics(m);
            setError(null);
          }
        })
        .catch((e: Error) => !cancelled && setError(e.message));
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
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
          <Card label="Sessions totales" value={metrics.total_sessions} />
          <Card label="Actives (1h)" value={metrics.active_last_hour} accent="rose" />
          <Card label="Conversations" value={metrics.chats_total} />
          <Card label="Documents analysés" value={metrics.ocr_total} />
          <Card label="Signaux de danger" value={metrics.danger_detections_total} accent="urgence" />
          <Card label="Droits à l'oubli" value={metrics.forget_requests_total} accent="rose" />
        </div>
      )}

      {metrics && Object.keys(metrics.profile_breakdown).length > 0 && (
        <div className="rounded-organic border-elsai-pin/15 shadow-organic mt-8 border bg-white/70 p-5 backdrop-blur">
          <h2 className="text-elsai-pin-dark mb-3 font-serif text-xl">Répartition des profils</h2>
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
        Rafraîchissement automatique toutes les 5 secondes. Aucune donnée utilisateur identifiable
        n'est exposée ici.
      </p>
    </>
  );
}

function Card({
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
