import type { CTAProps } from "./types";

type Props = CTAProps & {
  bookingUrl?: string;
  title?: string;
};

export function CTABookingRDV({
  bookingUrl = "https://calendly.com/elsai/15min",
  title = "Réservez un échange de 15 minutes",
}: Props) {
  return (
    <section
      role="complementary"
      aria-label="Réserver un rendez-vous de 15 minutes avec l'équipe ELSAI"
      data-cta-component="CTABookingRDV"
      className="rounded-organic bg-elsai-pin p-8 md:p-10"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-semibold text-elsai-cream">
            {title}
          </h2>
          <p className="mt-3 text-base text-elsai-cream/90">
            Vous souhaitez explorer un déploiement ELSAI dans votre organisation ? Choisissez un créneau qui vous convient, nous nous adaptons à votre agenda.
          </p>
        </div>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-organic bg-elsai-cream px-6 py-3 text-base font-medium text-elsai-pin transition hover:bg-elsai-cream/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-elsai-cream focus-visible:ring-offset-2 focus-visible:ring-offset-elsai-pin"
          aria-label="Réserver un rendez-vous de 15 minutes (ouvre dans un nouvel onglet)"
        >
          Réserver un créneau (15 min)
        </a>
      </div>
    </section>
  );
}
