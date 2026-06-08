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
      className={`rounded-organic border-elsai-rose/40 my-6 border bg-white/60 p-4 ${className ?? ""}`}
    >
      <div className="text-elsai-rose text-[11px] tracking-wide uppercase">Annuaire local</div>
      <h3 className="text-elsai-pin mt-1 font-medium">{displayLabel}</h3>
      {geoHint && <p className="mt-1 text-sm text-slate-700">Zone : {geoHint}</p>}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-organic border-elsai-pin text-elsai-pin hover:bg-elsai-pin hover:text-elsai-cream focus-visible:ring-elsai-pin mt-3 inline-flex items-center border px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Ouvrir l&apos;annuaire ↗
      </a>
    </aside>
  );
}
