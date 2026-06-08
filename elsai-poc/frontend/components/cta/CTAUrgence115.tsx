import type { CTAProps } from "./types";

export interface CTAUrgence115Props extends CTAProps {
  context?: string;
}

export function CTAUrgence115({ context, audience = "all", className }: CTAUrgence115Props) {
  const isMinor = audience === "minor";
  const description =
    context ??
    (isMinor
      ? "Le 115 peut t'aider à trouver un hébergement d'urgence. Gratuit, 24h/24."
      : "Le 115 peut vous aider à trouver un hébergement d'urgence. Gratuit, 24h/24.");

  return (
    <aside
      data-cta-component="CTAUrgence115"
      aria-label="Numéro d'urgence 115 - Hébergement d'urgence"
      className={`rounded-organic bg-elsai-cream border-elsai-rose my-6 border-l-4 p-5 ${className ?? ""}`}
    >
      <h3 className="text-elsai-rose text-lg font-semibold">
        Besoin d&apos;un hébergement d&apos;urgence ?
      </h3>
      <p className="mt-1 text-sm text-slate-700">{description}</p>
      <p className="mt-3">
        <a
          href="tel:115"
          aria-label="Appeler le 115, Samu Social"
          className="text-elsai-pin decoration-elsai-rose focus-visible:ring-elsai-rose text-2xl font-bold underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          115
        </a>
        <span className="ml-2 text-sm text-slate-700">Samu Social · gratuit · 24h/24</span>
      </p>
    </aside>
  );
}
