"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import FunnelBars from "@/components/admin/analytics/FunnelBars";
import StatCard from "@/components/admin/analytics/StatCard";
import {
  getCTAsAnalytics,
  getFunnelPwaStart,
  getPostsAnalytics,
  type CTAVariantRow,
  type FunnelResponse,
  type Period,
  type PostsResponse,
} from "@/lib/admin/analyticsApi";

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
];

const AUDIENCES: Array<{ value: string; label: string }> = [
  { value: "", label: "Tous" },
  { value: "adult", label: "Adulte" },
  { value: "minor", label: "Mineur" },
  { value: "b2b", label: "B2B" },
  { value: "all", label: "Tous publics" },
];

function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function groupByBlock(rows: CTAVariantRow[]): Map<string, CTAVariantRow[]> {
  const g = new Map<string, CTAVariantRow[]>();
  for (const r of rows) {
    const bucket = g.get(r.block_key) ?? [];
    bucket.push(r);
    g.set(r.block_key, bucket);
  }
  return g;
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [audience, setAudience] = useState("");
  const [posts, setPosts] = useState<PostsResponse | null>(null);
  const [ctas, setCtas] = useState<CTAVariantRow[]>([]);
  const [ctasConfigured, setCtasConfigured] = useState(true);
  const [funnel, setFunnel] = useState<FunnelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, c, f] = await Promise.all([
          getPostsAnalytics(period, audience || undefined),
          getCTAsAnalytics(period),
          getFunnelPwaStart(period),
        ]);
        if (cancelled) return;
        setPosts(p);
        setCtas(c.rows);
        setCtasConfigured(c.plausible_configured);
        setFunnel(f);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period, audience]);

  const plausibleOn = posts?.plausible_configured ?? ctasConfigured;

  const totals = useMemo(() => {
    if (!posts) return { views: 0, clicks: 0, subs: 0 };
    return posts.posts.reduce(
      (acc, r) => ({
        views: acc.views + r.views,
        clicks: acc.clicks + r.cta_clicks,
        subs: acc.subs + r.newsletter_subscribes,
      }),
      { views: 0, clicks: 0, subs: 0 },
    );
  }, [posts]);

  const ctaGroups = useMemo(() => groupByBlock(ctas), [ctas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-elsai-pin-dark font-serif text-3xl">Analytics</h1>
          <p className="text-elsai-ink/70 text-sm">
            Performance éditoriale & CTA — aucune donnée personnelle.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-organic border px-3 py-1 text-xs ${
                  period === p.value
                    ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                    : "border-elsai-pin/20 bg-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin border bg-white px-3 py-1 text-xs"
          >
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!plausibleOn && (
        <div className="rounded-organic border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Plausible non configuré — seuls les events internes (ContentEvent) sont affichés.
          Pour activer les pageviews et le goal <code>pwa_start</code>, renseigner{" "}
          <code>PLAUSIBLE_SITE_ID</code> et <code>PLAUSIBLE_API_KEY</code> côté backend.
        </div>
      )}
      {error && (
        <div className="text-elsai-urgence rounded-organic border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Vues (total)" value={totals.views.toLocaleString("fr-FR")} tone="pin" />
        <StatCard label="Clics CTA" value={totals.clicks.toLocaleString("fr-FR")} tone="rose" />
        <StatCard
          label="Subscribes newsletter"
          value={totals.subs.toLocaleString("fr-FR")}
          tone="pin"
        />
        <StatCard
          label="Articles suivis"
          value={posts?.posts.length ?? 0}
          hint={`période ${period}`}
        />
      </div>

      {/* Section 1 — Top posts */}
      <section className="rounded-organic border-elsai-pin/15 bg-white/70 border p-4">
        <h2 className="text-elsai-pin-dark mb-3 font-serif text-xl">Top posts — {period}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-elsai-ink/60 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left">Titre</th>
                <th className="px-3 py-2 text-left">Audience</th>
                <th className="px-3 py-2 text-right">Vues</th>
                <th className="px-3 py-2 text-right">Impressions CTA</th>
                <th className="px-3 py-2 text-right">Clics CTA</th>
                <th className="px-3 py-2 text-right">CTR</th>
                <th className="px-3 py-2 text-right">Subscribes</th>
              </tr>
            </thead>
            <tbody>
              {posts?.posts.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-elsai-ink/50 px-3 py-6 text-center">
                    Aucune donnée sur la période.
                  </td>
                </tr>
              )}
              {posts?.posts.map((r) => (
                <tr key={r.post_id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/blog/${r.post_id}`}
                      className="text-elsai-pin-dark hover:underline"
                    >
                      {r.title}
                    </Link>
                    <div className="text-elsai-ink/40 text-[11px]">/{r.slug}</div>
                  </td>
                  <td className="px-3 py-2 text-xs uppercase text-elsai-ink/60">{r.audience}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {r.views.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-elsai-ink/70">
                    {r.cta_impressions.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {r.cta_clicks.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{formatPct(r.cta_ctr)}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {r.newsletter_subscribes.toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2 — CTA performance */}
      <section className="rounded-organic border-elsai-pin/15 bg-white/70 border p-4">
        <h2 className="text-elsai-pin-dark mb-3 font-serif text-xl">Performance CTA</h2>
        {ctaGroups.size === 0 && (
          <p className="text-elsai-ink/50 text-sm">Aucun event CTA sur la période.</p>
        )}
        <div className="space-y-4">
          {Array.from(ctaGroups.entries()).map(([blockKey, variants]) => {
            const maxImpr = Math.max(...variants.map((v) => v.impressions), 1);
            return (
              <div key={blockKey} className="rounded-organic border border-slate-200 p-3">
                <h3 className="text-elsai-pin-dark mb-2 font-mono text-xs">{blockKey}</h3>
                <table className="w-full text-xs">
                  <thead className="text-elsai-ink/60 uppercase">
                    <tr>
                      <th className="px-2 py-1 text-left">Variant</th>
                      <th className="px-2 py-1 text-left">Audience</th>
                      <th className="px-2 py-1 text-right">Impressions</th>
                      <th className="px-2 py-1 text-right">Clics</th>
                      <th className="px-2 py-1 text-right">CTR</th>
                      <th className="px-2 py-1 text-left">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => {
                      const pct = Math.round((v.impressions / maxImpr) * 100);
                      return (
                        <tr
                          key={`${v.block_key}:${v.variant}`}
                          className="border-t border-slate-100"
                        >
                          <td className="px-2 py-1 font-mono">{v.variant}</td>
                          <td className="px-2 py-1 uppercase text-elsai-ink/60">{v.audience}</td>
                          <td className="px-2 py-1 text-right font-mono">
                            {v.impressions.toLocaleString("fr-FR")}
                          </td>
                          <td className="px-2 py-1 text-right font-mono">
                            {v.clicks.toLocaleString("fr-FR")}
                          </td>
                          <td className="px-2 py-1 text-right font-mono">{formatPct(v.ctr)}</td>
                          <td className="px-2 py-1">
                            <div className="bg-elsai-creme/60 h-2 w-32 overflow-hidden rounded-full">
                              <div
                                className="bg-elsai-pin h-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3 — Funnel PWA */}
      <section className="rounded-organic border-elsai-pin/15 bg-white/70 border p-4">
        <h2 className="text-elsai-pin-dark mb-3 font-serif text-xl">
          Funnel PWA — article → CTA → /start
        </h2>
        {funnel && <FunnelBars steps={funnel.steps} />}
        {funnel && !funnel.plausible_configured && (
          <p className="text-elsai-ink/50 mt-3 text-xs">
            Étape <code>/start</code> nécessite Plausible (goal <code>pwa_start</code>).
          </p>
        )}
      </section>

      {loading && <p className="text-elsai-ink/50 text-xs">Chargement…</p>}
    </div>
  );
}
