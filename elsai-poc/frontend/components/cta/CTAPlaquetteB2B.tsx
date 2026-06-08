import type { CTAProps } from "./types";

type Props = CTAProps & {
  pdfUrl?: string;
  title?: string;
};

export function CTAPlaquetteB2B({
  pdfUrl = "/downloads/plaquette-b2b.pdf",
  title = "Téléchargez la plaquette ESLAÏ Entreprises",
}: Props) {
  return (
    <section
      role="complementary"
      aria-label="Télécharger la plaquette ESLAÏ B2B"
      data-cta-component="CTAPlaquetteB2B"
      className="rounded-organic bg-elsai-rose/10 border-elsai-rose/20 border p-8 md:p-10"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-elsai-pin text-2xl font-semibold md:text-3xl">{title}</h2>
          <p className="text-elsai-pin/80 mt-3 text-base">
            Retrouvez dans ce document nos engagements, nos tarifs et les modalités de déploiement
            pour vos équipes.
          </p>
        </div>
        <a
          href={pdfUrl}
          download
          className="rounded-organic bg-elsai-rose text-elsai-cream hover:bg-elsai-rose/90 focus-visible:ring-elsai-pin focus-visible:ring-offset-elsai-cream inline-flex items-center justify-center px-6 py-3 text-base font-medium transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label="Télécharger la plaquette B2B au format PDF"
        >
          Télécharger la plaquette (PDF)
        </a>
      </div>
    </section>
  );
}
