"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { useMemo, useState } from "react";

import type { MdxBlockProps, MdxBlockTag } from "./mdx-transform";

/* -------------------- Tiptap Node -------------------- */

export const MdxBlock = Node.create({
  name: "mdxBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      tag: { default: "Callout" as MdxBlockTag },
      props: { default: {} as MdxBlockProps },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-elsai-block]',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false;
          const tag = el.getAttribute("data-elsai-block") as MdxBlockTag;
          const raw = el.getAttribute("data-props") ?? "{}";
          let props: MdxBlockProps = {};
          try {
            props = JSON.parse(raw.replace(/&quot;/g, '"'));
          } catch {
            props = {};
          }
          return { tag, props };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const tag = node.attrs.tag as MdxBlockTag;
    const props = node.attrs.props as MdxBlockProps;
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-elsai-block": tag,
        "data-props": JSON.stringify(props).replace(/"/g, "&quot;"),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxBlockView);
  },
});

/* -------------------- React NodeView -------------------- */

function MdxBlockView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, selected } = props;
  const tag = node.attrs.tag as MdxBlockTag;
  const attrs = (node.attrs.props ?? {}) as MdxBlockProps;
  const [editing, setEditing] = useState(false);

  const setProps = (next: MdxBlockProps) => {
    updateAttributes({ props: { ...attrs, ...next } });
  };

  const label = useMemo(() => LABELS[tag] ?? tag, [tag]);

  return (
    <NodeViewWrapper
      className={`mdx-block rounded-organic my-3 border p-3 text-sm transition-colors ${
        selected
          ? "border-elsai-pin bg-elsai-pin/5"
          : "border-elsai-pin/20 bg-elsai-creme/30"
      }`}
      data-drag-handle
    >
      <header className="mb-2 flex items-center justify-between gap-2">
        <span className="text-elsai-pin-dark text-[11px] font-semibold uppercase tracking-wide">
          {label}
        </span>
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-elsai-pin-dark rounded-organic border border-elsai-pin/30 px-2 py-0.5 hover:bg-elsai-pin/10"
          >
            {editing ? "Fermer" : "Éditer"}
          </button>
          <button
            type="button"
            onClick={() => deleteNode()}
            className="text-elsai-urgence rounded-organic border border-rose-200 px-2 py-0.5 hover:bg-rose-50"
          >
            Retirer
          </button>
        </div>
      </header>

      {!editing && <Preview tag={tag} attrs={attrs} />}
      {editing && <Form tag={tag} attrs={attrs} onChange={setProps} />}
    </NodeViewWrapper>
  );
}

const LABELS: Record<MdxBlockTag, string> = {
  Callout: "Encadré",
  FAQ: "Bloc FAQ",
  HowTo: "Bloc HowTo",
  LeadMagnet: "Lead magnet",
};

/* -------------------- Previews -------------------- */

function Preview({ tag, attrs }: { tag: MdxBlockTag; attrs: MdxBlockProps }) {
  switch (tag) {
    case "Callout": {
      const variant = (attrs.variant as string) || "info";
      const text = (attrs.text as string) || "(encadré vide)";
      return (
        <div className={`rounded-organic border-l-4 px-3 py-2 ${CALLOUT_COLORS[variant] ?? CALLOUT_COLORS.info}`}>
          <p className="text-[10px] uppercase opacity-70">{variant}</p>
          <p>{text}</p>
        </div>
      );
    }
    case "FAQ": {
      const items = (attrs.items as Array<{ question: string; answer: string }>) ?? [];
      if (items.length === 0)
        return <p className="text-elsai-ink/50 italic">(aucune question)</p>;
      return (
        <ul className="space-y-1">
          {items.map((it, i) => (
            <li key={i} className="text-xs">
              <strong>Q : </strong>
              {it.question}
              <br />
              <span className="text-elsai-ink/70">
                <strong>R : </strong>
                {it.answer}
              </span>
            </li>
          ))}
        </ul>
      );
    }
    case "HowTo": {
      const steps = (attrs.steps as Array<{ name: string; text: string }>) ?? [];
      if (steps.length === 0)
        return <p className="text-elsai-ink/50 italic">(aucune étape)</p>;
      return (
        <ol className="list-decimal space-y-1 pl-5 text-xs">
          {steps.map((s, i) => (
            <li key={i}>
              <strong>{s.name}</strong> — {s.text}
            </li>
          ))}
        </ol>
      );
    }
    case "LeadMagnet": {
      const slug = (attrs.slug as string) || "(slug à définir)";
      return (
        <p className="text-xs">
          Lead magnet : <code className="rounded bg-white px-1">{slug}</code>
        </p>
      );
    }
    default:
      return null;
  }
}

const CALLOUT_COLORS: Record<string, string> = {
  info: "border-elsai-pin/60 bg-elsai-pin/5 text-elsai-ink",
  success: "border-emerald-500 bg-emerald-50 text-emerald-900",
  warning: "border-amber-500 bg-amber-50 text-amber-900",
  danger: "border-rose-500 bg-rose-50 text-rose-900",
};

/* -------------------- Forms -------------------- */

const INPUT =
  "rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-2 py-1 text-xs focus:outline-none";

function Form({
  tag,
  attrs,
  onChange,
}: {
  tag: MdxBlockTag;
  attrs: MdxBlockProps;
  onChange: (next: MdxBlockProps) => void;
}) {
  if (tag === "Callout") return <CalloutForm attrs={attrs} onChange={onChange} />;
  if (tag === "LeadMagnet") return <LeadMagnetForm attrs={attrs} onChange={onChange} />;
  if (tag === "FAQ") return <FAQForm attrs={attrs} onChange={onChange} />;
  if (tag === "HowTo") return <HowToForm attrs={attrs} onChange={onChange} />;
  return null;
}

function CalloutForm({
  attrs,
  onChange,
}: {
  attrs: MdxBlockProps;
  onChange: (next: MdxBlockProps) => void;
}) {
  const variant = (attrs.variant as string) || "info";
  const text = (attrs.text as string) || "";
  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-elsai-ink/70 block text-[10px] uppercase">Variant</span>
        <select
          value={variant}
          onChange={(e) => onChange({ variant: e.target.value })}
          className={INPUT}
        >
          <option value="info">info</option>
          <option value="success">success</option>
          <option value="warning">warning</option>
          <option value="danger">danger</option>
        </select>
      </label>
      <label className="block">
        <span className="text-elsai-ink/70 block text-[10px] uppercase">Texte</span>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => onChange({ text: e.target.value })}
          className={INPUT}
        />
      </label>
    </div>
  );
}

function LeadMagnetForm({
  attrs,
  onChange,
}: {
  attrs: MdxBlockProps;
  onChange: (next: MdxBlockProps) => void;
}) {
  return (
    <label className="block">
      <span className="text-elsai-ink/70 block text-[10px] uppercase">Slug</span>
      <input
        value={(attrs.slug as string) || ""}
        onChange={(e) => onChange({ slug: e.target.value })}
        placeholder="guide-anxiete"
        className={INPUT}
      />
    </label>
  );
}

function FAQForm({
  attrs,
  onChange,
}: {
  attrs: MdxBlockProps;
  onChange: (next: MdxBlockProps) => void;
}) {
  const items = (attrs.items as Array<{ question: string; answer: string }>) ?? [];
  const update = (i: number, patch: Partial<{ question: string; answer: string }>) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
    onChange({ items: next });
  };
  const add = () => onChange({ items: [...items, { question: "", answer: "" }] });
  const remove = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="rounded-organic border border-elsai-pin/10 bg-white p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-elsai-ink/60 text-[10px] uppercase">Q{i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-elsai-urgence text-[10px] underline"
            >
              supprimer
            </button>
          </div>
          <input
            value={it.question}
            onChange={(e) => update(i, { question: e.target.value })}
            placeholder="Question"
            className={`${INPUT} mb-1`}
          />
          <textarea
            rows={2}
            value={it.answer}
            onChange={(e) => update(i, { answer: e.target.value })}
            placeholder="Réponse"
            className={INPUT}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-elsai-pin-dark rounded-organic border border-elsai-pin/30 px-2 py-1 text-xs hover:bg-elsai-pin/10"
      >
        + Ajouter une question
      </button>
    </div>
  );
}

function HowToForm({
  attrs,
  onChange,
}: {
  attrs: MdxBlockProps;
  onChange: (next: MdxBlockProps) => void;
}) {
  const steps = (attrs.steps as Array<{ name: string; text: string }>) ?? [];
  const update = (i: number, patch: Partial<{ name: string; text: string }>) => {
    const next = steps.map((st, idx) => (idx === i ? { ...st, ...patch } : st));
    onChange({ steps: next });
  };
  const add = () =>
    onChange({
      steps: [...steps, { name: `Étape ${steps.length + 1}`, text: "" }],
    });
  const remove = (i: number) => onChange({ steps: steps.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-2">
      {steps.map((st, i) => (
        <div key={i} className="rounded-organic border border-elsai-pin/10 bg-white p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-elsai-ink/60 text-[10px] uppercase">#{i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-elsai-urgence text-[10px] underline"
            >
              supprimer
            </button>
          </div>
          <input
            value={st.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="Nom de l'étape"
            className={`${INPUT} mb-1`}
          />
          <textarea
            rows={2}
            value={st.text}
            onChange={(e) => update(i, { text: e.target.value })}
            placeholder="Description"
            className={INPUT}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-elsai-pin-dark rounded-organic border border-elsai-pin/30 px-2 py-1 text-xs hover:bg-elsai-pin/10"
      >
        + Ajouter une étape
      </button>
    </div>
  );
}
