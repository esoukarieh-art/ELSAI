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
  if (res.status === 401) {
    clearAdminToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("elsai:admin-unauthorized"));
    }
    throw new Error("UNAUTHORIZED");
  }
  if (res.status === 503) throw new Error("ADMIN_DISABLED");
  if (!res.ok) throw new Error(`Erreur ${res.status} : ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function fetchMetrics(): Promise<DashboardMetrics> {
  return adminJson<DashboardMetrics>("/api/dashboard/metrics");
}

// =================== Bibliothèque de courriers types ===================

export interface LetterTemplate {
  id: string;
  title: string;
  category: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface LetterTemplateInput {
  title: string;
  category: string;
  body: string;
}

export async function listLetterTemplates(): Promise<LetterTemplate[]> {
  return adminJson<LetterTemplate[]>("/api/admin/letter-templates");
}

export async function createLetterTemplate(
  payload: LetterTemplateInput,
): Promise<LetterTemplate> {
  return adminJson<LetterTemplate>("/api/admin/letter-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateLetterTemplate(
  id: string,
  payload: LetterTemplateInput,
): Promise<LetterTemplate> {
  return adminJson<LetterTemplate>(`/api/admin/letter-templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteLetterTemplate(id: string): Promise<void> {
  const res = await adminFetch(`/api/admin/letter-templates/${id}`, { method: "DELETE" });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

export async function generateLetterTemplate(
  prompt: string,
  category: string,
): Promise<{ title: string; category: string; body: string }> {
  return adminJson("/api/admin/letter-templates/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, category }),
  });
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

// =================== Séquences email ===================

export interface EmailSequenceSummary {
  sequence_key: string;
  sequence_label: string;
  audience: "b2b" | "b2c";
  steps_total: number;
  steps_active: number;
  last_sent_at: string | null;
  pending_count: number;
}

export interface EmailTemplateSummary {
  key: string;
  sequence_key: string;
  sequence_label: string;
  audience: "b2b" | "b2c";
  step_order: number;
  step_label: string;
  delay_hours: number;
  subject: string;
  preview: string | null;
  active: boolean;
  notes: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface EmailTemplateDetail extends EmailTemplateSummary {
  html_content: string;
  text_content: string | null;
}

export interface EmailTemplateUpdate {
  subject?: string;
  preview?: string | null;
  html_content?: string;
  text_content?: string | null;
  delay_hours?: number;
  step_label?: string;
  active?: boolean;
  notes?: string | null;
}

export interface EmailHistoryRow {
  id: string;
  template_key: string | null;
  sequence_key: string;
  step_order: number;
  recipient_email: string;
  subject_id: string;
  send_at: string;
  sent_at: string | null;
  status: "pending" | "sent" | "cancelled" | "failed";
  error: string | null;
  brevo_message_id: string | null;
}

export interface EmailTestSendResponse {
  sent: boolean;
  message_id: string | null;
  rendered_subject: string;
  rendered_html_preview: string;
}

export async function listEmailSequences(): Promise<EmailSequenceSummary[]> {
  return adminJson<EmailSequenceSummary[]>("/api/admin/email-sequences");
}

export async function listEmailTemplatesInSequence(
  sequenceKey: string,
): Promise<EmailTemplateSummary[]> {
  return adminJson<EmailTemplateSummary[]>(
    `/api/admin/email-sequences/${encodeURIComponent(sequenceKey)}`,
  );
}

export async function getEmailTemplate(key: string): Promise<EmailTemplateDetail> {
  return adminJson<EmailTemplateDetail>(
    `/api/admin/email-sequences/templates/${encodeURIComponent(key)}`,
  );
}

export async function updateEmailTemplate(
  key: string,
  payload: EmailTemplateUpdate,
): Promise<EmailTemplateDetail> {
  return adminJson<EmailTemplateDetail>(
    `/api/admin/email-sequences/templates/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export async function testSendEmailTemplate(
  key: string,
  to: string,
): Promise<EmailTestSendResponse> {
  return adminJson<EmailTestSendResponse>(
    `/api/admin/email-sequences/templates/${encodeURIComponent(key)}/test-send?to=${encodeURIComponent(to)}`,
    { method: "POST" },
  );
}

export async function listEmailHistory(
  sequenceKey?: string,
  status?: string,
  limit = 100,
): Promise<EmailHistoryRow[]> {
  const params = new URLSearchParams();
  if (sequenceKey) params.set("sequence_key", sequenceKey);
  if (status) params.set("status", status);
  params.set("limit", String(limit));
  return adminJson<EmailHistoryRow[]>(
    `/api/admin/email-sequences/history?${params.toString()}`,
  );
}

export async function setEmailSequenceActive(
  sequenceKey: string,
  active: boolean,
): Promise<EmailSequenceSummary> {
  return adminJson<EmailSequenceSummary>(
    `/api/admin/email-sequences/${encodeURIComponent(sequenceKey)}/${active ? "resume" : "pause"}`,
    { method: "POST" },
  );
}
