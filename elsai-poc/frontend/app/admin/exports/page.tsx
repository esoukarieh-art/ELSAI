"use client";

import { useState } from "react";

import { downloadExport } from "@/lib/api";

export default function ExportsPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function go(kind: "metrics" | "alerts") {
    setLoading(kind);
    setError(null);
    try {
      await downloadExport(kind);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <h1 className="text-elsai-pin-dark mb-2 font-serif text-3xl">Exports statistiques</h1>
      <p className="text-elsai-ink/70 mb-6 text-sm">
        Rapports CSV anonymisés destinés aux partenaires publics (DREES, collectivités) ou aux
        clients B2B. Aucune donnée utilisateur identifiable n'est exportée.
      </p>

      {error && (
        <div className="rounded-organic border-elsai-urgence/30 bg-elsai-urgence/10 text-elsai-urgence mb-4 border p-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ExportCard
          title="Métriques globales"
          description="Indicateurs agrégés : sessions, conversations, documents analysés, signaux de danger (avec ventilation mineurs/majeurs), demandes de droit à l'oubli."
          format="CSV · séparateur « ; » · BOM UTF-8 (Excel-friendly)"
          onClick={() => go("metrics")}
          loading={loading === "metrics"}
        />
        <ExportCard
          title="Journal des alertes mineurs"
          description="Liste complète des détections de danger (ID session anonyme, source, statut, extrait tronqué, note interne). Réservé aux modérateurs 119."
          format="CSV · un enregistrement par alerte"
          accent="urgence"
          onClick={() => go("alerts")}
          loading={loading === "alerts"}
        />
      </div>

      <p className="text-elsai-ink/60 mt-6 text-xs">
        Les exports sont tracés dans le journal d'audit (actions <code>export.metrics</code> et{" "}
        <code>export.alerts</code>).
      </p>
    </>
  );
}

function ExportCard({
  title,
  description,
  format,
  onClick,
  loading,
  accent,
}: {
  title: string;
  description: string;
  format: string;
  onClick: () => void;
  loading: boolean;
  accent?: "urgence";
}) {
  const border =
    accent === "urgence"
      ? "border-elsai-urgence/30 bg-elsai-urgence/5"
      : "border-elsai-pin/15 bg-white/80";
  return (
    <div className={`rounded-organic shadow-organic border p-5 backdrop-blur ${border}`}>
      <h2 className="text-elsai-pin-dark mb-2 font-serif text-xl">{title}</h2>
      <p className="text-elsai-ink/80 mb-3 text-sm leading-relaxed">{description}</p>
      <p className="text-elsai-ink/60 mb-4 font-mono text-xs">{format}</p>
      <button
        onClick={onClick}
        disabled={loading}
        className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-4 py-2 text-sm disabled:opacity-50"
      >
        {loading ? "Génération…" : "Télécharger le CSV"}
      </button>
    </div>
  );
}
