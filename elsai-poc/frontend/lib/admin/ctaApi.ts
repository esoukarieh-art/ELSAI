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

export interface CTARow {
  id: string;
  key: string;
  label: string;
  variant: string;
  component: string;
  audience: string;
  weight: number;
  active: boolean;
  props: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CTACreatePayload {
  key: string;
  label: string;
  variant?: string;
  component: string;
  audience?: string;
  weight?: number;
  props?: Record<string, unknown>;
}

export interface CTAUpdatePayload {
  label?: string;
  weight?: number;
  props?: Record<string, unknown>;
  active?: boolean;
  audience?: string;
  variant?: string;
  component?: string;
}

export function listCTAs(filters: { key?: string; audience?: string; active?: boolean } = {}): Promise<CTARow[]> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  const suffix = qs.toString() ? `?${qs}` : "";
  return adminJson<CTARow[]>(`/api/admin/cta${suffix}`);
}

export function getCTA(id: string): Promise<CTARow> {
  return adminJson<CTARow>(`/api/admin/cta/${id}`);
}

export function createCTA(payload: CTACreatePayload): Promise<CTARow> {
  return adminJson<CTARow>("/api/admin/cta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateCTA(id: string, payload: CTAUpdatePayload): Promise<CTARow> {
  return adminJson<CTARow>(`/api/admin/cta/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteCTA(id: string): Promise<{ ok: boolean; active: boolean }> {
  return adminJson(`/api/admin/cta/${id}`, { method: "DELETE" });
}
