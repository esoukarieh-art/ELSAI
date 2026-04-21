"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CTA_REGISTRY } from "@/components/cta/registry";
import { createCTA, getCTA, listCTAs, type CTARow } from "@/lib/admin/ctaApi";

const COMPONENT_NAMES = Object.keys(CTA_REGISTRY);
const AUDIENCES = ["all", "adult", "minor", "b2b"];

export default function CTANewPage() {
  const router = useRouter();

  const [existing, setExisting] = useState<CTARow[]>([]);
  const [cloneFromId, setCloneFromId] = useState("");

  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [variant, setVariant] = useState("control");
  const [component, setComponent] = useState(COMPONENT_NAMES[0] ?? "");
  const [audience, setAudience] = useState("all");
  const [weight, setWeight] = useState(100);
  const [propsJson, setPropsJson] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listCTAs().then(setExisting).catch(() => setExisting([]));
  }, []);

  useEffect(() => {
    try {
      JSON.parse(propsJson);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  }, [propsJson]);

  async function handleClone(sourceId: string) {
    setCloneFromId(sourceId);
    if (!sourceId) return;
    try {
      const src = await getCTA(sourceId);
      setKey(src.key);
      setLabel(`${src.label} (copie)`);
      setVariant(`${src.variant}_copy`);
      setComponent(src.component);
      setAudience(src.audience);
      setWeight(src.weight);
      setPropsJson(JSON.stringify(src.props ?? {}, null, 2));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleCreate() {
    if (jsonError) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createCTA({
        key: key.trim(),
        label: label.trim(),
        variant: variant.trim() || "control",
        component,
        audience,
        weight,
        props: JSON.parse(propsJson),
      });
      router.push(`/admin/cta/${created.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link href="/admin/cta" className="text-sm text-elsai-pin hover:underline">
            ← Liste
          </Link>
          <h1 className="font-serif text-2xl text-elsai-pin">Nouvelle variante CTA</h1>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !!jsonError || !key || !label || !component}
          className="rounded-organic bg-elsai-pin px-4 py-1.5 text-sm text-elsai-cream hover:bg-elsai-pin/90 disabled:opacity-50"
        >
          {saving ? "Création…" : "Créer"}
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-organic border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-elsai-rose">
          {error}
        </p>
      )}

      <div className="mb-4 rounded-organic border border-elsai-pin/15 bg-white/70 p-3">
        <label className="block text-sm">
          <span className="mb-1 block text-xs uppercase text-slate-500">
            Cloner depuis un CTA existant
          </span>
          <select
            value={cloneFromId}
            onChange={(e) => handleClone(e.target.value)}
            className="w-full rounded-organic border border-slate-300 px-3 py-1.5"
          >
            <option value="">— aucun —</option>
            {existing.map((c) => (
              <option key={c.id} value={c.id}>
                {c.key} · {c.variant} · {c.component}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3 rounded-organic border border-elsai-pin/15 bg-white/70 p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase text-slate-500">Clé</span>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="chat_anonyme"
              className="w-full rounded-organic border border-slate-300 px-3 py-1.5 font-mono"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase text-slate-500">Variant</span>
            <input
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              className="w-full rounded-organic border border-slate-300 px-3 py-1.5 font-mono"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-xs uppercase text-slate-500">Label</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-organic border border-slate-300 px-3 py-1.5"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs uppercase text-slate-500">Composant</span>
          <select
            value={component}
            onChange={(e) => setComponent(e.target.value)}
            className="w-full rounded-organic border border-slate-300 px-3 py-1.5"
          >
            {COMPONENT_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase text-slate-500">Audience</span>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full rounded-organic border border-slate-300 px-3 py-1.5"
            >
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase text-slate-500">Weight</span>
            <input
              type="number"
              min={0}
              max={1000}
              value={weight}
              onChange={(e) => setWeight(parseInt(e.target.value || "0", 10))}
              className="w-full rounded-organic border border-slate-300 px-3 py-1.5"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-xs uppercase text-slate-500">Props (JSON)</span>
          <textarea
            value={propsJson}
            onChange={(e) => setPropsJson(e.target.value)}
            rows={12}
            className={`w-full rounded-organic border px-3 py-2 font-mono text-xs ${
              jsonError ? "border-elsai-rose" : "border-slate-300"
            }`}
          />
          {jsonError && (
            <span className="mt-1 block text-xs text-elsai-rose">{jsonError}</span>
          )}
        </label>
      </div>
    </div>
  );
}
