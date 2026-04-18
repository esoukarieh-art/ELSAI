"use client";

import { useEffect, useState } from "react";

import { type AuditEntry, fetchAudit } from "@/lib/api";

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await fetchAudit(filter || undefined);
      setEntries(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <>
      <h1 className="text-elsai-pin-dark mb-2 font-serif text-3xl">Journal d'audit</h1>
      <p className="text-elsai-ink/70 mb-6 text-sm">
        Traces anonymisées des actions admin et événements sensibles (édition de prompt, gestion
        d'alerte, droit à l'oubli).
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {["", "prompt.update", "prompt.reset", "alert.status_change", "forget.executed"].map(
          (a) => (
            <button
              key={a || "all"}
              onClick={() => setFilter(a)}
              className={`rounded-organic border px-3 py-1 text-xs transition-colors ${
                filter === a
                  ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                  : "border-elsai-pin/20 text-elsai-pin-dark bg-white/70"
              }`}
            >
              {a || "Tous"}
            </button>
          ),
        )}
      </div>

      {error && (
        <div className="rounded-organic border-elsai-urgence/30 bg-elsai-urgence/10 text-elsai-urgence mb-4 border p-4">
          {error}
        </div>
      )}

      <div className="rounded-organic border-elsai-pin/15 shadow-organic overflow-hidden border bg-white/80 backdrop-blur">
        <table className="w-full text-left text-sm">
          <thead className="bg-elsai-pin/5 text-elsai-pin-dark text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Horodatage</th>
              <th className="px-3 py-2">Acteur</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Cible</th>
              <th className="px-3 py-2">Détails</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-elsai-pin/10 border-t">
                <td className="px-3 py-2 text-xs">
                  {new Date(e.created_at).toLocaleString("fr-FR")}
                </td>
                <td className="px-3 py-2 text-xs">{e.actor}</td>
                <td className="px-3 py-2 font-mono text-xs">{e.action}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {e.target_type ? `${e.target_type} ${(e.target_id ?? "").slice(0, 10)}` : "—"}
                </td>
                <td className="text-elsai-ink/70 px-3 py-2 text-xs">{e.details ?? "—"}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="text-elsai-ink/60 px-3 py-6 text-center text-sm">
                  Aucune entrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
