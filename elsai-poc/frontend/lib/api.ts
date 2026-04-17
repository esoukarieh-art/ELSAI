const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TOKEN_KEY = "elsai_token";
const SESSION_KEY = "elsai_session";
const PROFILE_KEY = "elsai_profile";

export type Profile = "adult" | "minor";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getProfile(): Profile {
  if (typeof window === "undefined") return "adult";
  return (sessionStorage.getItem(PROFILE_KEY) as Profile) || "adult";
}

export function setSession(token: string, sessionId: string, profile: Profile) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(SESSION_KEY, sessionId);
  sessionStorage.setItem(PROFILE_KEY, profile);
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(PROFILE_KEY);
  sessionStorage.removeItem("elsai_conversation_id");
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  return res;
}

export async function ensureSession(profile: Profile = "adult"): Promise<string> {
  let token = getToken();
  if (token) return token;

  const res = await fetch(`${API_URL}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  if (!res.ok) throw new Error(`Impossible de créer une session (${res.status})`);
  const data = await res.json();
  setSession(data.token, data.session_id, data.profile);
  return data.token;
}

export interface ChatResponse {
  conversation_id: string;
  reply: string;
  danger_detected: boolean;
  emergency_cta: { label: string; phone: string } | null;
}

export async function sendMessage(message: string, conversationId?: string): Promise<ChatResponse> {
  await ensureSession(getProfile());
  const res = await apiFetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status} : ${await res.text()}`);
  return res.json();
}

export interface DocumentAnalyzeResponse {
  ocr_text: string;
  explanation: string;
  suggested_actions: string[];
}

export async function analyzeDocument(file: File): Promise<DocumentAnalyzeResponse> {
  await ensureSession(getProfile());
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch("/api/documents/analyze", { method: "POST", body: form });
  if (!res.ok) throw new Error(`Erreur ${res.status} : ${await res.text()}`);
  return res.json();
}

export async function forgetMe(): Promise<{
  deleted_conversations: number;
  deleted_messages: number;
}> {
  const res = await apiFetch("/api/auth/forget", { method: "DELETE" });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const data = await res.json();
  clearSession();
  return data;
}

export interface DashboardMetrics {
  total_sessions: number;
  active_last_hour: number;
  chats_total: number;
  ocr_total: number;
  danger_detections_total: number;
  forget_requests_total: number;
  profile_breakdown: Record<string, number>;
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  await ensureSession(getProfile());
  const form = new FormData();
  const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
  form.append("file", blob, `audio.${ext}`);
  const res = await apiFetch("/api/voice/stt", { method: "POST", body: form });
  if (!res.ok) throw new Error(`Transcription échouée (${res.status})`);
  const data = await res.json();
  return data.text as string;
}

export async function synthesizeSpeech(text: string): Promise<Blob> {
  await ensureSession(getProfile());
  const res = await apiFetch("/api/voice/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Synthèse échouée (${res.status})`);
  return res.blob();
}

const ADMIN_TOKEN_KEY = "elsai_admin_token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function fetchMetrics(): Promise<DashboardMetrics> {
  const token = getAdminToken();
  const headers: Record<string, string> = {};
  if (token) headers["X-Admin-Token"] = token;
  const res = await fetch(`${API_URL}/api/dashboard/metrics`, { headers });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (res.status === 503) throw new Error("ADMIN_DISABLED");
  if (!res.ok) throw new Error("Métriques indisponibles");
  return res.json();
}
