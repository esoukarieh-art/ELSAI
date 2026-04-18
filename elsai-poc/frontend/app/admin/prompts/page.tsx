"use client";

import { useEffect, useState } from "react";

import { fetchPrompts, type PromptView, resetPrompt, savePrompt } from "@/lib/api";

const LABELS: Record<string, string> = {
  system_adult: "Prompt système — Majeurs",
  system_minor: "Prompt système — Mineurs 12-18",
  ocr_explain: "Prompt OCR — Explication de documents",
};

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptView[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function load() {
    try {
      const data = await fetchPrompts();
      setPrompts(data);
      if (!selected && data.length) {
        setSelected(data[0].name);
        setDraft(data[0].content);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function select(name: string) {
    const p = prompts.find((x) => x.name === name);
    if (!p) return;
    setSelected(name);
    setDraft(p.content);
    setInfo(null);
    setError(null);
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await savePrompt(selected, draft);
      setInfo("Prompt enregistré. Nouvelle version active.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!selected) return;
    if (!confirm(`Rollback vers la version par défaut de « ${selected} » ?`)) return;
    setSaving(true);
    try {
      const p = await resetPrompt(selected);
      setDraft(p.content);
      setInfo("Retour à la version par défaut (fichier .md).");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const current = prompts.find((p) => p.name === selected);

  return (
    <>
      <h1 className="text-elsai-pin-dark mb-2 font-serif text-3xl">Prompts IA</h1>
      <p className="text-elsai-ink/70 mb-6 text-sm">
        Édition à chaud des prompts système. Les modifications sont versionnées et prennent effet
        immédiatement sur les prochaines conversations.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {prompts.map((p) => (
          <button
            key={p.name}
            onClick={() => select(p.name)}
            className={`rounded-organic border px-3 py-1 text-xs transition-colors ${
              selected === p.name
                ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                : "border-elsai-pin/20 text-elsai-pin-dark bg-white/70"
            }`}
          >
            {LABELS[p.name] ?? p.name}
            {!p.is_default && <span className="ml-1 opacity-70">●</span>}
          </button>
        ))}
      </div>

      {current && (
        <div className="rounded-organic border-elsai-pin/15 shadow-organic border bg-white/80 p-4 backdrop-blur">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="text-elsai-ink/70">
              {current.is_default ? (
                <>Version par défaut (fichier .md)</>
              ) : (
                <>
                  Override DB · version #{current.version_id} ·{" "}
                  {current.updated_at && new Date(current.updated_at).toLocaleString("fr-FR")}
                </>
              )}
            </span>
            {!current.is_default && (
              <button
                onClick={reset}
                className="text-elsai-urgence hover:underline"
                disabled={saving}
              >
                Rollback défaut
              </button>
            )}
          </div>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={22}
            className="border-elsai-pin/20 focus:border-elsai-pin rounded-organic w-full border bg-white/90 p-3 font-mono text-xs focus:outline-none"
          />

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving || draft === current.content}
              className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-4 py-2 text-sm transition-colors disabled:opacity-40"
            >
              {saving ? "Enregistrement…" : "Publier cette version"}
            </button>
            <span className="text-elsai-ink/60 text-xs">{draft.length} caractères</span>
          </div>

          {info && <p className="text-elsai-pin-dark mt-3 text-xs">{info}</p>}
          {error && <p className="text-elsai-urgence mt-3 text-xs">{error}</p>}
        </div>
      )}
    </>
  );
}
