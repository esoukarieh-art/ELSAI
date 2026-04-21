const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const TRACK_TO_AUDIENCE = {
  particuliers: "adult",
  jeunes: "minor",
  entreprises: "b2b",
} as const;

export const AUDIENCE_TO_TRACK: Record<string, Track> = {
  adult: "particuliers",
  minor: "jeunes",
  b2b: "entreprises",
};

export type Track = keyof typeof TRACK_TO_AUDIENCE;

export const TRACKS: Track[] = ["particuliers", "jeunes", "entreprises"];

export function audienceToTrack(audience: string): Track {
  return AUDIENCE_TO_TRACK[audience] ?? "particuliers";
}

export const TRACK_META: Record<Track, { label: string; eyebrow: string; description: string }> = {
  particuliers: {
    label: "Particuliers",
    eyebrow: "Pour les particuliers",
    description:
      "Décryptages d'aides, de démarches et de droits sociaux pour les adultes en France.",
  },
  jeunes: {
    label: "Jeunes 12–18 ans",
    eyebrow: "Pour toi",
    description:
      "Tes droits, tes démarches, les aides qui existent pour toi — expliqués simplement.",
  },
  entreprises: {
    label: "Entreprises",
    eyebrow: "Pour les employeurs",
    description:
      "Analyses et ressources RH pour lutter contre le non-recours et accompagner vos salariés.",
  },
};

export interface PublicPostSummary {
  slug: string;
  title: string;
  description: string;
  hero_eyebrow: string | null;
  audience: string;
  tags: string[];
  reading_minutes: number;
  published_at: string | null;
  updated_at: string | null;
  cluster_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  author_display: string | null;
}

export interface PublicCTA {
  cta_key: string;
  position: "top" | "inline" | "end" | "sticky";
  sort_order: number;
}

export interface PublicPostDetail extends PublicPostSummary {
  content_mdx: string;
  schema_type: string;
  schema_extra_json: string;
  ctas: PublicCTA[];
}

export interface PublicCluster {
  slug: string;
  name: string;
  description: string | null;
  audience: string;
  pillar_post_id: string | null;
  posts: PublicPostSummary[];
}

function revalidateOpts(tags: string[] = []) {
  return { next: { revalidate: 60, tags } };
}

export async function fetchPosts(params: {
  track?: Track;
  audience?: string;
  limit?: number;
  offset?: number;
  tag?: string;
  clusterSlug?: string;
} = {}): Promise<PublicPostSummary[]> {
  const search = new URLSearchParams();
  const audience = params.audience ?? (params.track ? TRACK_TO_AUDIENCE[params.track] : undefined);
  if (audience) search.set("audience", audience);
  if (params.tag) search.set("tag", params.tag);
  if (params.clusterSlug) search.set("cluster_slug", params.clusterSlug);
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.offset != null) search.set("offset", String(params.offset));
  const qs = search.toString();
  const url = `${API}/api/public/posts${qs ? `?${qs}` : ""}`;
  try {
    const res = await fetch(url, revalidateOpts(["posts"]));
    if (!res.ok) return [];
    return (await res.json()) as PublicPostSummary[];
  } catch {
    return [];
  }
}

export async function fetchPost(slug: string): Promise<PublicPostDetail | null> {
  try {
    const res = await fetch(`${API}/api/public/posts/${slug}`, revalidateOpts([`post:${slug}`]));
    if (!res.ok) return null;
    return (await res.json()) as PublicPostDetail;
  } catch {
    return null;
  }
}

export async function fetchCluster(slug: string): Promise<PublicCluster | null> {
  try {
    const res = await fetch(`${API}/api/public/clusters/${slug}`, revalidateOpts([`cluster:${slug}`]));
    if (!res.ok) return null;
    return (await res.json()) as PublicCluster;
  } catch {
    return null;
  }
}

export async function fetchHelpPages(
  params: { limit?: number; offset?: number } = {},
): Promise<PublicPostSummary[]> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.offset != null) search.set("offset", String(params.offset));
  const qs = search.toString();
  const url = `${API}/api/public/help${qs ? `?${qs}` : ""}`;
  try {
    const res = await fetch(url, revalidateOpts(["help"]));
    if (!res.ok) return [];
    return (await res.json()) as PublicPostSummary[];
  } catch {
    return [];
  }
}

export async function fetchHelpPage(slug: string): Promise<PublicPostDetail | null> {
  try {
    const res = await fetch(
      `${API}/api/public/help/${slug}`,
      revalidateOpts([`help:${slug}`]),
    );
    if (!res.ok) return null;
    return (await res.json()) as PublicPostDetail;
  } catch {
    return null;
  }
}

export async function fetchPage(key: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${API}/api/public/pages/${key}`, revalidateOpts([`page:${key}`]));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
