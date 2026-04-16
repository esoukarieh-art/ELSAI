"use client";

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
      <header className="bg-elsai-primary text-white px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold">← ELSAI</Link>
        <span className="text-sm">Tableau de bord POC</span>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Métriques (anonymes)</h1>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-xl">
            {error}
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricCard label="Sessions totales" value={metrics.total_sessions} />
            <MetricCard label="Actives (1h)" value={metrics.active_last_hour} highlight />
            <MetricCard label="Conversations" value={metrics.chats_total} />
            <MetricCard label="Documents analysés" value={metrics.ocr_total} />
            <MetricCard
              label="Signaux danger"
              value={metrics.danger_detections_total}
              danger
            />
            <MetricCard label="Droits à l'oubli" value={metrics.forget_requests_total} />
          </div>
        )}

        {metrics && Object.keys(metrics.profile_breakdown).length > 0 && (
          <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="font-bold mb-3">Répartition des profils</h2>
            <ul className="space-y-1">
              {Object.entries(metrics.profile_breakdown).map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span className="capitalize">{k === "adult" ? "Majeurs" : "Mineurs 12-18"}</span>
                  <span className="font-mono">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-6">
          Rafraîchissement automatique toutes les 5 secondes. Aucune donnée utilisateur
          identifiable n'est exposée ici.
        </p>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  highlight,
  danger,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  danger?: boolean;
}) {
  const color = danger
    ? "border-elsai-danger bg-red-50"
    : highlight
    ? "border-elsai-accent bg-amber-50"
    : "border-gray-200 bg-white";
  return (
    <div className={`border rounded-2xl p-4 ${color}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}
