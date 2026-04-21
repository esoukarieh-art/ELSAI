import type { CTAProps } from "./types";

export interface CTAUrgence3919Props extends CTAProps {
  context?: string;
}

export function CTAUrgence3919({ context, className }: CTAUrgence3919Props) {
  return (
    <aside
      data-cta-component="CTAUrgence3919"
      role="alert"
      aria-label="Numéro d'urgence 3919 - Violences Femmes Info"
      className={`rounded-organic bg-elsai-cream border-l-4 border-elsai-rose my-6 p-5 ${className ?? ""}`}
    >
      <h3 className="text-elsai-rose font-semibold text-lg">Vous subissez des violences ? Vous n&apos;êtes pas seule.</h3>
      <p className="mt-1 text-sm text-slate-700">
        {context ?? "Le 3919 est gratuit, anonyme et confidentiel. Des écoutantes formées vous accompagnent."}
      </p>
      <p className="mt-3">
        <a
          href="tel:3919"
          aria-label="Appeler le 3919, Violences Femmes Info"
          className="font-bold text-2xl text-elsai-pin underline decoration-elsai-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-elsai-rose focus-visible:ring-offset-2"
        >
          3919
        </a>
        <span className="ml-2 text-sm text-slate-700">Violences Femmes Info · gratuit · anonyme</span>
      </p>
    </aside>
  );
}
