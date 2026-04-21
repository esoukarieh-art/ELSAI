import Link from "next/link";
import type { CTAProps } from "./types";

type Props = CTAProps & {
  ctaLabel?: string;
  title?: string;
  href?: string;
};

export function CTADemoEntreprise({
  ctaLabel = "Demander une démo",
  title = "Découvrez ELSAI pour vos équipes",
  href = "/b2b/demo",
}: Props) {
  return (
    <section
      role="complementary"
      aria-label="Demander une démo ELSAI pour votre entreprise"
      data-cta-component="CTADemoEntreprise"
      className="rounded-organic bg-elsai-cream p-8 md:p-10 border border-elsai-pin/10"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-semibold text-elsai-pin">
            {title}
          </h2>
          <p className="mt-3 text-base text-elsai-pin/80">
            Offrez à vos collaborateurs un accompagnement social confidentiel. Nous vous présentons ELSAI en 30 minutes, adapté à votre contexte RH.
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-organic bg-elsai-pin px-6 py-3 text-base font-medium text-elsai-cream transition hover:bg-elsai-pin/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-elsai-pin focus-visible:ring-offset-2 focus-visible:ring-offset-elsai-cream"
          aria-label={`${ctaLabel} — ELSAI entreprise`}
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
