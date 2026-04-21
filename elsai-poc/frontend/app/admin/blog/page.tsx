"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { deletePost, listPosts } from "@/lib/admin/contentApi";
import type { BlogPostSummary } from "@/lib/admin/types";

const AUDIENCES: Array<{ value: string; label: string }> = [
  { value: "", label: "Toutes" },
  { value: "adult", label: "Adulte" },
  { value: "minor", label: "Mineur" },
  { value: "b2b", label: "B2B" },
  { value: "all", label: "Tous publics" },
];

const STATUSES = ["", "draft", "review", "scheduled", "published", "private", "archived"];

const KINDS: Array<{ value: string; label: string }> = [
  { value: "", label: "Tous" },
  { value: "article", label: "Article" },
  { value: "help", label: "Aide" },
];

const KIND_STYLE: Record<string, string> = {
  article: "bg-indigo-100 text-indigo-800",
  help: "bg-teal-100 text-teal-800",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  review: "bg-amber-100 text-amber-800",
  scheduled: "bg-sky-100 text-sky-800",
  published: "bg-emerald-100 text-emerald-800",
  private: "bg-violet-100 text-violet-800",
  archived: "bg-rose-100 text-rose-700",
};

const AUDIENCE_STYLE: Record<string, string> = {
  adult: "bg-purple-100 text-purple-800",
  minor: "bg-pink-100 text-pink-800",
  b2b: "bg-sky-100 text-sky-800",
  all: "bg-slate-100 text-slate-800",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BlogListPage() {
  const [rows, setRows] = useState<BlogPostSummary[]>([]);
  const [q, setQ] = useState("");
  const [audience, setAudience] = useState("");
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [author, setAuthor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ msg: string; postId: string } | null>(null);

  async function handleDelete(row: BlogPostSummary) {
    if (!confirm(`Déplacer l'article « ${row.title} » en brouillon ?`)) return;
    setDeletingId(row.id);
    setError(null);
    try {
      await deletePost(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setNotice({ msg: `« ${row.title} » déplacé en brouillon.`, postId: row.id });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  const filters = useMemo(
    () => ({
      q: q || undefined,
      audience: audience || undefined,
      status: status || undefined,
      kind: kind || undefined,
      author_id: author || undefined,
    }),
    [q, audience, status, kind, author],
  );

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listPosts(filters);
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [filters]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-elsai-pin-dark font-serif text-3xl">Blog éditorial</h1>
          <p className="text-elsai-ink/70 text-sm">
            Gestion des articles (audience, SEO, schéma, gate de publication).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatus(status === "draft" ? "" : "draft")}
            className={`rounded-organic border px-3 py-2 text-sm transition-colors ${
              status === "draft"
                ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                : "border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/10"
            }`}
          >
            Brouillons
          </button>
          <Link
            href="/admin/blog/new"
            className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-4 py-2 text-sm transition-colors"
          >
            + Nouveau post
          </Link>
        </div>
      </div>

      {notice && (
        <div className="rounded-organic mb-3 flex items-center justify-between border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span>{notice.msg}</span>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/blog/${notice.postId}`}
              className="underline hover:no-underline"
            >
              Ouvrir le brouillon
            </Link>
            <button
              type="button"
              onClick={() => {
                setStatus("draft");
                setNotice(null);
              }}
              className="underline hover:no-underline"
            >
              Voir tous les brouillons
            </button>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-amber-700 hover:text-amber-900"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="rounded-organic border-elsai-pin/15 bg-white/70 mb-4 border p-3">
        <div className="grid gap-2 sm:grid-cols-5">
          <label className="text-xs">
            <span className="text-elsai-ink/70 mb-1 block uppercase">Recherche</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Titre contient…"
              className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-1.5 text-sm focus:outline-none"
            />
          </label>
          <label className="text-xs">
            <span className="text-elsai-ink/70 mb-1 block uppercase">Audience</span>
            <div className="flex flex-wrap gap-1">
              {AUDIENCES.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setAudience(a.value)}
                  className={`rounded-organic border px-2 py-1 text-xs ${
                    audience === a.value
                      ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                      : "border-elsai-pin/20 bg-white"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </label>
          <label className="text-xs">
            <span className="text-elsai-ink/70 mb-1 block uppercase">Statut</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-1.5 text-sm focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s || "tous"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="text-elsai-ink/70 mb-1 block uppercase">Type</span>
            <div className="flex flex-wrap gap-1">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  onClick={() => setKind(k.value)}
                  className={`rounded-organic border px-2 py-1 text-xs ${
                    kind === k.value
                      ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                      : "border-elsai-pin/20 bg-white"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </label>
          <label className="text-xs">
            <span className="text-elsai-ink/70 mb-1 block uppercase">Auteur (id)</span>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="user_id"
              className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-1.5 text-sm focus:outline-none"
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="text-elsai-urgence rounded-organic mb-3 border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="rounded-organic border-elsai-pin/15 bg-white/70 overflow-x-auto border">
        <table className="w-full text-sm">
          <thead className="text-elsai-ink/60 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Titre</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Audience</th>
              <th className="px-3 py-2 text-left">Statut</th>
              <th className="px-3 py-2 text-left">Auteur</th>
              <th className="px-3 py-2 text-left">Modifié</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="text-elsai-ink/50 px-3 py-4 text-center">
                  Aucun article.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-elsai-pin/5">
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/blog/${r.id}`}
                    className="text-elsai-pin-dark font-medium hover:underline"
                  >
                    {r.title}
                  </Link>
                  <div className="text-elsai-ink/50 text-[11px]">/{r.slug}</div>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-organic px-2 py-0.5 text-[11px] uppercase ${
                      KIND_STYLE[r.kind ?? "article"] ?? "bg-slate-100"
                    }`}
                  >
                    {r.kind ?? "article"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-organic px-2 py-0.5 text-[11px] uppercase ${
                      AUDIENCE_STYLE[r.audience] ?? "bg-slate-100"
                    }`}
                  >
                    {r.audience}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-organic px-2 py-0.5 text-[11px] ${
                      STATUS_STYLE[r.status] ?? "bg-slate-100"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="text-elsai-ink/70 px-3 py-2 text-xs">
                  {r.author_display ?? r.author_id ?? "—"}
                </td>
                <td className="text-elsai-ink/60 px-3 py-2 text-xs">
                  {formatDate(r.updated_at)}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/blog/${r.id}`}
                      className="rounded-organic border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/10 border px-2 py-1 text-xs"
                    >
                      Éditer
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      disabled={deletingId === r.id}
                      className="rounded-organic border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {deletingId === r.id ? "…" : "Supprimer"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && <p className="text-elsai-ink/50 mt-2 text-xs">Chargement…</p>}
    </div>
  );
}
