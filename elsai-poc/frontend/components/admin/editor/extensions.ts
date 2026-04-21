"use client";

import {
  CharacterCount,
  CodeBlockLowlight,
  GlobalDragHandle,
  HighlightExtension,
  HorizontalRule,
  Placeholder,
  StarterKit,
  TaskItem,
  TaskList,
  TiptapLink,
  TiptapUnderline,
  UpdatedImage,
} from "novel";
import Typography from "@tiptap/extension-typography";
import { common, createLowlight } from "lowlight";

import { MdxBlock } from "./mdx-block";
import { AiContinue } from "./ai-continue";

const lowlight = createLowlight(common);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultExtensions: any[] = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    codeBlock: false,
    horizontalRule: false,
    dropcursor: { color: "#5A7E6B", width: 2 },
    bulletList: { HTMLAttributes: { class: "list-disc pl-5" } },
    orderedList: { HTMLAttributes: { class: "list-decimal pl-5" } },
    blockquote: {
      HTMLAttributes: {
        class: "border-l-2 border-elsai-pin/40 pl-3 italic text-elsai-ink/80",
      },
    },
  }),
  HorizontalRule,
  TiptapUnderline,
  TiptapLink.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    HTMLAttributes: {
      class:
        "text-elsai-pin-dark underline underline-offset-2 cursor-pointer hover:text-elsai-pin",
    },
  }),
  TaskList.configure({ HTMLAttributes: { class: "not-prose space-y-1" } }),
  TaskItem.configure({
    nested: true,
    HTMLAttributes: { class: "flex items-start gap-2" },
  }),
  CodeBlockLowlight.configure({
    lowlight,
    HTMLAttributes: {
      class:
        "rounded-organic bg-slate-900 text-slate-100 p-3 text-xs font-mono overflow-x-auto",
    },
  }),
  Typography,
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") return `Titre H${node.attrs.level}…`;
      return "Tape '/' pour insérer un bloc, ou commence à écrire…";
    },
    includeChildren: true,
  }),
  HighlightExtension.configure({ multicolor: true }),
  CharacterCount,
  GlobalDragHandle.configure({
    dragHandleWidth: 20,
    scrollTreshold: 100,
  }),
  UpdatedImage.configure({
    HTMLAttributes: { class: "rounded-organic my-4 max-w-full" },
  }),
  MdxBlock,
  AiContinue,
];
