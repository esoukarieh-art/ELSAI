import type { Metadata } from "next";
import Link from "next/link";
import Section from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Glossaire des sigles — ESLAÏ",
  description:
    "RSA, AAH, MDPH, ASE, CAF, CMU-C... Tous les sigles du droit social français expliqués simplement.",
  alternates: { canonical: "/glossaire" },
};

interface IndexEntry {
  slug: string;
  sigle: string;
  full_name: string;
}

async function fetchIndex(): Promise<IndexEntry[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/api/public/glossary/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function GlossairePage() {
  const entries = await fetchIndex();
  const grouped = groupByLetter(entries);

  return (
    <>
      <section className="bg-symbiose">
        <div className="mx-auto max-w-4xl px-4 py-14 md:py-20">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            Glossaire
          </p>
          <h1 className="text-elsai-pin-dark mt-3 font-serif text-4xl leading-tight md:text-5xl">
            Les sigles du droit social, expliqués sans jargon.
          </h1>
          <p className="text-elsai-ink/80 mt-5 text-lg">
            CAF, MDPH, RAPO, AAH, RSA, C2S... Quand vous vous perdez dans les
            sigles, c'est ici.
          </p>
        </div>
      </section>

      <Section>
        {entries.length === 0 ? (
          <p className="text-elsai-ink/70">Glossaire en cours d'alimentation.</p>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([letter, items]) => (
              <div key={letter}>
                <h2 className="text-elsai-pin font-serif text-2xl font-bold">
                  {letter}
                </h2>
                <ul className="mt-3 grid gap-3 md:grid-cols-2">
                  {items.map((e) => (
                    <li key={e.slug}>
                      <Link
                        href={`/glossaire/${e.slug}`}
                        className="rounded-organic border-elsai-pin/15 bg-elsai-creme hover:border-elsai-pin/40 block border p-4 transition-colors"
                      >
                        <div className="text-elsai-pin-dark font-semibold">
                          {e.sigle}
                        </div>
                        <div className="text-elsai-ink/70 text-sm">
                          {e.full_name}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

function groupByLetter(entries: IndexEntry[]): Record<string, IndexEntry[]> {
  const out: Record<string, IndexEntry[]> = {};
  for (const e of entries) {
    const letter = (e.sigle[0] || "?").toUpperCase();
    if (!out[letter]) out[letter] = [];
    out[letter].push(e);
  }
  return out;
}
