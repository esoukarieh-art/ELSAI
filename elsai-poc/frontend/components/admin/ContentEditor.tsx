"use client";

import { EditorContent, EditorRoot, StarterKit, type EditorInstance } from "novel";
import { useRef, useState } from "react";

interface Props {
  initialContent: string;
  onChange: (html: string, plainText: string) => void;
  onInsertCTA: () => void;
}

const SLASH_ITEMS: Array<{ cmd: string; label: string; snippet: string }> = [
  {
    cmd: "/faq",
    label: "Bloc FAQ",
    snippet: `<FAQ items={[{"question":"?","answer":"..."}]} />`,
  },
  {
    cmd: "/howto",
    label: "Bloc HowTo",
    snippet: `<HowTo steps={[{"name":"Étape 1","text":"..."}]} />`,
  },
  {
    cmd: "/callout",
    label: "Encadré",
    snippet: `<Callout variant="info">Texte de l'encadré</Callout>`,
  },
  {
    cmd: "/lead-magnet",
    label: "Lead magnet",
    snippet: `<LeadMagnet slug="a-definir" />`,
  },
];

export default function ContentEditor({
  initialContent,
  onChange,
  onInsertCTA,
}: Props) {
  const [editor, setEditor] = useState<EditorInstance | null>(null);
  const lastRef = useRef<string>(initialContent);

  function insertText(text: string) {
    if (!editor) return;
    editor.chain().focus().insertContent(text).run();
  }

  function insertBlock(snippet: string) {
    if (!editor) return;
    editor.chain().focus().insertContent(`<p>${snippet}</p>`).run();
  }

  return (
    <div className="rounded-organic border-elsai-pin/15 bg-white border">
      {/* Slash-menu toolbar (simplified for P0.5) */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 p-2 text-xs">
        <span className="text-elsai-ink/50 mr-1">Slash menu :</span>
        <button
          type="button"
          onClick={onInsertCTA}
          className="rounded-organic border-elsai-pin/20 text-elsai-pin-dark hover:bg-elsai-pin/10 border bg-white px-2 py-1"
        >
          /cta
        </button>
        {SLASH_ITEMS.map((it) => (
          <button
            key={it.cmd}
            type="button"
            onClick={() => insertBlock(it.snippet)}
            className="rounded-organic border-elsai-pin/20 text-elsai-pin-dark hover:bg-elsai-pin/10 border bg-white px-2 py-1"
          >
            {it.cmd}
          </button>
        ))}
      </div>
      <EditorRoot>
        <EditorContent
          extensions={[StarterKit.configure({ heading: { levels: [1, 2, 3] } })]}
          onCreate={({ editor: e }) => {
            if (initialContent) e.commands.setContent(initialContent, false);
            setEditor(e);
          }}
          onUpdate={({ editor: e }) => {
            const html = e.getHTML();
            if (html !== lastRef.current) {
              lastRef.current = html;
              onChange(html, e.getText());
            }
          }}
          editorProps={{
            attributes: {
              class:
                "prose prose-sm max-w-none p-4 focus:outline-none min-h-[320px] text-elsai-ink",
            },
          }}
        />
      </EditorRoot>
      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-1.5 text-[11px] text-elsai-ink/50">
        <span>Éditeur Novel (Tiptap)</span>
        <button
          type="button"
          onClick={() => insertText(" ")}
          className="hover:text-elsai-pin-dark underline-offset-2 hover:underline"
        >
          focus
        </button>
      </div>
    </div>
  );
}
