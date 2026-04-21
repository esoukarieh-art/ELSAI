/**
 * Round-trip HTML ↔ MDX pour les blocs custom (Callout, FAQ, HowTo, LeadMagnet).
 *
 * - Dans l'éditeur Tiptap, ces blocs sont stockés comme
 *   `<div data-elsai-block="Callout" data-props="{json}"></div>`.
 * - Dans le contenu MDX persistant, ils sont stockés comme
 *   `<Callout variant="info">…</Callout>`, `<FAQ items={[…]} />`, etc.
 *
 * Le regex pour les arrays (`{[…]}`) n'est PAS général : il s'appuie sur le fait
 * que nos props sont toujours des JSON plats (pas d'objets imbriqués arbitraires).
 * Suffisant pour les nœuds que nous générons.
 */

export type MdxBlockProps = Record<string, unknown>;

export type MdxBlockTag = "Callout" | "FAQ" | "HowTo" | "LeadMagnet";

function encodeProps(props: MdxBlockProps): string {
  return JSON.stringify(props).replace(/"/g, "&quot;");
}

function decodeProps(raw: string): MdxBlockProps {
  try {
    return JSON.parse(raw.replace(/&quot;/g, '"'));
  } catch {
    return {};
  }
}

function divFor(tag: MdxBlockTag, props: MdxBlockProps): string {
  return `<div data-elsai-block="${tag}" data-props="${encodeProps(props)}"></div>`;
}

/** HTML de l'éditeur → MDX persisté en DB. */
export function htmlToMdx(html: string): string {
  return html.replace(
    /<div\s+data-elsai-block="([^"]+)"\s+data-props="([^"]*)"\s*(?:\/>|><\/div>)/g,
    (_match, tag: string, propsAttr: string) => {
      const props = decodeProps(propsAttr);
      switch (tag) {
        case "Callout": {
          const variant = (props.variant as string) || "info";
          const text = (props.text as string) || "";
          return `<Callout variant="${variant}">${text}</Callout>`;
        }
        case "FAQ":
          return `<FAQ items={${JSON.stringify(props.items ?? [])}} />`;
        case "HowTo":
          return `<HowTo steps={${JSON.stringify(props.steps ?? [])}} />`;
        case "LeadMagnet":
          return `<LeadMagnet slug="${(props.slug as string) || ""}" />`;
        default:
          return "";
      }
    },
  );
}

/** MDX lu depuis la DB → HTML à hydrater dans l'éditeur. */
export function mdxToHtml(mdx: string): string {
  let out = mdx;

  out = out.replace(
    /<Callout\s+variant="([^"]*)"\s*>([\s\S]*?)<\/Callout>/g,
    (_m, variant: string, text: string) =>
      divFor("Callout", { variant, text }),
  );

  out = out.replace(
    /<FAQ\s+items=\{(\[[\s\S]*?\])\}\s*\/>/g,
    (match, items: string) => {
      try {
        return divFor("FAQ", { items: JSON.parse(items) });
      } catch {
        return match;
      }
    },
  );

  out = out.replace(
    /<HowTo\s+steps=\{(\[[\s\S]*?\])\}\s*\/>/g,
    (match, steps: string) => {
      try {
        return divFor("HowTo", { steps: JSON.parse(steps) });
      } catch {
        return match;
      }
    },
  );

  out = out.replace(
    /<LeadMagnet\s+slug="([^"]*)"\s*\/>/g,
    (_m, slug: string) => divFor("LeadMagnet", { slug }),
  );

  return out;
}
