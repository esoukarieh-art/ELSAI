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
      aria-label="Réserver un rendez-vous de 15 minutes avec l'équipe ESLAÏ"
      data-cta-component="CTABookingRDV"
      className="rounded-organic bg-elsai-pin p-8 md:p-10"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-elsai-cream text-2xl font-semibold md:text-3xl">{title}</h2>
          <p className="text-elsai-cream/90 mt-3 text-base">
            Vous souhaitez explorer un déploiement ESLAÏ dans votre organisation ? Choisissez un
            créneau qui vous convient, nous nous adaptons à votre agenda.
          </p>
        </div>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-organic bg-elsai-cream text-elsai-pin hover:bg-elsai-cream/90 focus-visible:ring-elsai-cream focus-visible:ring-offset-elsai-pin inline-flex items-center justify-center px-6 py-3 text-base font-medium transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label="Réserver un rendez-vous de 15 minutes (ouvre dans un nouvel onglet)"
        >
          Réserver un créneau (15 min)
        </a>
      </div>
    </section>
  );
}
