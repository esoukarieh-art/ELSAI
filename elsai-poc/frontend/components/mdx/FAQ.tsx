interface FAQItem {
  q: string;
  a: string;
}

interface Props {
  items: FAQItem[];
  title?: string;
}

export function FAQ({ items, title }: Props) {
  if (!items || items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <section className="rounded-organic border-elsai-pin/15 bg-elsai-creme/50 my-8 border p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {title && (
        <h2 className="text-elsai-pin-dark mb-4 font-serif text-xl md:text-2xl">{title}</h2>
      )}
      <dl className="space-y-4">
        {items.map((item, i) => (
          <div key={i}>
            <dt className="text-elsai-pin-dark font-semibold">{item.q}</dt>
            <dd className="text-elsai-ink/80 mt-1 leading-relaxed">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
