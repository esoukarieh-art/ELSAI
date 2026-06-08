import Link from "next/link";
import type { CTAProps } from "./types";

type Props = CTAProps & {
  ctaLabel?: string;
  title?: string;
  href?: string;
};

export function CTADemoEntreprise({
  ctaLabel = "Demander une démo",
  title = "Découvrez ESLAÏ pour vos équipes",
  href = "/b2b/demo",
}: Props) {
  return (
    <section
      role="complementary"
      aria-label="Demander une démo ESLAÏ pour votre entreprise"
      data-cta-component="CTADemoEntreprise"
      className="rounded-organic bg-elsai-cream border-elsai-pin/10 border p-8 md:p-10"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-elsai-pin text-2xl font-semibold md:text-3xl">{title}</h2>
          <p className="text-elsai-pin/80 mt-3 text-base">
            Offrez à vos collaborateurs un accompagnement social confidentiel. Nous vous présentons
            ESLAÏ en 30 minutes, adapté à votre contexte RH.
          </p>
        </div>
        <Link
          href={href}
          className="rounded-organic bg-elsai-pin text-elsai-cream hover:bg-elsai-pin/90 focus-visible:ring-elsai-pin focus-visible:ring-offset-elsai-cream inline-flex items-center justify-center px-6 py-3 text-base font-medium transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label={`${ctaLabel} — ESLAÏ entreprise`}
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
