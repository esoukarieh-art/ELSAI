import Link from "next/link";
import type { CTAProps } from "./types";

export interface CTAScanDocumentProps extends CTAProps {
  title?: string;
  fileHint?: string;
}

export function CTAScanDocument({
  audience = "all",
  title,
  fileHint,
  className,
}: CTAScanDocumentProps) {
  const isMinor = audience === "minor";

  const defaultTitle = isMinor
    ? "Scanne un courrier ou un document"
    : "Scannez un courrier ou un document";

  const defaultHint = isMinor
    ? "PDF, JPG ou PNG — ESLAÏ t'explique ce que ça veut dire."
    : "PDF, JPG ou PNG — ESLAÏ vous explique ce que cela signifie.";

  const ariaLabel = isMinor
    ? "Importer un document à analyser"
    : "Téléverser un document à analyser";

  const buttonLabel = isMinor ? "Importer un document →" : "Téléverser un document →";

  return (
    <aside
      data-cta-component="CTAScanDocument"
      aria-label={ariaLabel}
      className={`rounded-organic bg-elsai-cream p-6 ${className ?? ""}`}
    >
      <h3 className="text-elsai-pin text-lg font-semibold">{title ?? defaultTitle}</h3>
      <p className="mt-1 text-sm text-slate-700">{fileHint ?? defaultHint}</p>
      <Link
        href="/scan"
        aria-label={ariaLabel}
        className="rounded-organic bg-elsai-rose text-elsai-cream hover:bg-elsai-rose/90 focus-visible:ring-elsai-pin mt-4 inline-flex items-center px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {buttonLabel}
      </Link>
    </aside>
  );
}
