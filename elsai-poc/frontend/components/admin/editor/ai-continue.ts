"use client";

/**
 * Extension Tiptap : tape `++ ` (double-plus + espace) en fin de paragraphe
 * → le paragraphe est pris comme contexte, `aiExpand` est appelé, et le
 * résultat est inséré à la place du `++ `.
 *
 * Motif "Notion AI" : continuation contextuelle.
 */

import { Editor, Extension, InputRule } from "@tiptap/core";

import { aiExpand } from "@/lib/admin/contentApi";

const TOKEN_PREFIX = "__AICONTINUE_";
const TOKEN_SUFFIX = "__";

function makeToken(): string {
  return `${TOKEN_PREFIX}${Math.random().toString(36).slice(2, 10)}${TOKEN_SUFFIX}`;
}

function replaceToken(editor: Editor, token: string, replacement: string) {
  const { doc } = editor.state;
  let fromPos = -1;
  let toPos = -1;
  doc.descendants((node, pos) => {
    if (fromPos >= 0) return false;
    if (node.isText && node.text && node.text.includes(token)) {
      const idx = node.text.indexOf(token);
      fromPos = pos + idx;
      toPos = fromPos + token.length;
      return false;
    }
    return true;
  });
  if (fromPos < 0) return;
  editor
    .chain()
    .focus()
    .deleteRange({ from: fromPos, to: toPos })
    .insertContent(replacement || "")
    .run();
}

export const AiContinue = Extension.create({
  name: "aiContinue",

  addInputRules() {
    return [
      new InputRule({
        find: /\+\+ $/,
        handler: ({ state, range }) => {
          const editor = this.editor;
          if (!editor) return;

          // Texte du paragraphe courant, jusqu'au curseur.
          const $from = state.doc.resolve(range.from);
          const paraStart = $from.start($from.depth);
          const paragraphText = state.doc
            .textBetween(paraStart, range.from, " ")
            .trim();
          if (!paragraphText) return;

          const token = makeToken();

          // Remplace immédiatement "++ " par un token visible pour que l'utilisateur
          // voie qu'une génération est en cours.
          editor
            .chain()
            .deleteRange(range)
            .insertContent(`${token} `)
            .run();

          // Appel IA asynchrone → remplace le token par le résultat.
          aiExpand(paragraphText)
            .then(({ text }) => {
              replaceToken(editor, token, text.startsWith(" ") ? text : ` ${text}`);
            })
            .catch(() => {
              replaceToken(editor, token, "");
            });

          return;
        },
      }),
    ];
  },
});
