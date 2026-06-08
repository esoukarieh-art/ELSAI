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
      aria-label={`Dossier complet : ${pillarTitle}`}
      className={`rounded-organic bg-elsai-pin text-elsai-cream my-8 p-6 ${className ?? ""}`}
    >
      <div className="mb-2 text-[11px] tracking-wide uppercase opacity-80">Dossier complet</div>
      <h3 className="font-serif text-xl font-semibold">{pillarTitle}</h3>
      {description && <p className="mt-2 text-sm opacity-90">{description}</p>}
      <Link
        href={`/${basePath}/${clusterSlug}`}
        className="rounded-organic bg-elsai-cream text-elsai-pin focus-visible:ring-elsai-cream focus-visible:ring-offset-elsai-pin mt-4 inline-flex items-center px-4 py-2 font-medium hover:bg-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Explorer le dossier →
      </Link>
    </aside>
  );
}
