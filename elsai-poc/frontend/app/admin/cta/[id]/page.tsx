"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { CTA_REGISTRY } from "@/components/cta/registry";
import {
  deleteCTA,
  getCTA,
  updateCTA,
  type CTARow,
} from "@/lib/admin/ctaApi";

const COMPONENT_NAMES = Object.keys(CTA_REGISTRY);
const AUDIENCES = ["all", "adult", "minor", "b2b"];

export default function CTAEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [row, setRow] = useState<CTARow | null>(null);
  const [label, setLabel] = useState("");
  const [variant, setVariant] = useState("control");
  const [component, setComponent] = useState("");
  const [audience, setAudience] = useState("all");
  const [weight, setWeight] = useState(100);
  const [active, setActive] = useState(true);
  const [propsJson, setPropsJson] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCTA(id);
        setRow(data);
        setLabel(data.label);
        setVariant(data.variant);
        setComponent(data.component);
        setAudience(data.audience);
        setWeight(data.weight);
        setActive(data.active);
        setPropsJson(JSON.stringify(data.props ?? {}, null, 2));
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [id]);

  const parsedProps = ((): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(propsJson);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    try {
      JSON.parse(propsJson);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  }, [propsJson]);

  async function handleSave() {
    if (jsonError) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCTA(id, {
        label,
        variant,
        component,
        audience,
        weight,
        active,
        props: parsedProps ?? {},
      });
      setRow(updated);
      setSavedAt(new Date().toLocaleTimeString("fr-FR"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Désactiver cette variante ? (soft delete)")) return;
    try {
      await deleteCTA(id);
      router.push("/admin/cta");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const PreviewComponent = CTA_REGISTRY[component];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link href="/admin/cta" className="text-sm text-elsai-pin hover:underline">
            ← Liste
          </Link>
          <h1 className="font-serif text-2xl text-elsai-pin">
            Éditer CTA {row?.key}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-organic border border-elsai-rose px-3 py-1.5 text-sm text-elsai-rose hover:bg-elsai-rose hover:text-white"
          >
            Désactiver
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !!jsonError}
            className="rounded-organic bg-elsai-pin px-4 py-1.5 text-sm text-elsai-cream hover:bg-elsai-pin/90 disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-organic border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-elsai-rose">
          {error}
        </p>
      )}
      {savedAt && (
        <p className="mb-3 text-xs text-emerald-700">Enregistré à {savedAt}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-organic border border-elsai-pin/15 bg-white/70 p-4">
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase text-slate-500">Label</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-organic border border-slate-300 px-3 py-1.5"
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
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase text-slate-500">Audience</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-organic border border-slate-300 px-2 py-1.5"
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
                className="w-full rounded-organic border border-slate-300 px-2 py-1.5"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span>Actif</span>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase text-slate-500">
              Props (JSON)
            </span>
            <textarea
              value={propsJson}
              onChange={(e) => setPropsJson(e.target.value)}
              rows={14}
              className={`w-full rounded-organic border px-3 py-2 font-mono text-xs ${
                jsonError ? "border-elsai-rose" : "border-slate-300"
              }`}
            />
            {jsonError && (
              <span className="mt-1 block text-xs text-elsai-rose">{jsonError}</span>
            )}
          </label>
        </div>

        <div className="rounded-organic border border-elsai-pin/15 bg-elsai-cream/40 p-4">
          <h2 className="mb-3 text-xs uppercase text-slate-500">Preview (client)</h2>
          {PreviewComponent && parsedProps ? (
            <PreviewComponent {...parsedProps} audience={audience} variant={variant} />
          ) : (
            <p className="text-sm text-slate-500">
              Preview indisponible ({!PreviewComponent ? "composant inconnu" : "props JSON invalides"}).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
