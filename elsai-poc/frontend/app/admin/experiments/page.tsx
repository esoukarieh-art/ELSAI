"use client";

import { useEffect, useState } from "react";

import {
  createVariant,
  fetchVariants,
  fetchVariantStats,
  type PromptVariant,
  updateWeights,
  type VariantStats,
} from "@/lib/api";

const PROMPTS = ["system_adult", "system_minor", "ocr_explain"] as const;
const LABELS: Record<string, string> = {
  system_adult: "Majeurs",
  system_minor: "Mineurs 12-18",
  ocr_explain: "OCR — Documents",
};

export default function ExperimentsPage() {
  const [selected, setSelected] = useState<(typeof PROMPTS)[number]>("system_adult");
  const [variants, setVariants] = useState<PromptVariant[]>([]);
  const [stats, setStats] = useState<VariantStats[]>([]);
  const [weights, setWeights] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({ label: "", content: "", weight: 50 });
  const [show, setShow] = useState(false);

  async function load() {
    try {
      const [v, s] = await Promise.all([fetchVariants(selected), fetchVariantStats(selected)]);
      setVariants(v);
      setStats(s);
      setWeights(Object.fromEntries(v.map((x) => [x.id, x.weight])));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  async function saveWeights() {
    try {
      await updateWeights(selected, weights);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function addVariant(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createVariant(selected, newForm.label, newForm.content, newForm.weight);
      setNewForm({ label: "", content: "", weight: 50 });
      setShow(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const statsMap = new Map(stats.map((s) => [s.version_id, s]));
  const totalServed = stats.reduce((a, s) => a + s.messages_served, 0) || 1;

  return (
    <>
      <h1 className="text-elsai-pin-dark mb-2 font-serif text-3xl">A/B testing des prompts</h1>
      <p className="text-elsai-ink/70 mb-6 text-sm">
        Plusieurs variantes peuvent coexister avec des poids. À chaque appel LLM, une variante est
        tirée aléatoirement selon son poids. Les statistiques remontent les messages servis et les
        signaux de danger par variante.
      </p>

      <div className="mb-4 flex gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => setSelected(p)}
            className={`rounded-organic border px-3 py-1 text-xs ${
              selected === p
                ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                : "border-elsai-pin/20 bg-white"
            }`}
          >
            {LABELS[p]}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-organic border-elsai-urgence/30 bg-elsai-urgence/10 text-elsai-urgence mb-4 border p-4">
          {error}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-elsai-ink/70 text-xs">
          {variants.length} variantes · Poids total : {totalWeight}{" "}
          {totalWeight === 0 && <span className="text-elsai-urgence">(fichier .md utilisé)</span>}
        </p>
        <button
          onClick={() => setShow(!show)}
          className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-3 py-1 text-xs"
        >
          {show ? "× Annuler" : "+ Ajouter une variante"}
        </button>
      </div>

      {show && (
        <form
          onSubmit={addVariant}
          className="rounded-organic border-elsai-pin/15 mb-4 space-y-2 border bg-white/80 p-4"
        >
          <div className="flex gap-2">
            <input
              value={newForm.label}
              onChange={(e) => setNewForm({ ...newForm, label: e.target.value })}
              placeholder="Label (ex: variant_empathie)"
              required
              className="border-elsai-pin/20 rounded-organic flex-1 border bg-white px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={newForm.weight}
              onChange={(e) => setNewForm({ ...newForm, weight: Number(e.target.value) })}
              min={0}
              max={1000}
              className="border-elsai-pin/20 rounded-organic w-24 border bg-white px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={newForm.content}
            onChange={(e) => setNewForm({ ...newForm, content: e.target.value })}
            rows={10}
            required
            placeholder="Contenu du prompt…"
            className="border-elsai-pin/20 rounded-organic w-full border bg-white px-3 py-2 font-mono text-xs"
          />
          <button
            type="submit"
            className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-4 py-2 text-sm"
          >
            Créer la variante
          </button>
        </form>
      )}

      <div className="space-y-3">
        {variants.map((v) => {
          const s = statsMap.get(v.id);
          const served = s?.messages_served ?? 0;
          const dangerRate = served ? ((s?.danger_flags ?? 0) / served) * 100 : 0;
          const share = totalServed ? (served / totalServed) * 100 : 0;
          return (
            <div
              key={v.id}
              className="rounded-organic border-elsai-pin/15 shadow-organic border bg-white/80 p-4 backdrop-blur"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-elsai-pin-dark font-serif text-lg">
                  {v.label}{" "}
                  <span className="text-elsai-ink/50 text-xs">#{v.id}</span>
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <label className="text-elsai-ink/70">Poids</label>
                  <input
                    type="number"
                    value={weights[v.id] ?? 0}
                    onChange={(e) =>
                      setWeights({ ...weights, [v.id]: Math.max(0, Number(e.target.value)) })
                    }
                    min={0}
                    max={1000}
                    className="border-elsai-pin/20 rounded-organic w-20 border bg-white px-2 py-1 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs">
                <Metric label="Messages servis" value={served} />
                <Metric label="Part du trafic" value={`${share.toFixed(1)}%`} />
                <Metric
                  label="Taux danger"
                  value={`${dangerRate.toFixed(1)}%`}
                  warn={dangerRate > 5}
                />
              </div>

              <pre className="text-elsai-ink/70 mt-3 max-h-32 overflow-y-auto rounded bg-gray-50 p-2 text-xs">
                {v.content.slice(0, 400)}
                {v.content.length > 400 ? "…" : ""}
              </pre>
            </div>
          );
        })}
        {variants.length === 0 && (
          <p className="text-elsai-ink/60 text-sm">
            Aucune variante en DB — le fichier .md par défaut est utilisé. Créez une première
            variante pour activer l'A/B.
          </p>
        )}
      </div>

      {variants.length > 0 && (
        <button
          onClick={saveWeights}
          className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark mt-4 px-4 py-2 text-sm"
        >
          Enregistrer les poids
        </button>
      )}
    </>
  );
}

function Metric({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className={`rounded-organic border p-2 ${warn ? "border-elsai-urgence/40 bg-elsai-urgence/5" : "border-elsai-pin/10 bg-white"}`}>
      <div className={`font-mono font-bold ${warn ? "text-elsai-urgence" : "text-elsai-pin-dark"}`}>
        {value}
      </div>
      <div className="text-elsai-ink/60">{label}</div>
    </div>
  );
}
