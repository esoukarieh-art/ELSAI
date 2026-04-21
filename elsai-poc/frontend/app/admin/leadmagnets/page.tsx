"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listLeadMagnets, type LeadMagnetRow } from "@/lib/admin/leadMagnetsApi";

export default function LeadMagnetsListPage() {
  const [rows, setRows] = useState<LeadMagnetRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listLeadMagnets();
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-elsai-pin">Lead magnets</h1>
          <p className="text-sm text-slate-600">
            Guides PDF déclencheurs de séquence Brevo.
          </p>
        </div>
        <Link
          href="/admin/leadmagnets/new"
          className="rounded-organic bg-elsai-pin px-4 py-2 text-sm text-elsai-cream hover:bg-elsai-pin/90"
        >
          + Nouveau magnet
        </Link>
      </div>

      {error && (
        <p className="mb-3 rounded-organic border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-elsai-rose">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-organic border border-elsai-pin/15 bg-white/70">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">Clé</th>
              <th className="px-3 py-2 text-left">Titre</th>
              <th className="px-3 py-2 text-left">Audience</th>
              <th className="px-3 py-2 text-left">Fichier</th>
              <th className="px-3 py-2 text-left">Séquence</th>
              <th className="px-3 py-2 text-left">Actif</th>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-slate-400">
                  Aucun lead magnet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className={`border-t border-slate-100 hover:bg-elsai-pin/5 ${
                  !r.active ? "opacity-60" : ""
                }`}
              >
                <td className="px-3 py-2 font-mono text-xs">{r.key}</td>
                <td className="px-3 py-2">{r.title}</td>
                <td className="px-3 py-2">
                  <span className="rounded-organic bg-slate-100 px-2 py-0.5 text-[11px] uppercase">
                    {r.audience}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.file_url ? (
                    <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-elsai-pin hover:underline">
                      voir
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-500">
                  {r.trigger_sequence_key ?? "—"}
                </td>
                <td className="px-3 py-2">{r.active ? "✓" : "✗"}</td>
                <td className="px-3 py-2">
                  <Link href={`/admin/leadmagnets/${r.id}`} className="text-elsai-pin hover:underline">
                    Modifier
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && <p className="mt-2 text-xs text-slate-400">Chargement…</p>}
    </div>
  );
}
