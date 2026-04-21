/**
 * Utilitaires IA pour la "mise en page" — transforme du texte en structure
 * (sections H2/H3, listes, étapes HowTo, FAQ, Callout).
 *
 * S'appuie sur l'endpoint `/api/admin/ai/rewrite` déjà existant — on lui passe
 * une instruction stricte demandant soit du HTML, soit du JSON strict.
 */

import { aiRewrite } from "@/lib/admin/contentApi";

/** Nettoie une réponse LLM qui peut contenir ```html ... ``` ou ```json ... ``` */
function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:html|json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

/** Essaie d'extraire un bloc JSON `{...}` depuis une réponse LLM. */
function extractJson<T>(raw: string): T | null {
  const cleaned = stripFences(raw);
  // tentative directe
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    /* noop */
  }
  // tentative par extraction du premier { ... } équilibré (best-effort)
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

export async function aiToSections(text: string): Promise<string> {
  const { text: raw } = await aiRewrite(
    text,
    "Découpe ce texte en sections claires avec des sous-titres HTML <h2> et/ou <h3>, " +
      "et des paragraphes <p>. Conserve le sens et le style. " +
      "Réponds UNIQUEMENT avec du HTML valide (pas de markdown, pas d'explication).",
  );
  return stripFences(raw);
}

export async function aiToBulletList(text: string): Promise<string> {
  const { text: raw } = await aiRewrite(
    text,
    "Transforme ce texte en liste à puces HTML <ul><li>…</li></ul>. " +
      "Réponds UNIQUEMENT avec le HTML, pas de markdown ni d'explication.",
  );
  return stripFences(raw);
}

export async function aiToHowTo(
  text: string,
): Promise<Array<{ name: string; text: string }>> {
  const { text: raw } = await aiRewrite(
    text,
    "Extrais ce texte en étapes numérotées. Réponds UNIQUEMENT avec un JSON de la forme " +
      '{"steps":[{"name":"Titre court","text":"description"}]}. ' +
      "Pas de markdown, pas d'explication.",
  );
  const parsed = extractJson<{ steps?: Array<{ name: string; text: string }> }>(raw);
  return parsed?.steps ?? [];
}

export async function aiToFAQ(
  text: string,
): Promise<Array<{ question: string; answer: string }>> {
  const { text: raw } = await aiRewrite(
    text,
    "Transforme ce texte en FAQ. Réponds UNIQUEMENT avec un JSON de la forme " +
      '{"items":[{"question":"…","answer":"…"}]}. ' +
      "Pas de markdown, pas d'explication.",
  );
  const parsed = extractJson<{
    items?: Array<{ question: string; answer: string }>;
  }>(raw);
  return parsed?.items ?? [];
}

export async function aiToCallout(
  text: string,
): Promise<{ variant: "info" | "success" | "warning" | "danger"; text: string }> {
  const { text: raw } = await aiRewrite(
    text,
    "Résume ce texte en un encadré court et frappant. Choisis un variant parmi " +
      'info | success | warning | danger. Réponds UNIQUEMENT avec un JSON de la forme ' +
      '{"variant":"info","text":"…"}. Pas de markdown, pas d\'explication.',
  );
  const parsed = extractJson<{
    variant?: "info" | "success" | "warning" | "danger";
    text?: string;
  }>(raw);
  return {
    variant: parsed?.variant ?? "info",
    text: parsed?.text ?? text,
  };
}

/** Restructure tout un article : titres, paragraphes, listes, séparateurs. */
export async function aiLayout(html: string): Promise<string> {
  const { text: raw } = await aiRewrite(
    html,
    "Restructure ce contenu HTML pour en améliorer la mise en page SEO et la lisibilité : " +
      "ajoute ou ajuste des sous-titres <h2>/<h3>, découpe les gros paragraphes, " +
      "introduis des listes <ul>/<ol> quand pertinent, et ajoute des séparateurs <hr> " +
      "entre les grandes parties. Conserve tout le sens et le ton. " +
      "Préserve intact tout <div data-elsai-block=…> — ne modifie surtout pas ces balises. " +
      "Réponds UNIQUEMENT avec du HTML valide.",
  );
  return stripFences(raw);
}
