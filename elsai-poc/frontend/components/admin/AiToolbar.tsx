"use client";

import { useState } from "react";

import {
  aiBrief,
  aiEditorialCheck,
  aiExpand,
  aiReadability,
  aiRewrite,
  aiShorten,
  aiSuggestSchema,
} from "@/lib/admin/contentApi";
import type {
  BriefResult,
  EditorialCheckResult,
  ReadabilityResult,
  SchemaSuggestion,
} from "@/lib/admin/types";

interface Props {
  getSelection: () => string;
  getContent: () => string;
  getTitle: () => string;
  getKeyword: () => string;
  audience: string;
  onApplyToSelection: (text: string) => void;
  onReadability: (res: ReadabilityResult) => void;
  onEditorial: (res: EditorialCheckResult) => void;
  onBrief: (res: BriefResult) => void;
  onSchemaSuggest: (res: SchemaSuggestion) => void;
}

export default function AiToolbar({
  getSelection,
  getContent,
  getTitle,
  getKeyword,
  audience,
  onApplyToSelection,
  onReadability,
  onEditorial,
  onBrief,
  onSchemaSuggest,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string, fn: () => Promise<void>) {
    setError(null);
    setBusy(action);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const pickTarget = () => getSelection() || getContent();

  const buttons: Array<{ label: string; key: string; run: () => Promise<void> }> = [
    {
      label: "Reformuler",
      key: "rewrite",
      run: async () => {
        const text = pickTarget();
        if (!text.trim()) return;
        const out = await aiRewrite(text, "Reformule plus clairement, ton empathique et franc");
        onApplyToSelection(out.text);
      },
    },
    {
      label: "Raccourcir",
      key: "shorten",
      run: async () => {
        const text = pickTarget();
        if (!text.trim()) return;
        const out = await aiShorten(text);
        onApplyToSelection(out.text);
      },
    },
    {
      label: "Développer",
      key: "expand",
      run: async () => {
        const text = pickTarget();
        if (!text.trim()) return;
        const out = await aiExpand(text);
        onApplyToSelection(out.text);
      },
    },
    {
      label: "Score lisibilité",
      key: "readability",
      run: async () => {
        const text = getContent();
        if (!text.trim()) return;
        const r = await aiReadability(text);
        onReadability(r);
      },
    },
    {
      label: "Check éditorial",
      key: "editorial",
      run: async () => {
        const text = getContent();
        if (!text.trim()) return;
        const r = await aiEditorialCheck(text, audience);
        onEditorial(r);
      },
    },
    {
      label: "Brief IA",
      key: "brief",
      run: async () => {
        const kw = getKeyword();
        if (!kw.trim()) {
          setError("Renseignez un target_keyword d'abord.");
          return;
        }
        const r = await aiBrief(kw, audience);
        onBrief(r);
      },
    },
    {
      label: "Suggérer schema",
      key: "schema",
      run: async () => {
        const content = getContent();
        const title = getTitle();
        if (!content.trim() || !title.trim()) return;
        const r = await aiSuggestSchema(content, title);
        onSchemaSuggest(r);
      },
    },
  ];

  return (
    <div className="rounded-organic border-elsai-pin/15 bg-elsai-creme/40 mb-2 flex flex-wrap items-center gap-1 border p-2">
      {buttons.map((b) => (
        <button
          key={b.key}
          onClick={() => run(b.key, b.run)}
          disabled={busy !== null}
          className="rounded-organic border-elsai-pin/20 text-elsai-pin-dark hover:bg-elsai-pin/10 border bg-white px-2 py-1 text-xs transition-colors disabled:opacity-50"
        >
          {busy === b.key ? "…" : b.label}
        </button>
      ))}
      {error && <span className="text-elsai-urgence ml-2 text-xs">{error}</span>}
    </div>
  );
}
