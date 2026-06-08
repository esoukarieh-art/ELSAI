"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type LongTailDetail,
  type LongTailRow,
  type SeoStats,
  type Taxonomy,
  deleteLongTail,
  generateBatch,
  getLongTail,
  getStats,
  getTaxonomy,
  listLongTail,
  updateLongTail,
  updateStatus,
} from "@/lib/admin/seoApi";

type StatusFilter = "" | "draft" | "published" | "noindex";

export default function AdminSeoPage() {
  const [stats, setStats] = useState<SeoStats | null>(null);
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [rows, setRows] = useState<LongTailRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterRight, setFilterRight] = useState("");
  const [filterSituation, setFilterSituation] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("");

  // Génération batch
  const [genRights, setGenRights] = useState<string[]>([]);
  const [genSituations, setGenSituations] = useState<string[]>([]);
  const [genDepts, setGenDepts] = useState<string[]>([]);
  const [genPublish, setGenPublish] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [genReport, setGenReport] = useState<string | null>(null);

  // Édition
  const [editing, setEditing] = useState<LongTailDetail | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    void refreshAll();
  }, []);

  async function refreshAll() {
    setLoading(true);
    setError(null);
    try {
      const [s, t] = await Promise.all([getStats(), getTaxonomy()]);
      setStats(s);
      setTaxonomy(t);
      await reloadRows({});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function reloadRows(params: {
    right?: string;
    situation?: string;
    department?: string;
    page_status?: string;
  }) {
    try {
      const data = await listLongTail({ ...params, limit: 200 });
      setRows(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function applyFilters() {
    void reloadRows({
      right: filterRight || undefined,
      situation: filterSituation || undefined,
      department: filterDept || undefined,
      page_status: filterStatus || undefined,
    });
  }

  const combinations = useMemo<[string, string, string][]>(() => {
    const out: [string, string, string][] = [];
    for (const r of genRights) {
      for (const s of genSituations) {
        for (const d of genDepts) {
          out.push([r, s, d]);
        }
      }
    }
    return out;
  }, [genRights, genSituations, genDepts]);

  async function runGenerate() {
    if (combinations.length === 0 || combinations.length > 200) return;
    setGenBusy(true);
    setGenReport(null);
    try {
      const res = await generateBatch(combinations, genPublish);
      setGenReport(
        `Génération terminée : ${res.generated} pages créées/mises à jour, ${res.skipped} échecs.`,
      );
      await refreshAll();
    } catch (err) {
      setGenReport(`Erreur : ${(err as Error).message}`);
    } finally {
      setGenBusy(false);
    }
  }

  async function changeStatus(row: LongTailRow, value: "draft" | "published" | "noindex") {
    try {
      await updateStatus(row.id, value);
      await reloadRows({
        right: filterRight || undefined,
        situation: filterSituation || undefined,
        department: filterDept || undefined,
        page_status: filterStatus || undefined,
      });
      await refreshStats();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function refreshStats() {
    try {
      setStats(await getStats());
    } catch {}
  }

  async function openEdit(row: LongTailRow) {
    setEditError(null);
    try {
      const detail = await getLongTail(row.id);
      setEditing(detail);
      setEditTitle(detail.title);
      setEditDesc(detail.seo_description);
      setEditContent(detail.content_md);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function closeEdit() {
    setEditing(null);
    setEditError(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setEditBusy(true);
    setEditError(null);
    try {
      const payload: Partial<Pick<LongTailDetail, "title" | "seo_description" | "content_md">> = {};
      if (editTitle !== editing.title) payload.title = editTitle;
      if (editDesc !== editing.seo_description) payload.seo_description = editDesc;
      if (editContent !== editing.content_md) payload.content_md = editContent;
      if (Object.keys(payload).length > 0) {
        await updateLongTail(editing.id, payload);
        await reloadRows({
          right: filterRight || undefined,
          situation: filterSituation || undefined,
          department: filterDept || undefined,
          page_status: filterStatus || undefined,
        });
        await refreshStats();
      }
      closeEdit();
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setEditBusy(false);
    }
  }

  const editWordCount = useMemo(
    () => (editContent ? editContent.trim().split(/\s+/).filter(Boolean).length : 0),
    [editContent],
  );

  async function remove(row: LongTailRow) {
    if (!window.confirm(`Supprimer ${row.composite_slug} ?`)) return;
    try {
      await deleteLongTail(row.id);
      setRows((r) => r.filter((x) => x.id !== row.id));
      await refreshStats();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section>
      <h1 className="text-elsai-pin-dark font-serif text-2xl">SEO longue traîne</h1>
      <p className="text-elsai-ink/70 mt-1 text-sm">
        Génération de pages <code>droit × situation × département</code>, supervision et
        publication.
      </p>

      {error && (
        <div className="rounded-organic mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Stat label="Pages totales" value={stats.total} />
          <Stat
            label="Publiées"
            value={stats.by_status?.published || 0}
            sub={`${stats.by_status?.draft || 0} drafts · ${stats.by_status?.noindex || 0} noindex`}
          />
          <Stat label="Mots moyens" value={stats.avg_word_count} />
          <Stat
            label="Taxonomie"
            value={`${stats.rights_count}×${stats.situations_count}×${stats.departments_count}`}
            sub={`= ${stats.rights_count * stats.situations_count * stats.departments_count} combinaisons possibles`}
          />
        </div>
      )}

      {/* Génération batch */}
      {taxonomy && (
        <div className="rounded-organic border-elsai-pin/15 mt-8 border bg-white p-4">
          <h2 className="text-elsai-pin-dark font-semibold">Générer un lot</h2>
          <p className="text-elsai-ink/70 mt-1 text-xs">
            Sélectionnez plusieurs droits, situations et départements. Le produit cartésien sera
            généré (max 200 par lot).
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <MultiSelect
              label="Droits"
              options={taxonomy.rights.map((r) => ({ value: r.slug || "", label: r.name }))}
              value={genRights}
              onChange={setGenRights}
            />
            <MultiSelect
              label="Situations"
              options={taxonomy.situations.map((s) => ({ value: s.slug || "", label: s.name }))}
              value={genSituations}
              onChange={setGenSituations}
            />
            <MultiSelect
              label="Départements"
              options={taxonomy.departments.map((d) => ({
                value: d.code || "",
                label: `${d.code} — ${d.name}`,
              }))}
              value={genDepts}
              onChange={setGenDepts}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-elsai-ink/80 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={genPublish}
                onChange={(e) => setGenPublish(e.target.checked)}
              />
              Publier directement (sinon : draft)
            </label>
            <span className="text-elsai-ink/60 text-xs">
              {combinations.length} combinaison{combinations.length > 1 ? "s" : ""} prête
              {combinations.length > 1 ? "s" : ""}
            </span>
            <button
              onClick={runGenerate}
              disabled={genBusy || combinations.length === 0 || combinations.length > 200}
              className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              {genBusy ? "Génération…" : "Lancer la génération"}
            </button>
          </div>
          {genReport && <p className="text-elsai-ink/80 mt-3 text-sm">{genReport}</p>}
        </div>
      )}

      {/* Filtres + Table */}
      {taxonomy && (
        <div className="rounded-organic border-elsai-pin/15 mt-8 border bg-white p-4">
          <h2 className="text-elsai-pin-dark font-semibold">Pages générées</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Select
              label="Droit"
              value={filterRight}
              onChange={setFilterRight}
              options={taxonomy.rights.map((r) => ({ value: r.slug || "", label: r.name }))}
            />
            <Select
              label="Situation"
              value={filterSituation}
              onChange={setFilterSituation}
              options={taxonomy.situations.map((s) => ({ value: s.slug || "", label: s.name }))}
            />
            <Select
              label="Département"
              value={filterDept}
              onChange={setFilterDept}
              options={taxonomy.departments.map((d) => ({
                value: d.code || "",
                label: `${d.code} — ${d.name}`,
              }))}
            />
            <Select
              label="Statut"
              value={filterStatus}
              onChange={(v) => setFilterStatus(v as StatusFilter)}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Publié" },
                { value: "noindex", label: "Noindex" },
              ]}
            />
            <button
              onClick={applyFilters}
              className="rounded-organic border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/5 border px-3 py-2 text-sm"
            >
              Filtrer
            </button>
          </div>

          {loading ? (
            <p className="text-elsai-ink/70 mt-4 text-sm">Chargement…</p>
          ) : rows.length === 0 ? (
            <p className="text-elsai-ink/70 mt-4 text-sm">Aucune page pour ces filtres.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-elsai-ink/70 text-left text-xs uppercase">
                  <tr>
                    <th className="px-2 py-2">Slug</th>
                    <th className="px-2 py-2">Titre</th>
                    <th className="px-2 py-2">Mots</th>
                    <th className="px-2 py-2">Statut</th>
                    <th className="px-2 py-2">MAJ</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-elsai-pin/10 divide-y">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-2 py-2 font-mono text-xs">
                        {r.right_slug}/{r.situation_slug}/{r.department_code}
                      </td>
                      <td className="px-2 py-2">{r.title}</td>
                      <td className="px-2 py-2 tabular-nums">
                        <span className={r.word_count < 350 ? "text-red-600" : "text-elsai-ink"}>
                          {r.word_count}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="text-elsai-ink/60 px-2 py-2 text-xs">
                        {new Date(r.updated_at).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-2 text-xs">
                          <button
                            onClick={() => openEdit(r)}
                            className="text-elsai-pin-dark hover:underline"
                          >
                            Éditer
                          </button>
                          {r.status !== "published" && r.word_count >= 350 && (
                            <button
                              onClick={() => changeStatus(r, "published")}
                              className="text-elsai-pin hover:underline"
                            >
                              Publier
                            </button>
                          )}
                          {r.status !== "draft" && (
                            <button
                              onClick={() => changeStatus(r, "draft")}
                              className="text-elsai-ink/70 hover:underline"
                            >
                              Draft
                            </button>
                          )}
                          {r.status !== "noindex" && (
                            <button
                              onClick={() => changeStatus(r, "noindex")}
                              className="text-elsai-rose-dark hover:underline"
                            >
                              Noindex
                            </button>
                          )}
                          <button
                            onClick={() => remove(r)}
                            className="text-red-600 hover:underline"
                          >
                            Suppr.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editing && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Éditer la page"
            className="rounded-organic mt-8 w-full max-w-3xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-elsai-pin-dark font-serif text-xl">Éditer la page</h3>
                <p className="text-elsai-ink/60 mt-1 font-mono text-xs">
                  {editing.right_slug}/{editing.situation_slug}/{editing.department_code}
                </p>
              </div>
              <button
                onClick={closeEdit}
                className="text-elsai-ink/60 hover:text-elsai-ink text-2xl leading-none"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col text-sm">
                <span className="text-elsai-ink/70 mb-1 text-xs">Titre</span>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="rounded-organic border-elsai-pin/20 border bg-white px-2 py-2 text-sm"
                  maxLength={300}
                />
              </label>

              <label className="flex flex-col text-sm" htmlFor="seo-edit-desc">
                <span className="text-elsai-ink/70 mb-1 flex justify-between text-xs">
                  Méta-description
                  <span
                    className={
                      editDesc.length < 140 || editDesc.length > 160
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }
                  >
                    {editDesc.length} car. (idéal 140–160)
                  </span>
                </span>
                <textarea
                  id="seo-edit-desc"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="rounded-organic border-elsai-pin/20 border bg-white px-2 py-2 text-sm"
                  maxLength={400}
                />
              </label>

              <label className="flex flex-col text-sm" htmlFor="seo-edit-content">
                <span className="text-elsai-ink/70 mb-1 flex justify-between text-xs">
                  Contenu Markdown
                  <span className={editWordCount < 350 ? "text-red-600" : "text-emerald-700"}>
                    {editWordCount} mots (min 350 pour publier)
                  </span>
                </span>
                <textarea
                  id="seo-edit-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="rounded-organic border-elsai-pin/20 border bg-white px-2 py-2 font-mono text-xs"
                  style={{ height: "50vh" }}
                />
              </label>

              {editError && (
                <p className="rounded-organic border border-red-200 bg-red-50 p-2 text-sm text-red-800">
                  ⚠️ {editError}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={closeEdit}
                  disabled={editBusy}
                  className="rounded-organic border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/5 border px-4 py-2 text-sm disabled:opacity-40"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editBusy}
                  className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  {editBusy ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-4">
      <p className="text-elsai-ink/60 text-xs tracking-widest uppercase">{label}</p>
      <p className="text-elsai-pin-dark mt-1 font-serif text-2xl">{value}</p>
      {sub && <p className="text-elsai-ink/60 mt-1 text-xs">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-800",
    draft: "bg-amber-100 text-amber-800",
    noindex: "bg-rose-100 text-rose-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || ""}`}>
      {status}
    </span>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col text-xs">
      <span className="text-elsai-ink/70 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-organic border-elsai-pin/20 border bg-white px-2 py-2 text-sm"
      >
        <option value="">Tous</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MultiSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col text-xs">
      <span className="text-elsai-ink/70 mb-1">
        {label} ({value.length})
      </span>
      <select
        multiple
        size={6}
        value={value}
        onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value))}
        className="rounded-organic border-elsai-pin/20 border bg-white px-2 py-1 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
