"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createLeadMagnet } from "@/lib/admin/leadMagnetsApi";

const AUDIENCES = ["adult", "minor", "b2b", "all"];

export default function NewLeadMagnetPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("adult");
  const [fileUrl, setFileUrl] = useState("");
  const [sequence, setSequence] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const row = await createLeadMagnet({
        key,
        title,
        description: description || null,
        audience,
        file_url: fileUrl || null,
        trigger_sequence_key: sequence || null,
        active: false,
      });
      router.push(`/admin/leadmagnets/${row.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-elsai-pin">Nouveau lead magnet</h1>
        <Link href="/admin/leadmagnets" className="text-sm text-elsai-pin hover:underline">
          ← Retour
        </Link>
      </div>

      {error && <p className="mb-3 text-sm text-elsai-rose">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-organic border border-elsai-pin/15 bg-white/70 p-5">
        <label className="block text-sm">
          <span className="text-slate-700">Clé (slug, unique)</span>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            pattern="[a-z0-9_]+"
            placeholder="guide_droits_18_ans"
            className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2 font-mono text-xs"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700">Titre</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700">Audience</span>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
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
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://elsai.fr/static/leadmagnets/guide.pdf"
            className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700">Clé séquence Brevo</span>
          <input
            type="text"
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
            placeholder="b2c_guide_18ans"
            className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2 font-mono text-xs"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-organic bg-elsai-pin px-4 py-2 text-sm text-elsai-cream hover:bg-elsai-pin/90 disabled:opacity-60"
        >
          {saving ? "Création…" : "Créer"}
        </button>
      </form>
    </div>
  );
}
