import type { CTAProps } from "./types";

export interface FAQItem {
  q: string;
  a: string;
}

export interface CTAFAQInlineProps extends CTAProps {
  items: FAQItem[];
  title?: string;
}

/**
 * FAQ inline en <details> natif (accessible, sans JS).
 *
 * Le parent (page blog) peut lire les items côté serveur pour générer
 * le JSON-LD FAQPage via l'attribut data-faq-items sérialisé ci-dessous.
 * Utility suggérée : parser l'HTML rendu ou passer les items au parent
 * via un contexte/prop dédié. Pour le POC, le data-attribut sert de
 * contrat documenté.
 */
export function CTAFAQInline({
  items,
  title = "Questions fréquentes",
  className,
}: CTAFAQInlineProps) {
  if (!items || items.length === 0) return null;
  return (
    <section
      data-cta-component="CTAFAQInline"
      data-faq-items={JSON.stringify(items)}
      className={`rounded-organic bg-elsai-cream my-8 p-6 ${className ?? ""}`}
    >
      <h3 className="text-elsai-pin font-serif text-lg font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2">
        {items.map((item, idx) => (
          <li key={idx}>
            <details className="group rounded-organic bg-white/70 p-3">
              <summary className="text-elsai-pin focus-visible:ring-elsai-pin cursor-pointer list-none font-medium focus-visible:ring-2 focus-visible:outline-none">
                <span className="text-elsai-rose mr-2 inline-block transition-transform group-open:rotate-90">
                  ›
                </span>
                {item.q}
              </summary>
              <p className="mt-2 text-sm text-slate-700">{item.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
