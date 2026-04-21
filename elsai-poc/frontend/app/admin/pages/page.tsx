"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listPages, type PageRow } from "@/lib/admin/pagesApi";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "published" ? "Publié" : status === "draft" ? "Brouillon" : status;
  const cls =
    status === "published"
      ? "bg-emerald-100 text-emerald-700"
      : status === "draft"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-600";
  return (
    <span className={`rounded-organic px-2 py-0.5 text-[11px] font-semibold uppercase ${cls}`}>
      {label}
    </span>
  );
}

export default function PagesListPage() {
  const [rows, setRows] = useState<PageRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listPages();
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
          <h1 className="font-serif text-3xl text-elsai-pin">Pages du site</h1>
          <p className="text-sm text-slate-600">
            Contenu éditable des pages statiques (accueil, etc.) avec workflow brouillon / publication.
          </p>
        </div>
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
              <th className="px-3 py-2 text-left">Statut</th>
              <th className="px-3 py-2 text-left">Brouillon</th>
              <th className="px-3 py-2 text-left">Dernière modif</th>
              <th className="px-3 py-2 text-left">Par</th>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-slate-400">
                  Aucune page déclarée.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.page_key} className="border-t border-slate-100 hover:bg-elsai-pin/5">
                <td className="px-3 py-2 font-mono text-xs">{r.page_key}</td>
                <td className="px-3 py-2">{r.title}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-3 py-2">
                  {r.has_draft ? (
                    <span className="rounded-organic bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700">
                      Non publié
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">{formatDate(r.updated_at)}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{r.updated_by ?? "—"}</td>
                <td className="px-3 py-2">
                  {r.status === "missing" ? (
                    <span className="text-xs text-slate-400">seed manquant</span>
                  ) : (
                    <Link
                      href={`/admin/pages/${r.page_key}`}
                      className="text-elsai-pin hover:underline"
                    >
                      Modifier
                    </Link>
                  )}
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
