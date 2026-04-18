"use client";

import { useEffect, useState } from "react";

import {
  type AlertStatus,
  type DangerAlert,
  fetchAlerts,
  updateAlert,
} from "@/lib/api";

const STATUS_LABELS: Record<AlertStatus, string> = {
  new: "Nouveau",
  reviewing: "En cours",
  escalated_119: "Escaladé 119",
  closed: "Clôturé",
};

const STATUS_COLORS: Record<AlertStatus, string> = {
  new: "bg-elsai-urgence/10 text-elsai-urgence border-elsai-urgence/30",
  reviewing: "bg-elsai-rose/10 text-elsai-rose-dark border-elsai-rose/30",
  escalated_119: "bg-elsai-pin/10 text-elsai-pin-dark border-elsai-pin/30",
  closed: "bg-gray-100 text-gray-600 border-gray-300",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<DangerAlert[]>([]);
  const [filter, setFilter] = useState<AlertStatus | "all">("new");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function load() {
    try {
      const data = await fetchAlerts(filter === "all" ? undefined : filter);
      setAlerts(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function handleUpdate(id: string, status: AlertStatus) {
    try {
      await updateAlert(id, status, editing === id ? note : undefined);
      setEditing(null);
      setNote("");
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <h1 className="text-elsai-pin-dark mb-2 font-serif text-3xl">Alertes mineurs</h1>
      <p className="text-elsai-ink/70 mb-6 text-sm">
        Détections de danger remontées automatiquement. Protection enfance : toute escalade vers le
        119 doit être documentée.
      </p>

      <div className="mb-4 flex gap-2">
        {(["new", "reviewing", "escalated_119", "closed", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-organic border px-3 py-1 text-xs transition-colors ${
              filter === s
                ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                : "border-elsai-pin/20 text-elsai-pin-dark bg-white/70"
            }`}
          >
            {s === "all" ? "Toutes" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-organic border-elsai-urgence/30 bg-elsai-urgence/10 text-elsai-urgence mb-4 border p-4">
          {error}
        </div>
      )}

      {alerts.length === 0 ? (
        <p className="text-elsai-ink/60 text-sm">Aucune alerte.</p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="rounded-organic border-elsai-pin/15 shadow-organic border bg-white/80 p-4 backdrop-blur"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-organic border px-2 py-0.5 text-xs ${STATUS_COLORS[a.status]}`}
                >
                  {STATUS_LABELS[a.status]}
                </span>
                <span className="text-elsai-ink/60 text-xs">
                  {new Date(a.created_at).toLocaleString("fr-FR")}
                </span>
                <span className="text-elsai-ink/60 text-xs">
                  source : <strong>{a.source}</strong>
                </span>
                <span className="text-elsai-ink/60 font-mono text-xs">
                  session {a.session_id.slice(0, 8)}…
                </span>
              </div>
              <p className="text-elsai-ink mb-3 text-sm italic">« {a.excerpt} »</p>

              {a.reviewer_note && (
                <p className="text-elsai-pin-dark bg-elsai-pin/5 rounded-organic mb-3 p-2 text-xs">
                  Note : {a.reviewer_note}
                </p>
              )}

              {editing === a.id ? (
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note interne (action prise, 119 contacté…)"
                  className="border-elsai-pin/20 rounded-organic mb-2 w-full border bg-white/80 p-2 text-sm"
                  rows={2}
                />
              ) : null}

              <div className="flex flex-wrap gap-2">
                {editing !== a.id && (
                  <button
                    onClick={() => {
                      setEditing(a.id);
                      setNote(a.reviewer_note ?? "");
                    }}
                    className="border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/5 rounded-organic border px-3 py-1 text-xs"
                  >
                    Ajouter / modifier note
                  </button>
                )}
                {(["reviewing", "escalated_119", "closed"] as AlertStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUpdate(a.id, s)}
                    disabled={a.status === s}
                    className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-3 py-1 text-xs transition-colors disabled:opacity-30"
                  >
                    → {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
