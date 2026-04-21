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

export type Period = "7d" | "30d" | "90d";

export interface PostAnalyticsRow {
  post_id: string;
  slug: string;
  title: string;
  audience: string;
  status: string;
  views: number;
  cta_impressions: number;
  cta_clicks: number;
  cta_ctr: number;
  scroll_75: number;
  newsletter_subscribes: number;
}

export interface PostsResponse {
  period: string;
  plausible_configured: boolean;
  posts: PostAnalyticsRow[];
}

export interface CTAVariantRow {
  block_key: string;
  variant: string;
  audience: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface CTAsResponse {
  period: string;
  plausible_configured: boolean;
  rows: CTAVariantRow[];
}

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
}

export interface FunnelResponse {
  period: string;
  plausible_configured: boolean;
  steps: FunnelStep[];
}

export interface PostDetailResponse {
  period: string;
  plausible_configured: boolean;
  post: PostAnalyticsRow | null;
  ctas: CTAVariantRow[];
}

function qs(params: Record<string, string | number | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") s.set(k, String(v));
  }
  const out = s.toString();
  return out ? `?${out}` : "";
}

export function getPostsAnalytics(period: Period = "30d", audience?: string): Promise<PostsResponse> {
  return adminJson<PostsResponse>(`/api/admin/analytics/posts${qs({ period, audience })}`);
}

export function getPostAnalytics(slug: string, period: Period = "30d"): Promise<PostDetailResponse> {
  return adminJson<PostDetailResponse>(
    `/api/admin/analytics/posts/${encodeURIComponent(slug)}${qs({ period })}`,
  );
}

export function getCTAsAnalytics(period: Period = "30d"): Promise<CTAsResponse> {
  return adminJson<CTAsResponse>(`/api/admin/analytics/ctas${qs({ period })}`);
}

export function getFunnelPwaStart(period: Period = "30d"): Promise<FunnelResponse> {
  return adminJson<FunnelResponse>(`/api/admin/analytics/funnel/pwa-start${qs({ period })}`);
}
