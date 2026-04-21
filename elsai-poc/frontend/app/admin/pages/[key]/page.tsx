"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  discardPageDraft,
  getPage,
  publishPage,
  savePageDraft,
  uploadPageImage,
  type PageBlockDef,
  type PageDetail,
  type PageFieldDef,
} from "@/lib/admin/pagesApi";

type BlockData = Record<string, unknown>;

function emptyBlockFromDef(def: PageBlockDef): BlockData {
  const block: BlockData = { type: def.key };
  for (const f of def.fields) {
    if (f.type === "list") block[f.key] = [];
    else block[f.key] = "";
  }
  return block;
}

function emptyItem(fields: PageFieldDef[]): BlockData {
  const item: BlockData = {};
  for (const f of fields) item[f.key] = "";
  return item;
}

function findBlock(blocks: BlockData[], key: string): BlockData | null {
  return blocks.find((b) => b.type === key) ?? null;
}

export default function PageEditorPage() {
  const params = useParams<{ key: string }>();
  const pageKey = params.key;

  const [detail, setDetail] = useState<PageDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // État local éditable
  const [title, setTitle] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [seoOpen, setSeoOpen] = useState(false);

  const schema = detail?.schema ?? null;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Charge la page
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getPage(pageKey);
        if (cancelled) return;
        setDetail(data);
        setTitle(data.title);
        setSeoTitle(data.seo_title ?? "");
        setSeoDescription(data.seo_description ?? "");
        setOgImage(data.og_image_url ?? "");
        const source = (data.draft_blocks ?? data.blocks ?? []) as BlockData[];
        // Garantit la présence d'un bloc par définition de schéma
        const ordered: BlockData[] = [];
        for (const def of data.schema?.blocks ?? []) {
          const existing = source.find((b) => b.type === def.key);
          ordered.push(existing ? { ...existing } : emptyBlockFromDef(def));
        }
        setBlocks(ordered);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageKey]);

  const previewUrl = useMemo(() => {
    if (!detail) return "#";
    if (pageKey === "home") return `/?preview=1&token=${detail.preview_token}`;
    return `/${pageKey}?preview=1&token=${detail.preview_token}`;
  }, [detail, pageKey]);

  if (error && !detail) {
    return <p className="text-sm text-elsai-rose">{error}</p>;
  }
  if (!detail || !schema) {
    return <p className="text-sm text-slate-400">Chargement…</p>;
  }

  function updateField(blockIdx: number, fieldKey: string, value: unknown) {
    setBlocks((prev) => {
      const next = [...prev];
      next[blockIdx] = { ...next[blockIdx], [fieldKey]: value };
      return next;
    });
  }

  function updateListItem(
    blockIdx: number,
    listKey: string,
    itemIdx: number,
    itemKey: string,
    value: unknown,
  ) {
    setBlocks((prev) => {
      const next = [...prev];
      const list = [...((next[blockIdx][listKey] as BlockData[]) ?? [])];
      list[itemIdx] = { ...list[itemIdx], [itemKey]: value };
      next[blockIdx] = { ...next[blockIdx], [listKey]: list };
      return next;
    });
  }

  function addListItem(blockIdx: number, listKey: string, itemFields: PageFieldDef[]) {
    setBlocks((prev) => {
      const next = [...prev];
      const list = [...((next[blockIdx][listKey] as BlockData[]) ?? [])];
      list.push(emptyItem(itemFields));
      next[blockIdx] = { ...next[blockIdx], [listKey]: list };
      return next;
    });
  }

  function removeListItem(blockIdx: number, listKey: string, itemIdx: number) {
    setBlocks((prev) => {
      const next = [...prev];
      const list = [...((next[blockIdx][listKey] as BlockData[]) ?? [])];
      list.splice(itemIdx, 1);
      next[blockIdx] = { ...next[blockIdx], [listKey]: list };
      return next;
    });
  }

  async function handleUpload(blockIdx: number, fieldKey: string, file: File) {
    setError(null);
    try {
      const { url } = await uploadPageImage(pageKey, file);
      // On stocke la version "relative backend" pour la portabilité
      const apiPrefix = apiBase;
      const stored = url.startsWith(apiPrefix) ? url.slice(apiPrefix.length) : url;
      updateField(blockIdx, fieldKey, stored);
      setMessage("Image uploadée.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleSaveDraft() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await savePageDraft(pageKey, {
        blocks,
        title,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        og_image_url: ogImage || null,
      });
      setDetail(updated);
      setMessage("Brouillon enregistré.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!confirm("Publier cette version sur le site public ?")) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      // On enregistre d'abord les modifs courantes comme brouillon puis on publie.
      await savePageDraft(pageKey, {
        blocks,
        title,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        og_image_url: ogImage || null,
      });
      const updated = await publishPage(pageKey);
      setDetail(updated);
      setMessage("Publié.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDiscardDraft() {
    if (!confirm("Supprimer le brouillon et revenir à la version publiée ?")) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await discardPageDraft(pageKey);
      setDetail(updated);
      // Reset form from published blocks
      const source = updated.blocks as BlockData[];
      const ordered: BlockData[] = [];
      for (const def of updated.schema?.blocks ?? []) {
        const existing = source.find((b) => b.type === def.key);
        ordered.push(existing ? { ...existing } : emptyBlockFromDef(def));
      }
      setBlocks(ordered);
      setTitle(updated.title);
      setSeoTitle(updated.seo_title ?? "");
      setSeoDescription(updated.seo_description ?? "");
      setOgImage(updated.og_image_url ?? "");
      setMessage("Brouillon supprimé.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-elsai-pin">
          Page — {schema.label}{" "}
          <span className="text-sm font-normal text-slate-500">({pageKey})</span>
        </h1>
        <Link href="/admin/pages" className="text-sm text-elsai-pin hover:underline">
          ← Retour
        </Link>
      </div>

      {error && <p className="mb-3 text-sm text-elsai-rose">{error}</p>}
      {message && <p className="mb-3 text-sm text-elsai-pin">{message}</p>}

      {detail.has_draft && (
        <div className="mb-5 rounded-organic border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            <strong>Brouillon non publié</strong> — dernière modif par{" "}
            <code>{detail.updated_by ?? "?"}</code> le{" "}
            {new Date(detail.updated_at).toLocaleString("fr-FR")}.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-organic border border-amber-500 px-3 py-1 text-xs text-amber-900 hover:bg-amber-100"
            >
              Prévisualiser ↗
            </a>
            <button
              type="button"
              onClick={handleDiscardDraft}
              disabled={saving}
              className="rounded-organic border border-amber-500 px-3 py-1 text-xs text-amber-900 hover:bg-amber-100 disabled:opacity-60"
            >
              Supprimer le brouillon
            </button>
          </div>
        </div>
      )}

      {/* Titre + SEO */}
      <section className="mb-6 rounded-organic border border-elsai-pin/15 bg-white/70 p-5">
        <label className="block text-sm">
          <span className="text-slate-700">Titre de la page (interne)</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2"
          />
        </label>

        {schema.seo && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setSeoOpen((v) => !v)}
              className="text-sm font-semibold text-elsai-pin hover:underline"
            >
              {seoOpen ? "▾" : "▸"} SEO / Open Graph
            </button>
            {seoOpen && (
              <div className="mt-3 space-y-3">
                <label className="block text-sm">
                  <span className="text-slate-700">Meta title</span>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-700">Meta description</span>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-700">Image Open Graph (URL)</span>
                  <input
                    type="url"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Blocs */}
      {schema.blocks.map((def, blockIdx) => {
        const block = blocks[blockIdx] ?? emptyBlockFromDef(def);
        return (
          <section
            key={def.key}
            className="mb-5 rounded-organic border border-elsai-pin/15 bg-white/70 p-5"
          >
            <h2 className="mb-3 font-serif text-xl text-elsai-pin-dark">{def.label}</h2>
            <div className="space-y-3">
              {def.fields.map((f) => (
                <FieldRow
                  key={f.key}
                  field={f}
                  value={block[f.key]}
                  apiBase={apiBase}
                  onChange={(v) => updateField(blockIdx, f.key, v)}
                  onUpload={(file) => handleUpload(blockIdx, f.key, file)}
                  onListAdd={() =>
                    addListItem(blockIdx, f.key, f.item_fields ?? [])
                  }
                  onListItemChange={(itemIdx, itemKey, v) =>
                    updateListItem(blockIdx, f.key, itemIdx, itemKey, v)
                  }
                  onListItemRemove={(itemIdx) =>
                    removeListItem(blockIdx, f.key, itemIdx)
                  }
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Actions */}
      <div className="sticky bottom-0 -mx-4 mt-6 flex flex-wrap gap-2 border-t border-elsai-pin/15 bg-white/90 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving}
          className="rounded-organic border border-elsai-pin px-4 py-2 text-sm text-elsai-pin hover:bg-elsai-pin/10 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer le brouillon"}
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={saving}
          className="rounded-organic bg-elsai-pin px-4 py-2 text-sm text-elsai-cream hover:bg-elsai-pin/90 disabled:opacity-60"
        >
          Publier
        </button>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto rounded-organic border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Prévisualiser ↗
        </a>
      </div>
    </div>
  );
}

// --- Champ dynamique ---------------------------------------------------------

function FieldRow({
  field,
  value,
  apiBase,
  onChange,
  onUpload,
  onListAdd,
  onListItemChange,
  onListItemRemove,
}: {
  field: PageFieldDef;
  value: unknown;
  apiBase: string;
  onChange: (v: unknown) => void;
  onUpload: (file: File) => void;
  onListAdd: () => void;
  onListItemChange: (itemIdx: number, itemKey: string, value: unknown) => void;
  onListItemRemove: (itemIdx: number) => void;
}) {
  if (field.type === "list") {
    const items = (value as BlockData[]) ?? [];
    return (
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">{field.label}</span>
          <button
            type="button"
            onClick={onListAdd}
            className="rounded-organic border border-elsai-pin px-2 py-0.5 text-xs text-elsai-pin hover:bg-elsai-pin/10"
          >
            + Ajouter
          </button>
        </div>
        <div className="space-y-3">
          {items.length === 0 && (
            <p className="text-xs text-slate-400">Aucun item.</p>
          )}
          {items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-organic border border-slate-200 bg-slate-50/60 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Item #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onListItemRemove(idx)}
                  className="text-xs text-elsai-rose hover:underline"
                >
                  Supprimer
                </button>
              </div>
              <div className="space-y-2">
                {(field.item_fields ?? []).map((sub) => (
                  <SimpleField
                    key={sub.key}
                    field={sub}
                    value={item[sub.key]}
                    apiBase={apiBase}
                    onChange={(v) => onListItemChange(idx, sub.key, v)}
                    onUpload={() => {
                      // upload pour item non exposé (évite complexité) : laissé à l'édition manuelle de l'URL.
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <SimpleField
      field={field}
      value={value}
      apiBase={apiBase}
      onChange={onChange}
      onUpload={onUpload}
    />
  );
}

function SimpleField({
  field,
  value,
  apiBase,
  onChange,
  onUpload,
}: {
  field: PageFieldDef;
  value: unknown;
  apiBase: string;
  onChange: (v: unknown) => void;
  onUpload: (file: File) => void;
}) {
  const str = (value as string | undefined) ?? "";
  if (field.type === "textarea") {
    return (
      <label className="block text-sm">
        <span className="text-slate-700">
          {field.label}
          {field.required && <span className="text-elsai-rose"> *</span>}
        </span>
        <textarea
          value={str}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2"
        />
      </label>
    );
  }
  if (field.type === "image") {
    const displayUrl = str
      ? str.startsWith("http") || str.startsWith("/api/")
        ? str.startsWith("/api/")
          ? `${apiBase}${str}`
          : str
        : str
      : "";
    return (
      <div className="block text-sm">
        <span className="text-slate-700">{field.label}</span>
        <div className="mt-1 flex items-start gap-3">
          {displayUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt=""
              className="h-20 w-20 rounded border border-slate-200 object-contain bg-white"
            />
          )}
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={str}
              onChange={(e) => onChange(e.target.value)}
              placeholder="/logo-elsai.svg ou URL complète"
              className="w-full rounded-organic border border-slate-300 px-3 py-2"
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
              className="text-xs"
            />
          </div>
        </div>
      </div>
    );
  }
  const type = field.type === "url" ? "url" : "text";
  return (
    <label className="block text-sm">
      <span className="text-slate-700">
        {field.label}
        {field.required && <span className="text-elsai-rose"> *</span>}
      </span>
      <input
        type={type}
        value={str}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-organic border border-slate-300 px-3 py-2"
      />
    </label>
  );
}
