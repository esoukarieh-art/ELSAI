/**
 * Fetch public page content from the backend CMS.
 *
 * Le backend expose /api/public/pages/{key} et renvoie les blocs publiés.
 * En mode prévisualisation (query ?preview=1&token=...), on relaie le token.
 *
 * En cas d'échec (API down, 404, JSON invalide), on retourne null ; la page
 * appelante doit utiliser son fallback hard-codé.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface PageBlock {
  type: string;
  [key: string]: unknown;
}

export interface PageContent {
  key: string;
  title: string;
  audience: string;
  blocks: PageBlock[];
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  schema_type: string | null;
}

export interface PageContentOptions {
  preview?: boolean;
  token?: string;
  /** Pass through to next.js fetch revalidate (seconds). Default 60. */
  revalidate?: number;
}

export async function getPageContent(
  key: string,
  options: PageContentOptions = {},
): Promise<PageContent | null> {
  const { preview, token, revalidate = 60 } = options;
  const params = new URLSearchParams();
  if (preview && token) {
    params.set("preview", "1");
    params.set("token", token);
  }
  const qs = params.toString();
  const url = `${API_URL}/api/public/pages/${encodeURIComponent(key)}${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, {
      // Preview = toujours live ; sinon ISR.
      next: preview ? { revalidate: 0 } : { revalidate },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PageContent;
    if (!data || !Array.isArray(data.blocks)) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Résout une URL d'image (support paths relatifs backend type /api/public/uploads/...).
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/")) return `${API_URL}${url}`;
  return url;
}

/** Récupère un bloc par son `type` (les clés hero/differentiators/etc.). */
export function findBlock<T extends PageBlock = PageBlock>(
  blocks: PageBlock[] | undefined,
  type: string,
): T | null {
  if (!blocks) return null;
  return (blocks.find((b) => b.type === type) as T | undefined) ?? null;
}

export function blockString(
  block: PageBlock | null,
  key: string,
  fallback = "",
): string {
  if (!block) return fallback;
  const v = block[key];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

export function blockList<T = Record<string, unknown>>(
  block: PageBlock | null,
  key: string,
  fallback: T[] = [],
): T[] {
  if (!block) return fallback;
  const v = block[key];
  return Array.isArray(v) ? (v as T[]) : fallback;
}
