"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  activateLeadMagnet,
  deleteLeadMagnet,
  getLeadMagnet,
  updateLeadMagnet,
  type LeadMagnetRow,
} from "@/lib/admin/leadMagnetsApi";

const AUDIENCES = ["adult", "minor", "b2b", "all"];

export default function LeadMagnetEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [row, setRow] = useState<LeadMagnetRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getLeadMagnet(id);
        if (!cancelled) setRow(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return <p className="text-sm text-elsai-rose">{error}</p>;
  }
  if (!row) {
    return <p className="text-sm text-slate-400">Chargement…</p>;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!row) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateLeadMagnet(row.id, {
        title: row.title,
        description: row.description,
        audience: row.audience,
        file_url: row.file_url,
        trigger_sequence_key: row.trigger_sequence_key,
        active: row.active,
      });
      setRow(updated);
      setMessage("Enregistré.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate() {
    if (!row) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await activateLeadMagnet(row.id);
      setRow(updated);
      setMessage("Activé.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!row) return;
    if (!confirm(`Supprimer définitivement "${row.key}" ?`)) return;
    setSaving(true);
    try {
      await deleteLeadMagnet(row.id);
      router.push("/admin/leadmagnets");
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-elsai-pin">Lead magnet — {row.key}</h1>
        <Link href="/admin/leadmagnets" className="text-sm text-elsai-pin hover:underline">
          ← Retour
        </Link>
      </div>

      {error && <p className="mb-3 text-sm text-elsai-rose">{error}</p>}
      {message && <p className="mb-3 text-sm text-elsai-pin">{message}</p>}

      <form onSubmit={handleSave} className="space-y-4 rounded-organic border border-elsai-pin/15 bg-white/70 p-5">
        <label className="block text-sm">
          <span className="text-slate-700">Titre</span>
          <input
            type="text"
            value={row.title}
            onChange={(e) => setRow({ ...row, title: e.target.value })}
            className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700">Description</span>
          <textarea
            value={row.description ?? ""}
            onChange={(e) => setRow({ ...row, description: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700">Audience</span>
          <select
            value={row.audience}
            onChange={(e) => setRow({ ...row, audience: e.target.value })}
            className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2"
          >
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-slate-700">URL fichier (PDF)</span>
          <input
            type="url"
            value={row.file_url ?? ""}
            onChange={(e) => setRow({ ...row, file_url: e.target.value || null })}
            placeholder="https://elsai.fr/static/leadmagnets/guide.pdf"
            className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700">Clé séquence Brevo (trigger_sequence_key)</span>
          <input
            type="text"
            value={row.trigger_sequence_key ?? ""}
            onChange={(e) => setRow({ ...row, trigger_sequence_key: e.target.value || null })}
            placeholder="b2c_guide_18ans"
            className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2 font-mono text-xs"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={row.active}
            onChange={(e) => setRow({ ...row, active: e.target.checked })}
          />
          <span>Actif (visible côté public)</span>
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-organic bg-elsai-pin px-4 py-2 text-sm text-elsai-cream hover:bg-elsai-pin/90 disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {!row.active && row.file_url && (
            <button
              type="button"
              onClick={handleActivate}
              disabled={saving}
              className="rounded-organic border border-elsai-pin px-4 py-2 text-sm text-elsai-pin hover:bg-elsai-pin/10"
            >
              Activer
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="ml-auto rounded-organic border border-elsai-rose px-4 py-2 text-sm text-elsai-rose hover:bg-elsai-rose/10"
          >
            Supprimer
          </button>
        </div>
      </form>
    </div>
  );
}
