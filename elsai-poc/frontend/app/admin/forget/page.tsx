"use client";

import { useEffect, useState } from "react";

import { fetchForgetRequests, type ForgetEvent } from "@/lib/api";

export default function ForgetPage() {
  const [events, setEvents] = useState<ForgetEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForgetRequests()
      .then(setEvents)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <h1 className="text-elsai-pin-dark mb-2 font-serif text-3xl">Droit à l'oubli</h1>
      <p className="text-elsai-ink/70 mb-6 text-sm">
        Historique des demandes de suppression (purge totale des conversations). Aucun lien avec
        une personne : ce journal atteste uniquement du respect de l'engagement RGPD.
      </p>

      {error && (
        <div className="rounded-organic border-elsai-urgence/30 bg-elsai-urgence/10 text-elsai-urgence mb-4 border p-4">
          {error}
        </div>
      )}

      <div className="rounded-organic border-elsai-pin/15 shadow-organic border bg-white/80 p-5 backdrop-blur">
        <p className="text-elsai-pin-dark mb-4 font-serif text-2xl">
          {events.length} <span className="text-elsai-ink/60 text-sm font-sans">suppressions exécutées</span>
        </p>

        <ul className="max-h-96 space-y-1 overflow-y-auto text-sm">
          {events.map((e) => (
            <li
              key={e.id}
              className="border-elsai-pin/10 flex items-center justify-between border-b py-1 last:border-0"
            >
              <span className="text-elsai-ink/80">
                {new Date(e.created_at).toLocaleString("fr-FR")}
              </span>
              <span
                className={`rounded-organic border px-2 py-0.5 text-xs ${
                  e.profile === "minor"
                    ? "border-elsai-rose/30 bg-elsai-rose/10 text-elsai-rose-dark"
                    : "border-elsai-pin/30 bg-elsai-pin/5 text-elsai-pin-dark"
                }`}
              >
                {e.profile === "minor" ? "Mineur" : "Majeur"}
              </span>
            </li>
          ))}
          {events.length === 0 && (
            <li className="text-elsai-ink/60 text-sm">Aucune demande enregistrée.</li>
          )}
        </ul>
      </div>
    </>
  );
}
