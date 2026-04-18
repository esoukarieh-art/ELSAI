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
const ADMIN_AUTH_KEY = "elsai_admin_auth"; // "bearer" | "legacy"
const ADMIN_ROLE_KEY = "elsai_admin_role";

export type AdminRole =
  | "super_admin"
  | "moderator_119"
  | "content_editor"
  | "b2b_sales";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getAdminAuth(): "bearer" | "legacy" {
  if (typeof window === "undefined") return "legacy";
  return (sessionStorage.getItem(ADMIN_AUTH_KEY) as "bearer" | "legacy") || "legacy";
}

export function getAdminRole(): AdminRole | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_ROLE_KEY) as AdminRole | null;
}

export function setAdminToken(token: string, auth: "bearer" | "legacy" = "legacy", role?: AdminRole) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  sessionStorage.setItem(ADMIN_AUTH_KEY, auth);
  if (role) sessionStorage.setItem(ADMIN_ROLE_KEY, role);
}

export function clearAdminToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_AUTH_KEY);
  sessionStorage.removeItem(ADMIN_ROLE_KEY);
}

// =================== Billing ===================

export type BillingPlan = "essentiel" | "premium";
export type BillingCycle = "monthly" | "yearly";

export interface CheckoutPayload {
  plan: BillingPlan;
  billing_cycle: BillingCycle;
  seats: number;
  company_name: string;
  admin_email: string;
  siret?: string;
}

export async function createCheckout(
  payload: CheckoutPayload,
): Promise<{ checkout_url: string; organization_id: string }> {
  const res = await fetch(`${API_URL}/api/billing/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status} : ${await res.text()}`);
  return res.json();
}

export interface OrganizationView {
  id: string;
  company_name: string;
  plan: string;
  billing_cycle: string;
  seats: number;
  status: string;
  admin_email: string;
  codes: Array<{
    id: string;
    code: string;
    assigned_at: string | null;
    revoked_at: string | null;
  }>;
}

export async function fetchOrganization(token: string): Promise<OrganizationView> {
  const res = await fetch(
    `${API_URL}/api/billing/organization?token=${encodeURIComponent(token)}`,
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function revokeCode(token: string, codeId: string): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/billing/organization/codes/${codeId}/revoke?token=${encodeURIComponent(token)}`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

export async function regenerateCode(
  token: string,
  codeId: string,
): Promise<{ new_code_id: string; new_code: string }> {
  const res = await fetch(
    `${API_URL}/api/billing/organization/codes/regenerate?code_id=${encodeURIComponent(
      codeId,
    )}&token=${encodeURIComponent(token)}`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function resendActivationEmail(token: string): Promise<{ sent: boolean }> {
  const res = await fetch(
    `${API_URL}/api/billing/organization/resend-email?token=${encodeURIComponent(token)}`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function openBillingPortal(organizationId: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/billing/portal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organization_id: organizationId }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const data = await res.json();
  return data.portal_url as string;
}

// =================== Dashboard (admin global) ===================

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
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (res.status === 503) throw new Error("ADMIN_DISABLED");
  if (!res.ok) throw new Error(`Erreur ${res.status} : ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function fetchMetrics(): Promise<DashboardMetrics> {
  return adminJson<DashboardMetrics>("/api/dashboard/metrics");
}

// =================== Admin backoffice ===================

export type AlertStatus = "new" | "reviewing" | "escalated_119" | "closed";

export interface DangerAlert {
  id: string;
  session_id: string;
  conversation_id: string;
  profile: string;
  source: "heuristic" | "llm" | "both";
  excerpt: string;
  status: AlertStatus;
  reviewer_note: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchAlerts(status?: AlertStatus): Promise<DangerAlert[]> {
  const qs = status ? `?status=${status}` : "";
  return adminJson<DangerAlert[]>(`/api/admin/alerts${qs}`);
}

export async function updateAlert(
  id: string,
  status: AlertStatus,
  reviewer_note?: string,
): Promise<DangerAlert> {
  return adminJson<DangerAlert>(`/api/admin/alerts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, reviewer_note }),
  });
}

export interface PromptView {
  name: string;
  content: string;
  is_default: boolean;
  version_id: number | null;
  updated_at: string | null;
}

export async function fetchPrompts(): Promise<PromptView[]> {
  return adminJson<PromptView[]>("/api/admin/prompts");
}

export async function savePrompt(name: string, content: string): Promise<PromptView> {
  return adminJson<PromptView>(`/api/admin/prompts/${name}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export async function resetPrompt(name: string): Promise<PromptView> {
  return adminJson<PromptView>(`/api/admin/prompts/${name}/reset`, { method: "POST" });
}

export interface AuditEntry {
  id: number;
  actor: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: string | null;
  created_at: string;
}

export async function fetchAudit(action?: string): Promise<AuditEntry[]> {
  const qs = action ? `?action=${encodeURIComponent(action)}` : "";
  return adminJson<AuditEntry[]>(`/api/admin/audit${qs}`);
}

export interface ForgetEvent {
  id: number;
  profile: string;
  created_at: string;
}

export async function fetchForgetRequests(): Promise<ForgetEvent[]> {
  return adminJson<ForgetEvent[]>("/api/admin/forget-requests");
}

// ---------- Admin auth (login) ----------

export interface AdminLoginResponse {
  token: string;
  role: AdminRole;
  email: string;
  expires_in: number;
}

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  const res = await fetch(`${API_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Identifiants invalides (${res.status})`);
  const data = (await res.json()) as AdminLoginResponse;
  setAdminToken(data.token, "bearer", data.role);
  return data;
}

export interface AdminIdentity {
  id: string;
  email: string;
  role: AdminRole;
  active: boolean;
  created_at: string;
  last_login: string | null;
}

export async function fetchMe(): Promise<AdminIdentity> {
  return adminJson<AdminIdentity>("/api/admin/auth/me");
}

// ---------- Admin users CRUD ----------

export async function fetchAdminUsers(): Promise<AdminIdentity[]> {
  return adminJson<AdminIdentity[]>("/api/admin/users");
}

export async function createAdminUser(
  email: string,
  password: string,
  role: AdminRole,
): Promise<AdminIdentity> {
  return adminJson<AdminIdentity>("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
}

export async function updateAdminUser(
  id: string,
  payload: { role?: AdminRole; active?: boolean; password?: string },
): Promise<AdminIdentity> {
  return adminJson<AdminIdentity>(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminUser(id: string): Promise<void> {
  const res = await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Erreur ${res.status}`);
}

// ---------- A/B prompts ----------

export interface PromptVariant {
  id: number;
  name: string;
  label: string;
  content: string;
  weight: number;
  active: boolean;
  created_at: string;
}

export async function fetchVariants(name: string): Promise<PromptVariant[]> {
  return adminJson<PromptVariant[]>(`/api/admin/prompts/${name}/variants`);
}

export async function createVariant(
  name: string,
  label: string,
  content: string,
  weight: number,
): Promise<PromptVariant> {
  return adminJson<PromptVariant>(`/api/admin/prompts/${name}/variants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, content, weight }),
  });
}

export async function updateWeights(
  name: string,
  weights: Record<number, number>,
): Promise<PromptVariant[]> {
  return adminJson<PromptVariant[]>(`/api/admin/prompts/${name}/weights`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weights }),
  });
}

export interface VariantStats {
  version_id: number;
  label: string;
  weight: number;
  active: boolean;
  messages_served: number;
  danger_flags: number;
}

export async function fetchVariantStats(name: string): Promise<VariantStats[]> {
  return adminJson<VariantStats[]>(`/api/admin/prompts/${name}/stats`);
}

// ---------- Exports ----------

export function exportUrl(kind: "metrics" | "alerts"): string {
  return `${API_URL}/api/admin/exports/${kind}.csv`;
}

export async function downloadExport(kind: "metrics" | "alerts"): Promise<void> {
  const res = await adminFetch(`/api/admin/exports/${kind}.csv`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `elsai_${kind}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Feature flags ----------

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string | null;
  category: "module" | "parcours" | "theme";
  updated_at: string;
}

export async function fetchFeatures(): Promise<FeatureFlag[]> {
  return adminJson<FeatureFlag[]>("/api/admin/features");
}

export async function upsertFeature(
  flag: Omit<FeatureFlag, "updated_at">,
): Promise<FeatureFlag> {
  return adminJson<FeatureFlag>("/api/admin/features", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(flag),
  });
}

export async function toggleFeature(name: string, enabled: boolean): Promise<FeatureFlag> {
  return adminJson<FeatureFlag>(`/api/admin/features/${name}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
}

export async function deleteFeature(name: string): Promise<void> {
  const res = await adminFetch(`/api/admin/features/${name}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Erreur ${res.status}`);
}
