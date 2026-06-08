import type { CTAProps } from "./types";

export interface CTAUrgence119Props extends CTAProps {
  context?: string;
}

export function CTAUrgence119({ context, className }: CTAUrgence119Props) {
  return (
    <aside
      data-cta-component="CTAUrgence119"
      role="alert"
      aria-label="Numéro d'urgence 119 - Enfance en danger"
      className={`rounded-organic bg-elsai-cream border-elsai-rose my-6 border-l-4 p-5 ${className ?? ""}`}
    >
      <h3 className="text-elsai-rose text-lg font-semibold">
        Tu es en danger ? Tu n&apos;es pas seul·e.
      </h3>
      <p className="mt-1 text-sm text-slate-700">
        {context ??
          "Le 119 est gratuit, anonyme, 24h/24. Des professionnels formés sont là pour t'écouter."}
      </p>
      <p className="mt-3">
        <a
          href="tel:119"
          aria-label="Appeler le 119, numéro Enfance en danger"
          className="text-elsai-pin decoration-elsai-rose focus-visible:ring-elsai-rose text-2xl font-bold underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          119
        </a>
        <span className="ml-2 text-sm text-slate-700">Enfance en danger · gratuit · 24h/24</span>
      </p>
    </aside>
  );
}
