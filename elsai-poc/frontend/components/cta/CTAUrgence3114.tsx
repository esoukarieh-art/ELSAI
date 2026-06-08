import type { CTAProps } from "./types";

export interface CTAUrgence3114Props extends CTAProps {
  context?: string;
}

export function CTAUrgence3114({ context, audience = "all", className }: CTAUrgence3114Props) {
  const isMinor = audience === "minor";
  const description =
    context ??
    (isMinor
      ? "Si tu as des pensées sombres, tu peux parler au 3114. Gratuit, confidentiel, 24h/24. Tu n'es pas seul·e."
      : "Si vous avez des pensées sombres, vous pouvez parler au 3114. Gratuit, confidentiel, 24h/24. Vous n'êtes pas seul·e.");

  return (
    <aside
      data-cta-component="CTAUrgence3114"
      aria-label="Numéro d'urgence 3114 - Prévention du suicide"
      className={`rounded-organic bg-elsai-cream border-elsai-rose my-6 border-l-4 p-5 ${className ?? ""}`}
    >
      <h3 className="text-elsai-rose text-lg font-semibold">
        Besoin de parler ? Des professionnels vous écoutent.
      </h3>
      <p className="mt-1 text-sm text-slate-700">{description}</p>
      <p className="mt-3">
        <a
          href="tel:3114"
          aria-label="Appeler le 3114, numéro national de prévention du suicide"
          className="text-elsai-pin decoration-elsai-rose focus-visible:ring-elsai-rose text-2xl font-bold underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          3114
        </a>
        <span className="ml-2 text-sm text-slate-700">Prévention suicide · gratuit · 24h/24</span>
      </p>
    </aside>
  );
}
