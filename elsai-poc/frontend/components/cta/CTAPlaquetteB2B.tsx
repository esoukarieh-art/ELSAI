import type { CTAProps } from "./types";

type Props = CTAProps & {
  pdfUrl?: string;
  title?: string;
};

export function CTAPlaquetteB2B({
  pdfUrl = "/downloads/plaquette-b2b.pdf",
  title = "Téléchargez la plaquette ELSAI Entreprises",
}: Props) {
  return (
    <section
      role="complementary"
      aria-label="Télécharger la plaquette ELSAI B2B"
      data-cta-component="CTAPlaquetteB2B"
      className="rounded-organic bg-elsai-rose/10 p-8 md:p-10 border border-elsai-rose/20"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-semibold text-elsai-pin">
            {title}
          </h2>
          <p className="mt-3 text-base text-elsai-pin/80">
            Retrouvez dans ce document nos engagements, nos tarifs et les modalités de déploiement pour vos équipes.
          </p>
        </div>
        <a
          href={pdfUrl}
          download
          className="inline-flex items-center justify-center rounded-organic bg-elsai-rose px-6 py-3 text-base font-medium text-elsai-cream transition hover:bg-elsai-rose/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-elsai-pin focus-visible:ring-offset-2 focus-visible:ring-offset-elsai-cream"
          aria-label="Télécharger la plaquette B2B au format PDF"
        >
          Télécharger la plaquette (PDF)
        </a>
      </div>
    </section>
  );
}
