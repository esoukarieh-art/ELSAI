"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { listRevisions, revertPost } from "@/lib/admin/contentApi";
import type { RevisionRow } from "@/lib/admin/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR");
}

export default function RevisionsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [rows, setRows] = useState<RevisionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function load() {
    try {
      setRows(await listRevisions(id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleRevert(rid: number) {
    if (!window.confirm("Restaurer cette révision ? L'état actuel sera snapshoté avant.")) return;
    try {
      await revertPost(id, rid);
      setInfo("Révision restaurée.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <Link href={`/admin/blog/${id}`} className="text-elsai-pin-dark text-xs hover:underline">
        ← Retour à l'éditeur
      </Link>
      <h1 className="text-elsai-pin-dark mb-4 font-serif text-2xl">Historique des révisions</h1>

      {error && (
        <p className="text-elsai-urgence rounded-organic mb-3 border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {info && (
        <p className="mb-3 rounded-organic border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {info}
        </p>
      )}

      <div className="rounded-organic border-elsai-pin/15 bg-white/70 border">
        <table className="w-full text-sm">
          <thead className="text-elsai-ink/60 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Auteur</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="text-elsai-ink/50 px-3 py-4 text-center">
                  Aucune révision.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{r.id}</td>
                <td className="px-3 py-2">{r.author_email ?? "—"}</td>
                <td className="px-3 py-2">{formatDate(r.created_at)}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleRevert(r.id)}
                    className="text-elsai-pin-dark text-xs underline"
                  >
                    Restaurer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
