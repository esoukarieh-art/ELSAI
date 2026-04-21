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
        <span>Éditeur Novel (Tiptap) · tape « / » pour insérer un bloc</span>
        <span>
          {words} mots · {chars} car. · ≈ {readingMinutes} min de lecture
        </span>
      </div>
    </div>
  );
}
