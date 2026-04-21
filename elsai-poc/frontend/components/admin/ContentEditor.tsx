"use client";

import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorRoot,
  handleCommandNavigation,
  type EditorInstance,
} from "novel";
import { useMemo, useRef, useState } from "react";

import { defaultExtensions } from "./editor/extensions";
import { buildSlashCommand, buildSlashItems } from "./editor/slash-command";
import { ContentBubbleMenu } from "./editor/bubble-menu";
import { htmlToMdx, mdxToHtml } from "./editor/mdx-transform";
import { aiLayout } from "./editor/ai-structure";

interface Props {
  initialContent: string;
  onChange: (html: string, plainText: string) => void;
  onInsertCTA: () => void;
}

export default function ContentEditor({
  initialContent,
  onChange,
  onInsertCTA,
}: Props) {
  const [editor, setEditor] = useState<EditorInstance | null>(null);
  const lastRef = useRef<string>(initialContent);

  const slashItems = useMemo(() => buildSlashItems({ onInsertCTA }), [onInsertCTA]);
  const extensions = useMemo(
    () => [...defaultExtensions, buildSlashCommand({ onInsertCTA })],
    [onInsertCTA],
  );

  const chars = editor?.storage.characterCount?.characters?.() ?? 0;
  const words = editor?.storage.characterCount?.words?.() ?? 0;
  const readingMinutes = Math.max(1, Math.round(words / 200));

  const [layoutBusy, setLayoutBusy] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  async function runLayoutIA() {
    if (!editor) return;
    const html = editor.getHTML();
    if (!html.trim()) return;
    if (
      !window.confirm(
        "L'IA va restructurer la mise en page de tout l'article (titres, listes, séparateurs). " +
          "Tu pourras annuler avec Ctrl+Z. Continuer ?",
      )
    )
      return;
    setLayoutBusy(true);
    setLayoutError(null);
    try {
      const next = await aiLayout(html);
      editor.chain().focus().setContent(next, true).run();
    } catch (e) {
      setLayoutError((e as Error).message);
    } finally {
      setLayoutBusy(false);
    }
  }

  return (
    <div className="rounded-organic border-elsai-pin/15 bg-white relative border">
      <EditorRoot>
        <EditorContent
          extensions={extensions}
          onCreate={({ editor: e }) => {
            if (initialContent) {
              e.commands.setContent(mdxToHtml(initialContent), false);
            }
            setEditor(e);
          }}
          onUpdate={({ editor: e }) => {
            const html = e.getHTML();
            if (html !== lastRef.current) {
              lastRef.current = html;
              onChange(htmlToMdx(html), e.getText());
            }
          }}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            attributes: {
              class:
                "novel-editor prose prose-sm max-w-none p-4 pl-10 focus:outline-none min-h-[420px] text-elsai-ink",
            },
          }}
        >
          <EditorCommand className="rounded-organic border-elsai-pin/20 z-50 max-h-80 w-72 overflow-y-auto border bg-white p-1 shadow-xl">
            <EditorCommandEmpty className="text-elsai-ink/50 px-3 py-2 text-xs">
              Aucun bloc ne correspond.
            </EditorCommandEmpty>
            <EditorCommandList>
              {slashItems.map((item) => (
                <EditorCommandItem
                  key={item.title}
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className="hover:bg-elsai-pin/10 aria-selected:bg-elsai-pin/15 flex cursor-pointer items-center gap-2 rounded-organic px-2 py-1.5 text-sm"
                >
                  {item.icon}
                  <div className="min-w-0">
                    <p className="text-elsai-ink truncate font-medium">{item.title}</p>
                    <p className="text-elsai-ink/60 truncate text-[11px]">
                      {item.description}
                    </p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          <ContentBubbleMenu />
        </EditorContent>
      </EditorRoot>

      <div className="text-elsai-ink/50 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 py-1.5 text-[11px]">
        <span className="flex items-center gap-2">
          <span>Éditeur Novel (Tiptap) · tape « / » pour insérer un bloc</span>
          <button
            type="button"
            onClick={runLayoutIA}
            disabled={layoutBusy || !editor}
            title="Restructure tout l'article (H2/H3, listes, séparateurs)"
            className="rounded-organic border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/10 border px-2 py-0.5 text-[11px] disabled:opacity-50"
          >
            {layoutBusy ? "… IA en cours" : "🪄 Mise en page IA"}
          </button>
          {layoutError && (
            <span className="text-elsai-urgence text-[10px]">{layoutError}</span>
          )}
        </span>
        <span>
          {words} mots · {chars} car. · ≈ {readingMinutes} min de lecture
        </span>
      </div>
    </div>
  );
}
