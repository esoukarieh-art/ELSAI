import Link from "next/link";
import type { CTAProps } from "./types";

export interface CTAPillarHubProps extends CTAProps {
  clusterSlug: string;
  pillarTitle: string;
  description?: string;
  basePath?: "cluster" | "dossiers";
}

/**
 * Carte proéminente renvoyant vers le hub d'un cluster (pillar).
 */
export function CTAPillarHub({
  clusterSlug,
  pillarTitle,
  description,
  basePath = "dossiers",
  className,
}: CTAPillarHubProps) {
  return (
    <aside
      data-cta-component="CTAPillarHub"
      role="complementary"
      aria-label={`Dossier complet : ${pillarTitle}`}
      className={`my-8 rounded-organic bg-elsai-pin p-6 text-elsai-cream ${className ?? ""}`}
    >
      <div className="mb-2 text-[11px] uppercase tracking-wide opacity-80">
        Dossier complet
      </div>
      <h3 className="font-serif text-xl font-semibold">{pillarTitle}</h3>
      {description && (
        <p className="mt-2 text-sm opacity-90">{description}</p>
      )}
      <Link
        href={`/${basePath}/${clusterSlug}`}
        className="mt-4 inline-flex items-center rounded-organic bg-elsai-cream px-4 py-2 font-medium text-elsai-pin hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-elsai-cream focus-visible:ring-offset-2 focus-visible:ring-offset-elsai-pin"
      >
        Explorer le dossier →
      </Link>
    </aside>
  );
}
