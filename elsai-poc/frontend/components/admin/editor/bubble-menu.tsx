"use client";

import {
  EditorBubble,
  EditorBubbleItem,
  useEditor,
} from "novel";
import { useCallback, useEffect, useState } from "react";

import { aiRewrite, aiShorten, aiExpand } from "@/lib/admin/contentApi";
import {
  aiToBulletList,
  aiToCallout,
  aiToFAQ,
  aiToHowTo,
  aiToSections,
} from "./ai-structure";

type FormatBtnProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
};

function FormatBtn({ active, onClick, children, title }: FormatBtnProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-organic px-2 py-1 text-xs transition-colors ${
        active
          ? "bg-elsai-pin text-elsai-creme"
          : "text-elsai-ink hover:bg-elsai-pin/10"
      }`}
    >
      {children}
    </button>
  );
}

function FormatGroup() {
  const { editor } = useEditor();
  if (!editor) return null;

  const items: FormatBtnProps[] = [
    {
      title: "Gras (Ctrl+B)",
      active: editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run(),
      children: <strong>B</strong>,
    },
    {
      title: "Italique (Ctrl+I)",
      active: editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run(),
      children: <em>I</em>,
    },
    {
      title: "Souligné (Ctrl+U)",
      active: editor.isActive("underline"),
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      children: <u>U</u>,
    },
    {
      title: "Barré",
      active: editor.isActive("strike"),
      onClick: () => editor.chain().focus().toggleStrike().run(),
      children: <s>S</s>,
    },
    {
      title: "Code inline",
      active: editor.isActive("code"),
      onClick: () => editor.chain().focus().toggleCode().run(),
      children: <code>{"<>"}</code>,
    },
    {
      title: "Surlignage",
      active: editor.isActive("highlight"),
      onClick: () => (editor.chain().focus() as any).toggleHighlight().run(),
      children: <span className="bg-yellow-200 px-0.5">H</span>,
    },
  ];

  return (
    <>
      {items.map((it, i) => (
        <EditorBubbleItem key={i} onSelect={() => it.onClick()}>
          <FormatBtn {...it} />
        </EditorBubbleItem>
      ))}
    </>
  );
}

function LinkButton() {
  const { editor } = useEditor();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editor?.isActive("link")) {
      setUrl((editor.getAttributes("link").href as string) ?? "");
    } else {
      setUrl("");
    }
  }, [open, editor]);

  const apply = useCallback(() => {
    if (!editor) return;
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setOpen(false);
  }, [editor, url]);

  if (!editor) return null;
  const active = editor.isActive("link");

  return (
    <div className="relative">
      <FormatBtn
        title="Lien"
        active={active}
        onClick={() => setOpen((v) => !v)}
      >
        🔗
      </FormatBtn>
      {open && (
        <div className="rounded-organic border-elsai-pin/20 absolute left-0 top-full z-50 mt-1 flex items-center gap-1 border bg-white p-1 shadow-lg">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply();
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="https://…"
            className="rounded-organic border-elsai-pin/20 w-56 border px-2 py-1 text-xs focus:outline-none"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={apply}
            className="rounded-organic bg-elsai-pin text-elsai-creme px-2 py-1 text-xs"
          >
            OK
          </button>
          {active && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                setOpen(false);
              }}
              className="rounded-organic text-elsai-urgence px-1 text-xs"
              title="Retirer le lien"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type AiAction = "rewrite" | "shorten" | "expand" | "fix";

const AI_ACTIONS: Array<{ key: AiAction; label: string; hint: string }> = [
  { key: "rewrite", label: "Reformuler", hint: "Reformule avec un ton plus naturel" },
  { key: "shorten", label: "Raccourcir", hint: "Condense sans perdre le sens" },
  { key: "expand", label: "Développer", hint: "Enrichit et précise" },
  { key: "fix", label: "Corriger", hint: "Orthographe / grammaire, sans changer le sens" },
];

async function runAi(action: AiAction, text: string): Promise<string> {
  switch (action) {
    case "rewrite":
      return (await aiRewrite(text, "Reformule plus naturellement, conserve le sens.")).text;
    case "shorten":
      return (await aiShorten(text)).text;
    case "expand":
      return (await aiExpand(text)).text;
    case "fix":
      return (
        await aiRewrite(
          text,
          "Corrige l'orthographe et la grammaire sans changer le sens ni le style.",
        )
      ).text;
  }
}

function AiDropdown() {
  const { editor } = useEditor();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<AiAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (action: AiAction) => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      if (from === to) return;
      const text = editor.state.doc.textBetween(from, to, " ").trim();
      if (!text) return;

      setBusy(action);
      setError(null);
      try {
        const result = await runAi(action, text);
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent(result)
          .run();
        setOpen(false);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(null);
      }
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="relative">
      <FormatBtn
        title="Assistant IA"
        active={open}
        onClick={() => setOpen((v) => !v)}
      >
        ✨ IA
      </FormatBtn>
      {open && (
        <div className="rounded-organic border-elsai-pin/20 absolute right-0 top-full z-50 mt-1 w-56 border bg-white p-1 shadow-lg">
          {AI_ACTIONS.map((a) => (
            <button
              key={a.key}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(a.key)}
              disabled={busy !== null}
              className="hover:bg-elsai-pin/10 flex w-full items-start gap-2 rounded-organic px-2 py-1.5 text-left text-xs disabled:opacity-50"
            >
              <span className="text-elsai-pin-dark font-medium">
                {busy === a.key ? "…" : a.label}
              </span>
              <span className="text-elsai-ink/60 text-[10px]">{a.hint}</span>
            </button>
          ))}
          {error && (
            <p className="text-elsai-urgence mt-1 px-2 text-[10px]">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

type StructureAction =
  | "sections"
  | "bullets"
  | "howto"
  | "faq"
  | "callout";

const STRUCTURE_ACTIONS: Array<{
  key: StructureAction;
  label: string;
  hint: string;
}> = [
  { key: "sections", label: "📋 En sections", hint: "Découpe avec H2/H3 + paragraphes" },
  { key: "bullets", label: "• En liste", hint: "Transforme en liste à puces" },
  { key: "howto", label: "1→2 En étapes", hint: "Extrait en bloc HowTo éditable" },
  { key: "faq", label: "❓ En FAQ", hint: "Détecte Q/R → bloc FAQ éditable" },
  { key: "callout", label: "💡 En encadré", hint: "Résume en Callout (variant auto)" },
];

function StructureDropdown() {
  const { editor } = useEditor();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<StructureAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (action: StructureAction) => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      if (from === to) return;
      const text = editor.state.doc.textBetween(from, to, "\n").trim();
      if (!text) return;

      setBusy(action);
      setError(null);
      try {
        if (action === "sections") {
          const html = await aiToSections(text);
          editor.chain().focus().deleteRange({ from, to }).insertContent(html).run();
        } else if (action === "bullets") {
          const html = await aiToBulletList(text);
          editor.chain().focus().deleteRange({ from, to }).insertContent(html).run();
        } else if (action === "howto") {
          const steps = await aiToHowTo(text);
          editor
            .chain()
            .focus()
            .deleteRange({ from, to })
            .insertContent({
              type: "mdxBlock",
              attrs: { tag: "HowTo", props: { steps } },
            })
            .run();
        } else if (action === "faq") {
          const items = await aiToFAQ(text);
          editor
            .chain()
            .focus()
            .deleteRange({ from, to })
            .insertContent({
              type: "mdxBlock",
              attrs: { tag: "FAQ", props: { items } },
            })
            .run();
        } else if (action === "callout") {
          const { variant, text: body } = await aiToCallout(text);
          editor
            .chain()
            .focus()
            .deleteRange({ from, to })
            .insertContent({
              type: "mdxBlock",
              attrs: { tag: "Callout", props: { variant, text: body } },
            })
            .run();
        }
        setOpen(false);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(null);
      }
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="relative">
      <FormatBtn
        title="Mise en page IA (sélection)"
        active={open}
        onClick={() => setOpen((v) => !v)}
      >
        🪄
      </FormatBtn>
      {open && (
        <div className="rounded-organic border-elsai-pin/20 absolute right-0 top-full z-50 mt-1 w-60 border bg-white p-1 shadow-lg">
          {STRUCTURE_ACTIONS.map((a) => (
            <button
              key={a.key}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(a.key)}
              disabled={busy !== null}
              className="hover:bg-elsai-pin/10 flex w-full flex-col items-start gap-0 rounded-organic px-2 py-1.5 text-left text-xs disabled:opacity-50"
            >
              <span className="text-elsai-pin-dark font-medium">
                {busy === a.key ? "…" : a.label}
              </span>
              <span className="text-elsai-ink/60 text-[10px]">{a.hint}</span>
            </button>
          ))}
          {error && (
            <p className="text-elsai-urgence mt-1 px-2 text-[10px]">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function ContentBubbleMenu() {
  return (
    <EditorBubble
      tippyOptions={{ placement: "top", duration: 150 }}
      className="rounded-organic border-elsai-pin/20 flex items-center gap-0.5 border bg-white p-1 shadow-lg"
    >
      <FormatGroup />
      <span className="mx-1 h-4 w-px bg-elsai-pin/20" />
      <LinkButton />
      <span className="mx-1 h-4 w-px bg-elsai-pin/20" />
      <AiDropdown />
      <StructureDropdown />
    </EditorBubble>
  );
}
