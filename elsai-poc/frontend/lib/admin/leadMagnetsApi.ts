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

export interface LeadMagnetRow {
  id: string;
  key: string;
  title: string;
  description: string | null;
  audience: string;
  file_url: string | null;
  trigger_sequence_key: string | null;
  active: boolean;
}

export interface LeadMagnetPayload {
  key?: string;
  title?: string;
  description?: string | null;
  audience?: string;
  file_url?: string | null;
  trigger_sequence_key?: string | null;
  active?: boolean;
}

export function listLeadMagnets(): Promise<LeadMagnetRow[]> {
  return adminJson<LeadMagnetRow[]>("/api/admin/leadmagnets");
}

export function getLeadMagnet(id: string): Promise<LeadMagnetRow> {
  return adminJson<LeadMagnetRow>(`/api/admin/leadmagnets/${id}`);
}

export function createLeadMagnet(payload: LeadMagnetPayload): Promise<LeadMagnetRow> {
  return adminJson<LeadMagnetRow>("/api/admin/leadmagnets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateLeadMagnet(id: string, payload: LeadMagnetPayload): Promise<LeadMagnetRow> {
  return adminJson<LeadMagnetRow>(`/api/admin/leadmagnets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteLeadMagnet(id: string): Promise<{ ok: boolean }> {
  return adminJson(`/api/admin/leadmagnets/${id}`, { method: "DELETE" });
}

export function activateLeadMagnet(id: string): Promise<LeadMagnetRow> {
  return adminJson<LeadMagnetRow>(`/api/admin/leadmagnets/${id}/activate`, { method: "POST" });
}
