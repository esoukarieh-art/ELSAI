import Link from "next/link";
import type { CTAProps } from "./types";

export interface CTAArticleLieProps extends CTAProps {
  slug: string;
  title: string;
  description?: string;
  clusterName?: string;
}

/**
 * Carte discrète de maillage interne vers un article lié.
 * Lien vers /blog/[slug].
 */
export function CTAArticleLie({
  slug,
  title,
  description,
  clusterName,
  className,
}: CTAArticleLieProps) {
  return (
    <aside
      data-cta-component="CTAArticleLie"
      className={`rounded-organic border-elsai-pin/20 my-4 border bg-white/60 p-4 ${className ?? ""}`}
    >
      {clusterName && (
        <div className="text-elsai-rose mb-1 text-[11px] tracking-wide uppercase">
          {clusterName}
        </div>
      )}
      <Link
        href={`/blog/${slug}`}
        className="text-elsai-pin focus-visible:ring-elsai-pin font-medium hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {title} →
      </Link>
      {description && <p className="mt-1 text-sm text-slate-700">{description}</p>}
    </aside>
  );
}
