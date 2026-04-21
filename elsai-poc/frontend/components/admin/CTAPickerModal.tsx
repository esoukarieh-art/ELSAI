"use client";

import { useEffect, useMemo, useState } from "react";

import { CTARow, listCTAs } from "@/lib/admin/ctaApi";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (ctaKey: string) => void;
  /** Clés déjà attachées (pour les désactiver visuellement). */
  excludeKeys?: string[];
}

const AUDIENCES = [
  { value: "", label: "Toutes" },
  { value: "all", label: "Tout public" },
  { value: "adult", label: "Adultes" },
  { value: "minor", label: "Mineurs" },
  { value: "b2b", label: "B2B" },
];

export default function CTAPickerModal({ open, onClose, onPick, excludeKeys = [] }: Props) {
  const [ctas, setCtas] = useState<CTARow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [audience, setAudience] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    listCTAs({})
      .then((rows) => {
        setCtas(rows);
      })
      .catch((e) => {
        setError(e.message ?? "Erreur de chargement");
      })
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ctas.filter((c) => {
      if (activeOnly && !c.active) return false;
      if (audience && c.audience !== audience && c.audience !== "all") return false;
      if (!q) return true;
      return (
        c.key.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q) ||
        c.component.toLowerCase().includes(q)
      );
    });
  }, [ctas, search, audience, activeOnly]);

  // Regroupe par clé (variants A/B partagent la même clé)
  const grouped = useMemo(() => {
    const map = new Map<string, CTARow[]>();
    for (const c of filtered) {
      const arr = map.get(c.key) ?? [];
      arr.push(c);
      map.set(c.key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="rounded-organic flex max-h-[85vh] w-full max-w-3xl flex-col bg-white shadow-lg">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-elsai-pin-dark mb-3 font-serif text-lg">Ajouter un CTA</h3>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (clé, libellé, composant)…"
              className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin flex-1 border px-3 py-2 text-sm focus:outline-none"
            />
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="rounded-organic border-elsai-pin/20 border px-2 py-2 text-sm"
            >
              {AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <label className="text-elsai-ink/70 flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
              />
              Actifs uniquement
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-elsai-ink/60 text-sm">Chargement…</p>}
          {error && <p className="text-elsai-urgence text-sm">{error}</p>}
          {!loading && !error && grouped.length === 0 && (
            <p className="text-elsai-ink/60 text-sm">Aucun CTA trouvé.</p>
          )}
          {!loading && !error && grouped.length > 0 && (
            <ul className="space-y-1">
              {grouped.map(([key, variants]) => {
                const primary = variants[0];
                const isExcluded = excludeKeys.includes(key);
                const isSelected = selected === key;
                return (
                  <li
                    key={key}
                    className={`rounded-organic border px-3 py-2 text-sm transition ${
                      isSelected
                        ? "border-elsai-pin bg-elsai-pin/5"
                        : isExcluded
                          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                          : "hover:border-elsai-pin/40 cursor-pointer border-slate-200"
                    }`}
                    onClick={() => {
                      if (isExcluded) return;
                      setSelected(key);
                    }}
                    onDoubleClick={() => {
                      if (isExcluded) return;
                      onPick(key);
                      onClose();
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-elsai-pin-dark text-xs">{key}</code>
                          {isExcluded && (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] uppercase text-slate-600">
                              déjà attaché
                            </span>
                          )}
                          {!primary.active && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] uppercase text-amber-800">
                              inactif
                            </span>
                          )}
                        </div>
                        <p className="text-elsai-ink mt-0.5 truncate">{primary.label}</p>
                        <p className="text-elsai-ink/60 mt-0.5 text-xs">
                          {primary.component} · audience {primary.audience}
                          {variants.length > 1 && ` · ${variants.length} variantes`}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-between gap-2 border-t border-slate-200 p-4">
          <p className="text-elsai-ink/50 self-center text-[11px]">
            Double-cliquez pour ajouter directement.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-organic border-elsai-pin/20 text-elsai-ink/70 border px-3 py-1 text-sm"
            >
              Annuler
            </button>
            <button
              disabled={!selected}
              onClick={() => {
                if (selected) {
                  onPick(selected);
                  onClose();
                }
              }}
              className="rounded-organic bg-elsai-pin text-elsai-creme px-3 py-1 text-sm disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
