import { clearAdminToken, getAdminAuth, getAdminToken } from "@/lib/api";

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

export type PageFieldType = "text" | "textarea" | "url" | "image" | "list";

export interface PageFieldDef {
  key: string;
  label: string;
  type: PageFieldType;
  required?: boolean;
  help?: string;
  item_fields?: PageFieldDef[];
}

export interface PageBlockDef {
  key: string;
  label: string;
  max?: number;
  fields: PageFieldDef[];
}

export interface PageSchema {
  label: string;
  seo?: boolean;
  blocks: PageBlockDef[];
}

export interface PageRow {
  page_key: string;
  title: string;
  status: string;
  audience: string;
  updated_at: string;
  updated_by: string | null;
  published_at: string | null;
  has_draft: boolean;
}

export interface PageDetail extends PageRow {
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  blocks: Record<string, unknown>[];
  draft_blocks: Record<string, unknown>[] | null;
  schema: PageSchema | null;
  preview_token: string;
}

export interface PagePutPayload {
  blocks: Record<string, unknown>[];
  title?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  og_image_url?: string | null;
}

export function listPages(): Promise<PageRow[]> {
  return adminJson<PageRow[]>("/api/admin/pages");
}

export function getPage(key: string): Promise<PageDetail> {
  return adminJson<PageDetail>(`/api/admin/pages/${key}`);
}

export function savePageDraft(key: string, payload: PagePutPayload): Promise<PageDetail> {
  return adminJson<PageDetail>(`/api/admin/pages/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function publishPage(key: string): Promise<PageDetail> {
  return adminJson<PageDetail>(`/api/admin/pages/${key}/publish`, { method: "POST" });
}

export function discardPageDraft(key: string): Promise<PageDetail> {
  return adminJson<PageDetail>(`/api/admin/pages/${key}/discard-draft`, { method: "POST" });
}

export async function uploadPageImage(key: string, file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await adminFetch(`/api/admin/pages/${key}/upload-image`, {
    method: "POST",
    body: form,
  });
  if (res.status === 401) {
    clearAdminToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("elsai:admin-unauthorized"));
    }
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) throw new Error(`Erreur ${res.status} : ${await res.text()}`);
  const data = (await res.json()) as { url: string };
  // Préfixer avec l'API_URL pour l'affichage dans l'UI (le path retourné est relatif au backend).
  return { url: data.url.startsWith("http") ? data.url : `${API_URL}${data.url}` };
}
