"use client";

import { Command, createSuggestionItems, renderItems, type SuggestionItem } from "novel";

import type { MdxBlockProps, MdxBlockTag } from "./mdx-transform";

export type SlashOptions = {
  onInsertCTA: () => void;
};

function insertMdxBlock(tag: MdxBlockTag, props: MdxBlockProps) {
  return ({ editor, range }: { editor: any; range: any }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent({ type: "mdxBlock", attrs: { tag, props } })
      .run();
  };
}

function icon(label: string) {
  return (
    <span
      aria-hidden
      className="bg-elsai-creme text-elsai-pin-dark flex h-8 w-8 items-center justify-center rounded-organic border border-elsai-pin/20 text-xs font-semibold"
    >
      {label}
    </span>
  );
}

export function buildSlashItems(opts: SlashOptions): SuggestionItem[] {
  return createSuggestionItems([
    {
      title: "Titre 1",
      description: "Gros titre",
      icon: icon("H1"),
      searchTerms: ["h1", "titre", "heading"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
      },
    },
    {
      title: "Titre 2",
      description: "Titre de section",
      icon: icon("H2"),
      searchTerms: ["h2", "titre", "heading", "section"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
      },
    },
    {
      title: "Titre 3",
      description: "Sous-section",
      icon: icon("H3"),
      searchTerms: ["h3", "titre", "heading"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
      },
    },
    {
      title: "Liste à puces",
      description: "Liste non ordonnée",
      icon: icon("•"),
      searchTerms: ["liste", "puce", "ul", "bullet"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Liste numérotée",
      description: "1, 2, 3…",
      icon: icon("1."),
      searchTerms: ["liste", "ol", "numero"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "Checklist",
      description: "Cases à cocher",
      icon: icon("☑"),
      searchTerms: ["todo", "task", "check", "checklist"],
      command: ({ editor, range }) => {
        (editor.chain().focus().deleteRange(range) as any).toggleTaskList().run();
      },
    },
    {
      title: "Citation",
      description: "Bloc de citation",
      icon: icon("❝"),
      searchTerms: ["quote", "citation", "blockquote"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: "Bloc code",
      description: "Code avec coloration syntaxique",
      icon: icon("</>"),
      searchTerms: ["code", "snippet"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: "Séparateur",
      description: "Ligne horizontale",
      icon: icon("—"),
      searchTerms: ["hr", "separator", "divider"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: "Image",
      description: "Insérer une image par URL",
      icon: icon("🖼"),
      searchTerms: ["image", "img", "photo", "picture"],
      command: ({ editor, range }) => {
        const url = window.prompt("URL de l'image :");
        if (!url) return;
        (editor.chain().focus().deleteRange(range) as any).setImage({ src: url }).run();
      },
    },
    {
      title: "CTA",
      description: "Attacher un CTA à l'article",
      icon: icon("CTA"),
      searchTerms: ["cta", "call", "action"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        opts.onInsertCTA();
      },
    },
    {
      title: "Bloc FAQ",
      description: "Liste de questions/réponses éditable",
      icon: icon("FAQ"),
      searchTerms: ["faq", "question"],
      command: insertMdxBlock("FAQ", {
        items: [{ question: "", answer: "" }],
      }),
    },
    {
      title: "Bloc HowTo",
      description: "Procédure étape par étape éditable",
      icon: icon("1→2"),
      searchTerms: ["howto", "guide", "etape", "step"],
      command: insertMdxBlock("HowTo", {
        steps: [{ name: "Étape 1", text: "" }],
      }),
    },
    {
      title: "Encadré",
      description: "Callout (info / success / warning / danger)",
      icon: icon("!"),
      searchTerms: ["callout", "encadre", "info", "note"],
      command: insertMdxBlock("Callout", {
        variant: "info",
        text: "Texte de l'encadré",
      }),
    },
    {
      title: "Lead magnet",
      description: "Référence à un lead-magnet par slug",
      icon: icon("LM"),
      searchTerms: ["lead", "magnet"],
      command: insertMdxBlock("LeadMagnet", { slug: "" }),
    },
  ]);
}

export function buildSlashCommand(opts: SlashOptions) {
  return Command.configure({
    suggestion: {
      items: () => buildSlashItems(opts),
      render: renderItems,
    },
  });
}
