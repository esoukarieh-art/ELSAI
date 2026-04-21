import {
  clearAdminToken,
  getAdminAuth,
  getAdminToken,
} from "@/lib/api";

import type {
  BlogPostCreate,
  BlogPostDetail,
  BlogPostSummary,
  BlogPostUpdate,
  BriefResult,
  EditorialCheckResult,
  ReadabilityResult,
  RevisionRow,
  SchemaSuggestion,
  SeoMetaResult,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const auth = getAdminAuth();
  const headers = new Headers(init.headers);
  if (token) {
    if (auth === "bearer") headers.set("Authorization", `Bearer ${token}`);
    else headers.set("X-Admin-Token", token);
  }
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

async function adminJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await adminFetch(path, init);
  if (res.status === 401) {
    clearAdminToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("elsai:admin-unauthorized"));
    }
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) throw new Error(`Erreur ${res.status} : ${await res.text()}`);
  return res.json() as Promise<T>;
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return adminJson<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

// --- Blog CRUD --------------------------------------------------------------

export interface ListPostsFilters {
  audience?: string;
  status?: string;
  q?: string;
  author_id?: string;
  limit?: number;
  offset?: number;
}

export function listPosts(filters: ListPostsFilters = {}): Promise<BlogPostSummary[]> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== "" && v !== null) qs.set(k, String(v));
  }
  const suffix = qs.toString() ? `?${qs}` : "";
  return adminJson<BlogPostSummary[]>(`/api/admin/blog${suffix}`);
}

export function getPost(id: string): Promise<BlogPostDetail> {
  return adminJson<BlogPostDetail>(`/api/admin/blog/${id}`);
}

export function createPost(payload: BlogPostCreate): Promise<BlogPostDetail> {
  return postJson<BlogPostDetail>("/api/admin/blog", payload);
}

export function updatePost(id: string, payload: BlogPostUpdate): Promise<BlogPostDetail> {
  return adminJson<BlogPostDetail>(`/api/admin/blog/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function publishPost(id: string): Promise<BlogPostDetail> {
  return postJson<BlogPostDetail>(`/api/admin/blog/${id}/publish`, {});
}

export function schedulePost(id: string, scheduledFor: string): Promise<BlogPostDetail> {
  return postJson<BlogPostDetail>(`/api/admin/blog/${id}/schedule`, {
    scheduled_for: scheduledFor,
  });
}

export function checkSlug(
  slug: string,
  excludeId?: string,
): Promise<{ available: boolean; normalized: string }> {
  return postJson("/api/admin/blog/slugs/check", { slug, exclude_id: excludeId });
}

export function listRevisions(id: string): Promise<RevisionRow[]> {
  return adminJson<RevisionRow[]>(`/api/admin/blog/${id}/revisions`);
}

export function revertPost(id: string, revisionId: number): Promise<BlogPostDetail> {
  return postJson<BlogPostDetail>(`/api/admin/blog/${id}/revert/${revisionId}`, {});
}

export function attachCTA(
  id: string,
  cta_key: string,
  position = "inline",
  sort_order = 0,
  detach = false,
): Promise<BlogPostDetail> {
  return postJson<BlogPostDetail>(`/api/admin/blog/${id}/ctas`, {
    cta_key,
    position,
    sort_order,
    detach,
  });
}

// --- AI assist --------------------------------------------------------------

export function aiRewrite(text: string, instruction: string): Promise<{ text: string }> {
  return postJson("/api/admin/ai/rewrite", { text, instruction });
}

export function aiShorten(text: string, target_chars?: number): Promise<{ text: string }> {
  return postJson("/api/admin/ai/shorten", { text, target_chars });
}

export function aiExpand(text: string, target_chars?: number): Promise<{ text: string }> {
  return postJson("/api/admin/ai/expand", { text, target_chars });
}

export function aiReadability(text: string): Promise<ReadabilityResult> {
  return postJson("/api/admin/ai/readability", { text });
}

export function aiEditorialCheck(
  text: string,
  audience: string = "adult",
): Promise<EditorialCheckResult> {
  return postJson("/api/admin/ai/editorial-check", { text, audience });
}

export function aiBrief(keyword: string, audience: string = "adult"): Promise<BriefResult> {
  return postJson("/api/admin/ai/brief", { keyword, audience });
}

export function aiSuggestSchema(
  content_mdx: string,
  title: string,
): Promise<SchemaSuggestion> {
  return postJson("/api/admin/ai/suggest-schema", { content_mdx, title });
}

export function aiSeoMeta(title: string, content_mdx: string): Promise<SeoMetaResult> {
  return postJson("/api/admin/ai/seo-meta", { title, content_mdx });
}
