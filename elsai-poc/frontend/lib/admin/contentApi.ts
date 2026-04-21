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
  kind?: string;
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

export async function deletePost(id: string): Promise<void> {
  const res = await adminFetch(`/api/admin/blog/${id}`, { method: "DELETE" });
  if (res.status === 401) {
    clearAdminToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("elsai:admin-unauthorized"));
    }
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) throw new Error(`Erreur ${res.status} : ${await res.text()}`);
}

export function publishPost(id: string): Promise<BlogPostDetail> {
  return postJson<BlogPostDetail>(`/api/admin/blog/${id}/publish`, {});
}

export function changePostStatus(
  id: string,
  status: "draft" | "private" | "archived",
): Promise<BlogPostDetail> {
  return postJson<BlogPostDetail>(`/api/admin/blog/${id}/status`, { status });
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

export interface ArticleTemplate {
  key: string;
  label: string;
  description: string;
}

export function listArticleTemplates(): Promise<ArticleTemplate[]> {
  return adminJson<ArticleTemplate[]>("/api/admin/ai/article-templates");
}

export interface GenerateDraftInput {
  template_key: string;
  title: string;
  keyword?: string;
  audience?: string;
  kind?: string;
}

export interface GeneratedDraft {
  content_mdx: string;
  seo_title: string;
  seo_description: string;
  excerpt: string;
}

export function aiGenerateDraft(input: GenerateDraftInput): Promise<GeneratedDraft> {
  return postJson<GeneratedDraft>("/api/admin/ai/generate-draft", input);
}

export interface StreamHandlers {
  onStart?: () => void;
  onChunk?: (text: string, accumulated: string) => void;
  onDone?: (draft: GeneratedDraft) => void;
  signal?: AbortSignal;
}

export async function aiGenerateDraftStream(
  input: GenerateDraftInput,
  handlers: StreamHandlers = {},
): Promise<GeneratedDraft> {
  const token = getAdminToken();
  const auth = getAdminAuth();
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) {
    if (auth === "bearer") headers.set("Authorization", `Bearer ${token}`);
    else headers.set("X-Admin-Token", token);
  }
  const res = await fetch(`${API_URL}/api/admin/ai/generate-draft/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
    signal: handlers.signal,
  });
  if (res.status === 401) {
    clearAdminToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("elsai:admin-unauthorized"));
    }
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Erreur ${res.status} : ${txt}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let accumulated = "";
  let finalDraft: GeneratedDraft | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sepIdx: number;
    while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIdx);
      buffer = buffer.slice(sepIdx + 2);
      const dataLines = rawEvent
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(l.startsWith("data: ") ? 6 : 5));
      if (!dataLines.length) continue;
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(dataLines.join("\n"));
      } catch {
        continue;
      }
      const type = payload.type as string;
      if (type === "start") {
        handlers.onStart?.();
      } else if (type === "chunk") {
        const text = (payload.text as string) ?? "";
        accumulated += text;
        handlers.onChunk?.(text, accumulated);
      } else if (type === "done") {
        finalDraft = payload.draft as GeneratedDraft;
        handlers.onDone?.(finalDraft);
      } else if (type === "error") {
        throw new Error((payload.message as string) || "Erreur IA");
      }
    }
  }
  if (!finalDraft) throw new Error("Flux IA terminé sans brouillon final");
  return finalDraft;
}
