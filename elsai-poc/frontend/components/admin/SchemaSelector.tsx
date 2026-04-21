"use client";

import { useEffect, useState } from "react";

export type SchemaType = "Article" | "HowTo" | "FAQPage" | "GovernmentService";

interface Props {
  value: SchemaType | string;
  extraJson: string;
  onChange: (schemaType: SchemaType, extraJson: string) => void;
}

const OPTIONS: { value: SchemaType; label: string; hint: string }[] = [
  { value: "Article", label: "Article", hint: "Contenu éditorial standard" },
  { value: "HowTo", label: "HowTo", hint: "Tutoriel étape par étape" },
  { value: "FAQPage", label: "FAQPage", hint: "Liste questions / réponses" },
  {
    value: "GovernmentService",
    label: "GovernmentService",
    hint: "Démarche administrative (RSA, APL…)",
  },
];

interface HowToStep {
  name: string;
  text: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

function safeParse(raw: string): Record<string, unknown> {
  try {
    const o = JSON.parse(raw || "{}");
    return typeof o === "object" && o !== null ? (o as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export default function SchemaSelector({ value, extraJson, onChange }: Props) {
  const [extra, setExtra] = useState<Record<string, unknown>>(() => safeParse(extraJson));

  useEffect(() => {
    setExtra(safeParse(extraJson));
  }, [extraJson]);

  function commit(next: Record<string, unknown>) {
    setExtra(next);
    onChange(value as SchemaType, JSON.stringify(next));
  }

  function switchType(next: SchemaType) {
    onChange(next, JSON.stringify({}));
    setExtra({});
  }

  const steps = (extra.steps as HowToStep[] | undefined) ?? [];
  const faqs = (extra.faqs as FaqItem[] | undefined) ?? [];

  return (
    <div className="space-y-3">
      <div>
        <label className="text-elsai-ink/80 mb-1 block text-xs uppercase">
          Type Schema.org
        </label>
        <select
          value={value}
          onChange={(e) => switchType(e.target.value as SchemaType)}
          className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} — {o.hint}
            </option>
          ))}
        </select>
      </div>

      {value === "HowTo" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-elsai-ink/70 text-xs uppercase">Étapes</span>
            <button
              type="button"
              onClick={() =>
                commit({
                  ...extra,
                  steps: [...steps, { name: "", text: "" }],
                })
              }
              className="text-elsai-pin-dark text-xs underline"
            >
              + étape
            </button>
          </div>
          {steps.map((s, i) => (
            <div key={i} className="space-y-1 rounded-organic border border-slate-200 p-2">
              <input
                value={s.name}
                placeholder="Nom de l'étape"
                onChange={(e) => {
                  const next = [...steps];
                  next[i] = { ...next[i], name: e.target.value };
                  commit({ ...extra, steps: next });
                }}
                className="rounded-organic w-full border border-slate-200 px-2 py-1 text-xs"
              />
              <textarea
                value={s.text}
                placeholder="Description"
                rows={2}
                onChange={(e) => {
                  const next = [...steps];
                  next[i] = { ...next[i], text: e.target.value };
                  commit({ ...extra, steps: next });
                }}
                className="rounded-organic w-full border border-slate-200 px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={() => commit({ ...extra, steps: steps.filter((_, j) => j !== i) })}
                className="text-elsai-urgence text-[11px] underline"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      {value === "FAQPage" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-elsai-ink/70 text-xs uppercase">Questions</span>
            <button
              type="button"
              onClick={() =>
                commit({ ...extra, faqs: [...faqs, { question: "", answer: "" }] })
              }
              className="text-elsai-pin-dark text-xs underline"
            >
              + question
            </button>
          </div>
          {faqs.map((f, i) => (
            <div key={i} className="space-y-1 rounded-organic border border-slate-200 p-2">
              <input
                value={f.question}
                placeholder="Question"
                onChange={(e) => {
                  const next = [...faqs];
                  next[i] = { ...next[i], question: e.target.value };
                  commit({ ...extra, faqs: next });
                }}
                className="rounded-organic w-full border border-slate-200 px-2 py-1 text-xs"
              />
              <textarea
                value={f.answer}
                placeholder="Réponse"
                rows={2}
                onChange={(e) => {
                  const next = [...faqs];
                  next[i] = { ...next[i], answer: e.target.value };
                  commit({ ...extra, faqs: next });
                }}
                className="rounded-organic w-full border border-slate-200 px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={() => commit({ ...extra, faqs: faqs.filter((_, j) => j !== i) })}
                className="text-elsai-urgence text-[11px] underline"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      {value === "GovernmentService" && (
        <div className="space-y-2">
          <label className="block text-xs">
            <span className="text-elsai-ink/70 mb-1 block uppercase">Nom du service</span>
            <input
              value={(extra.service_name as string) ?? ""}
              onChange={(e) => commit({ ...extra, service_name: e.target.value })}
              className="rounded-organic w-full border border-slate-200 px-2 py-1 text-xs"
            />
          </label>
          <label className="block text-xs">
            <span className="text-elsai-ink/70 mb-1 block uppercase">Opérateur</span>
            <input
              value={(extra.provider as string) ?? ""}
              placeholder="CAF, Pôle Emploi…"
              onChange={(e) => commit({ ...extra, provider: e.target.value })}
              className="rounded-organic w-full border border-slate-200 px-2 py-1 text-xs"
            />
          </label>
          <label className="block text-xs">
            <span className="text-elsai-ink/70 mb-1 block uppercase">
              Montant / barème (si applicable)
            </span>
            <input
              value={(extra.amount as string) ?? ""}
              onChange={(e) => commit({ ...extra, amount: e.target.value })}
              className="rounded-organic w-full border border-slate-200 px-2 py-1 text-xs"
            />
          </label>
        </div>
      )}
    </div>
  );
}
