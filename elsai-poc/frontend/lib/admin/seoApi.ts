import { clearAdminToken, getAdminAuth, getAdminToken } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function adminJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const auth = getAdminAuth();
  const headers = new Headers(init.headers);
  if (token) {
    if (auth === "bearer") headers.set("Authorization", `Bearer ${token}`);
    else headers.set("X-Admin-Token", token);
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 401) {
    clearAdminToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("elsai:admin-unauthorized"));
    }
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) throw new Error(`Erreur ${res.status} : ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface LongTailRow {
  id: string;
  composite_slug: string;
  right_slug: string;
  situation_slug: string;
  department_code: string;
  title: string;
  word_count: number;
  status: "draft" | "published" | "noindex";
  last_generated_at: string;
  updated_at: string;
}

export interface LongTailDetail extends LongTailRow {
  seo_description: string;
  content_md: string;
}

export interface SeoStats {
  total: number;
  by_status: Record<string, number>;
  avg_word_count: number;
  rights_count: number;
  situations_count: number;
  departments_count: number;
}

export interface TaxonomyEntry {
  slug?: string;
  code?: string;
  name: string;
  prefecture?: string;
  region?: string;
  profile?: string;
}

export interface Taxonomy {
  rights: TaxonomyEntry[];
  situations: TaxonomyEntry[];
  departments: TaxonomyEntry[];
}

export function getStats(): Promise<SeoStats> {
  return adminJson<SeoStats>("/api/admin/seo/stats");
}

export function listLongTail(params: {
  right?: string;
  situation?: string;
  department?: string;
  page_status?: string;
  limit?: number;
  offset?: number;
}): Promise<LongTailRow[]> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  return adminJson<LongTailRow[]>(`/api/admin/seo/longtail?${qs.toString()}`);
}

export function getLongTail(id: string): Promise<LongTailDetail> {
  return adminJson<LongTailDetail>(`/api/admin/seo/longtail/${id}`);
}

export function generateBatch(
  combinations: [string, string, string][],
  publish: boolean,
): Promise<{ generated: number; skipped: number; pages: LongTailRow[] }> {
  return adminJson("/api/admin/seo/longtail/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ combinations, publish }),
  });
}

export function updateStatus(
  id: string,
  status: "draft" | "published" | "noindex",
): Promise<LongTailRow> {
  return adminJson<LongTailRow>(`/api/admin/seo/longtail/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function deleteLongTail(id: string): Promise<void> {
  return adminJson(`/api/admin/seo/longtail/${id}`, { method: "DELETE" });
}

export function getTaxonomy(): Promise<Taxonomy> {
  return fetch(`${API_URL}/api/public/aides/taxonomy`).then((r) => r.json());
}
