import type { CTAProps } from "./types";

export interface CTAAnnuaireGeoProps extends CTAProps {
  service: string;
  geoHint?: string;
  url?: string;
  label?: string;
}

const DEFAULT_URL = "https://annuaire.action-sociale.org";

/**
 * Lien externe vers un annuaire géolocalisé (action-sociale.org par défaut).
 */
export function CTAAnnuaireGeo({
  service,
  geoHint,
  url = DEFAULT_URL,
  label,
  className,
}: CTAAnnuaireGeoProps) {
  const displayLabel = label ?? `Trouver un ${service} près de chez vous`;
  return (
    <aside
      data-cta-component="CTAAnnuaireGeo"
      className={`my-6 rounded-organic border border-elsai-rose/40 bg-white/60 p-4 ${className ?? ""}`}
    >
      <div className="text-[11px] uppercase tracking-wide text-elsai-rose">
        Annuaire local
      </div>
      <h3 className="mt-1 font-medium text-elsai-pin">{displayLabel}</h3>
      {geoHint && (
        <p className="mt-1 text-sm text-slate-700">Zone : {geoHint}</p>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center rounded-organic border border-elsai-pin px-4 py-2 font-medium text-elsai-pin hover:bg-elsai-pin hover:text-elsai-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-elsai-pin focus-visible:ring-offset-2"
      >
        Ouvrir l&apos;annuaire ↗
      </a>
    </aside>
  );
}
