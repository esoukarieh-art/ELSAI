"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCTAsAnalytics, type CTAVariantRow } from "@/lib/admin/analyticsApi";
import { listCTAs, type CTARow } from "@/lib/admin/ctaApi";

export default function CTAListPage() {
  const [rows, setRows] = useState<CTARow[]>([]);
  const [metrics, setMetrics] = useState<Map<string, CTAVariantRow>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, analytics] = await Promise.all([
          listCTAs(),
          getCTAsAnalytics("30d").catch(() => ({ rows: [] as CTAVariantRow[] })),
        ]);
        if (cancelled) return;
        setRows(data);
        const m = new Map<string, CTAVariantRow>();
        for (const r of analytics.rows) m.set(`${r.block_key}:${r.variant}`, r);
        setMetrics(m);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-elsai-pin font-serif text-3xl">CTA Blocks</h1>
          <p className="text-sm text-slate-600">Variantes A/B des 17 CTA. CTR calculé en P0.10.</p>
        </div>
        <Link
          href="/admin/cta/new"
          className="rounded-organic bg-elsai-pin text-elsai-cream hover:bg-elsai-pin/90 px-4 py-2 text-sm"
        >
          + Nouvelle variante
        </Link>
      </div>

      {error && (
        <p className="rounded-organic text-elsai-rose mb-3 border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="rounded-organic border-elsai-pin/15 overflow-x-auto border bg-white/70">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Clé</th>
              <th className="px-3 py-2 text-left">Composant</th>
              <th className="px-3 py-2 text-left">Variant</th>
              <th className="px-3 py-2 text-left">Audience</th>
              <th className="px-3 py-2 text-left">Weight</th>
              <th className="px-3 py-2 text-left">Actif</th>
              <th className="px-3 py-2 text-left">CTR</th>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-slate-400">
                  Aucun CTA.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const m = metrics.get(`${r.key}:${r.variant}`);
              const ctr = m && m.impressions > 0 ? `${(m.ctr * 100).toFixed(1)}%` : "—";
              const ctrHint = m ? `${m.clicks}/${m.impressions}` : "";
              return (
                <tr
                  key={r.id}
                  className={`hover:bg-elsai-pin/5 border-t border-slate-100 ${
                    !r.active ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-xs">{r.key}</td>
                  <td className="px-3 py-2">{r.component}</td>
                  <td className="px-3 py-2">{r.variant}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-organic bg-slate-100 px-2 py-0.5 text-[11px] uppercase">
                      {r.audience}
                    </span>
                  </td>
                  <td className="px-3 py-2">{r.weight}</td>
                  <td className="px-3 py-2">{r.active ? "✓" : "✗"}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {ctr}
                    {ctrHint && (
                      <span className="ml-1 text-[10px] text-slate-400">({ctrHint})</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/cta/${r.id}`} className="text-elsai-pin hover:underline">
                      Modifier
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {loading && <p className="mt-2 text-xs text-slate-400">Chargement…</p>}
    </div>
  );
}
