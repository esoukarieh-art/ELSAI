export type Audience = "adult" | "minor" | "b2b" | "all";
export type PostStatus = "draft" | "review" | "scheduled" | "published" | "archived";

export interface PostCTAItem {
  cta_key: string;
  position: string;
  sort_order: number;
}

export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  audience: Audience;
  status: PostStatus;
  author_id?: string | null;
  author_display?: string | null;
  cluster_id?: string | null;
  tags: string[];
  reading_minutes: number;
  readability_level?: string | null;
  published_at?: string | null;
  scheduled_for?: string | null;
  updated_at: string;
  seo_title?: string | null;
  seo_description?: string | null;
}

export interface BlogPostDetail extends BlogPostSummary {
  hero_eyebrow?: string | null;
  content_mdx: string;
  target_keyword?: string | null;
  search_intent?: string | null;
  readability_score?: number | null;
  og_image_url?: string | null;
  schema_type: string;
  schema_extra_json: string;
  ctas: PostCTAItem[];
}

export interface BlogPostCreate {
  title: string;
  slug?: string;
  description?: string;
  hero_eyebrow?: string | null;
  content_mdx?: string;
  audience?: Audience;
  tags?: string[];
  reading_minutes?: number;
  target_keyword?: string | null;
  search_intent?: string | null;
  cluster_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  og_image_url?: string | null;
  schema_type?: string;
}

export type BlogPostUpdate = Partial<Omit<BlogPostCreate, "tags">> & {
  tags?: string[];
  readability_level?: string | null;
  readability_score?: number | null;
  schema_extra_json?: string;
  author_display?: string | null;
};

export interface RevisionRow {
  id: number;
  entity_type: string;
  entity_id: string;
  author_email: string | null;
  created_at: string;
}

export interface ReadabilityResult {
  level: string;
  score: number;
  words: number;
  notes?: string;
  [k: string]: unknown;
}

export interface EditorialCheckResult {
  flags: Array<{ kind: string; severity: string; message: string }>;
  ok: boolean;
  [k: string]: unknown;
}

export interface BriefResult {
  outline: string[];
  angle: string;
  audience_hints: string[];
  [k: string]: unknown;
}

export interface SchemaSuggestion {
  schema_type: string;
  reason: string;
  [k: string]: unknown;
}

export interface SeoMetaResult {
  seo_title: string;
  seo_description: string;
}
