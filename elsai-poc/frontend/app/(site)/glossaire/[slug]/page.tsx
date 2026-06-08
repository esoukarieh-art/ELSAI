import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Section from "@/components/site/Section";

interface Term {
  slug: string;
  sigle: string;
  full_name: string;
  definition_md: string;
}

async function fetchTerm(slug: string): Promise<Term | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/api/public/glossary/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const term = await fetchTerm(slug);
  if (!term) return { title: "Sigle introuvable — ESLAÏ" };
  return {
    title: `${term.sigle} — ${term.full_name} | ESLAÏ`,
    description: term.definition_md.slice(0, 160),
    alternates: { canonical: `/glossaire/${term.slug}` },
  };
}

export default async function TermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const term = await fetchTerm(slug);
  if (!term) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.sigle,
    description: term.full_name,
    inDefinedTermSet: { "@type": "DefinedTermSet", name: "Glossaire ESLAÏ" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="bg-symbiose">
        <div className="mx-auto max-w-3xl px-4 py-14 md:py-16">
          <Link href="/glossaire" className="text-elsai-pin text-sm font-semibold hover:underline">
            ← Glossaire
          </Link>
          <p className="text-elsai-pin mt-4 text-xs font-semibold tracking-[0.2em] uppercase">
            Sigle
          </p>
          <h1 className="text-elsai-pin-dark mt-3 font-serif text-4xl md:text-5xl">{term.sigle}</h1>
          <p className="text-elsai-ink/80 mt-2 text-lg">{term.full_name}</p>
        </div>
      </section>

      <Section>
        <article className="prose-elsai max-w-3xl">
          <p className="text-elsai-ink/85 leading-relaxed">{term.definition_md}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/start"
              className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark inline-flex items-center px-5 py-3 font-semibold"
            >
              Poser ma question →
            </Link>
            <Link
              href="/glossaire"
              className="rounded-organic border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/5 inline-flex items-center border px-5 py-3 font-semibold"
            >
              Voir tous les sigles
            </Link>
          </div>
        </article>
      </Section>
    </>
  );
}
