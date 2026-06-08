import Link from "next/link";
import type { CTAProps } from "./types";

export interface CTACourrierTypeProps extends CTAProps {
  templateKey?: string;
  title?: string;
  description?: string;
}

export function CTACourrierType({
  audience = "all",
  templateKey,
  title,
  description,
  className,
}: CTACourrierTypeProps) {
  const isMinor = audience === "minor";

  const defaultTitle = isMinor
    ? "Un courrier type pour t'aider"
    : "Un courrier type pour vous aider";

  const defaultDescription = isMinor
    ? "Un modèle prêt à remplir, que tu peux adapter à ta situation."
    : "Un modèle prêt à remplir, que vous pouvez adapter à votre situation.";

  const href = templateKey ? `/courrier/${templateKey}` : "/courriers";

  const ariaLabel = isMinor ? "Ouvrir le courrier type" : "Consulter le courrier type";

  const buttonLabel = isMinor ? "Voir le modèle →" : "Consulter le modèle →";

  return (
    <aside
      data-cta-component="CTACourrierType"
      aria-label={ariaLabel}
      className={`rounded-organic bg-elsai-cream p-6 ${className ?? ""}`}
    >
      <h3 className="text-elsai-pin text-lg font-semibold">{title ?? defaultTitle}</h3>
      <p className="mt-1 text-sm text-slate-700">{description ?? defaultDescription}</p>
      <Link
        href={href}
        aria-label={ariaLabel}
        className="rounded-organic border-elsai-pin text-elsai-pin hover:bg-elsai-pin hover:text-elsai-cream focus-visible:ring-elsai-pin mt-4 inline-flex items-center border-2 bg-transparent px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {buttonLabel}
      </Link>
    </aside>
  );
}
