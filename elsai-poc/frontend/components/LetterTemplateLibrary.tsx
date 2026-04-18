"use client";

import { useEffect, useState } from "react";

import {
  createLetterTemplate,
  deleteLetterTemplate,
  generateLetterTemplate,
  listLetterTemplates,
  updateLetterTemplate,
  type LetterTemplate,
} from "@/lib/api";

const CATEGORIES = [
  { value: "general", label: "Général" },
  { value: "logement", label: "Logement" },
  { value: "emploi", label: "Emploi" },
  { value: "sante", label: "Santé" },
  { value: "famille", label: "Famille" },
  { value: "administration", label: "Administration" },
];

type Draft = {
  id: string | null;
  title: string;
  category: string;
  body: string;
};

const EMPTY_DRAFT: Draft = { id: null, title: "", category: "general", body: "" };

export function LetterTemplateLibrary({ onUnauthorized }: { onUnauthorized?: () => void }) {
  const [items, setItems] = useState<LetterTemplate[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [aiPrompt, setAiPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function reload() {
    try {
      const list = await listLetterTemplates();
      setItems(list);
      setLoaded(true);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "UNAUTHORIZED") onUnauthorized?.();
      else setError(msg);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function edit(tpl: LetterTemplate) {
    setDraft({ id: tpl.id, title: tpl.title, category: tpl.category, body: tpl.body });
    setError(null);
  }

  function reset() {
    setDraft(EMPTY_DRAFT);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim() || !draft.body.trim()) {
      setError("Titre et corps sont requis.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        title: draft.title.trim(),
        category: draft.category,
        body: draft.body,
      };
      if (draft.id) await updateLetterTemplate(draft.id, payload);
      else await createLetterTemplate(payload);
      reset();
      await reload();
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "UNAUTHORIZED") onUnauthorized?.();
      else setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce modèle de courrier ?")) return;
    setBusy(true);
    try {
      await deleteLetterTemplate(id);
      if (draft.id === id) reset();
      await reload();
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "UNAUTHORIZED") onUnauthorized?.();
      else setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    if (!aiPrompt.trim()) {
      setError("Décrivez le courrier à générer.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await generateLetterTemplate(aiPrompt.trim(), draft.category);
      setDraft({
        id: draft.id,
        title: result.title || draft.title || "Courrier type",
        category: result.category || draft.category,
        body: result.body,
      });
      setAiPrompt("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-organic border-elsai-pin/15 shadow-organic mt-8 border bg-white/70 p-5 backdrop-blur">
      <h2 className="text-elsai-pin-dark mb-1 font-serif text-2xl">
        Bibliothèque de courriers types
      </h2>
      <p className="text-elsai-ink/70 mb-5 text-sm leading-relaxed">
        Modèles éditoriaux proposés aux utilisateurs. Vous pouvez générer un brouillon via l'IA,
        puis l'ajuster avant publication.
      </p>

      {error && (
        <div className="rounded-organic border-elsai-urgence/30 bg-elsai-urgence/10 text-elsai-urgence mb-4 border p-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={save} className="space-y-3">
          <h3 className="text-elsai-pin-dark font-serif text-lg">
            {draft.id ? "Modifier le modèle" : "Nouveau modèle"}
          </h3>

          <div className="rounded-organic border-elsai-pin/10 bg-elsai-creme/40 space-y-2 border p-3">
            <label className="text-elsai-ink/80 block text-xs font-semibold uppercase tracking-wide">
              Génération IA
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ex : lettre de demande de délai de paiement à la CAF pour un trop-perçu"
              rows={2}
              className="border-elsai-pin/20 focus:border-elsai-pin rounded-organic w-full border bg-white/80 px-3 py-2 text-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={generate}
              disabled={busy}
              className="rounded-organic bg-elsai-rose text-elsai-creme hover:bg-elsai-rose-dark px-4 py-1.5 text-sm transition-colors disabled:opacity-50"
            >
              {busy ? "Génération…" : "Générer un brouillon avec l'IA"}
            </button>
          </div>

          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Titre du modèle"
            className="border-elsai-pin/20 focus:border-elsai-pin rounded-organic w-full border bg-white/80 px-3 py-2 focus:outline-none"
          />

          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            className="border-elsai-pin/20 focus:border-elsai-pin rounded-organic w-full border bg-white/80 px-3 py-2 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <textarea
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            placeholder="Corps du courrier (utilisez des [variables] pour les champs à personnaliser)"
            rows={12}
            className="border-elsai-pin/20 focus:border-elsai-pin rounded-organic w-full border bg-white/80 px-3 py-2 font-mono text-sm focus:outline-none"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-5 py-2 text-sm transition-colors disabled:opacity-50"
            >
              {draft.id ? "Enregistrer" : "Ajouter"}
            </button>
            {draft.id && (
              <button
                type="button"
                onClick={reset}
                className="rounded-organic border-elsai-pin/30 text-elsai-ink/70 hover:bg-elsai-pin/5 border px-5 py-2 text-sm transition-colors"
              >
                Annuler
              </button>
            )}
          </div>
        </form>

        <div className="space-y-2">
          <h3 className="text-elsai-pin-dark font-serif text-lg">
            Modèles enregistrés ({items.length})
          </h3>
          {!loaded && <p className="text-elsai-ink/60 text-sm">Chargement…</p>}
          {loaded && items.length === 0 && (
            <p className="text-elsai-ink/60 text-sm">Aucun modèle pour le moment.</p>
          )}
          <ul className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
            {items.map((tpl) => (
              <li
                key={tpl.id}
                className="rounded-organic border-elsai-pin/15 bg-white/80 border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-elsai-pin-dark truncate font-semibold">{tpl.title}</div>
                    <div className="text-elsai-ink/60 text-xs">
                      {CATEGORIES.find((c) => c.value === tpl.category)?.label ?? tpl.category} ·
                      maj {new Date(tpl.updated_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => edit(tpl)}
                      className="text-elsai-pin hover:text-elsai-pin-dark text-xs underline"
                    >
                      Modifier
                    </button>
                    <span className="text-elsai-ink/30">·</span>
                    <button
                      onClick={() => remove(tpl.id)}
                      className="text-elsai-urgence hover:underline text-xs"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <p className="text-elsai-ink/70 mt-1 line-clamp-2 text-xs">
                  {tpl.body.slice(0, 160)}
                  {tpl.body.length > 160 ? "…" : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
