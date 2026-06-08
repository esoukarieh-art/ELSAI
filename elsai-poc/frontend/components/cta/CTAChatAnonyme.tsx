import Link from "next/link";
import type { CTAProps } from "./types";

export interface CTAChatAnonymeProps extends CTAProps {
  title?: string;
  subtitle?: string;
  variant?: "inline" | "end" | "sidebar";
}

export function CTAChatAnonyme({
  audience = "all",
  title,
  subtitle,
  variant = "inline",
  className,
}: CTAChatAnonymeProps) {
  const isMinor = audience === "minor";

  const defaultTitle = isMinor
    ? "Pose ta question, anonymement"
    : "Posez votre question, anonymement";

  const defaultSubtitle = isMinor
    ? "Pas besoin de créer un compte. Tu peux tout effacer à tout moment."
    : "Pas besoin de créer un compte. Vous pouvez tout effacer à tout moment.";

  const ariaLabel = isMinor
    ? "Commencer une conversation anonyme avec ESLAÏ"
    : "Démarrer une conversation anonyme avec ESLAÏ";

  const buttonLabel = isMinor ? "Commencer →" : "Commencer →";

  const variantClasses: Record<NonNullable<CTAChatAnonymeProps["variant"]>, string> = {
    inline: "my-6 p-6",
    end: "mt-10 p-6",
    sidebar: "p-5",
  };

  return (
    <aside
      data-cta-component="CTAChatAnonyme"
      aria-label={ariaLabel}
      className={`rounded-organic bg-elsai-cream ${variantClasses[variant]} ${className ?? ""}`}
    >
      <h3 className="text-elsai-pin text-lg font-semibold">{title ?? defaultTitle}</h3>
      <p className="mt-1 text-sm text-slate-700">{subtitle ?? defaultSubtitle}</p>
      <Link
        href="/start"
        aria-label={ariaLabel}
        className="rounded-organic bg-elsai-pin text-elsai-cream hover:bg-elsai-pin/90 focus-visible:ring-elsai-pin mt-4 inline-flex items-center px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {buttonLabel}
      </Link>
    </aside>
  );
}
