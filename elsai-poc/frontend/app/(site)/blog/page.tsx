import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Journal ELSAI",
  description:
    "Décryptages de dispositifs, retours de terrain et notes d'usage pour mieux comprendre l'accès aux droits sociaux en France.",
  alternates: { canonical: "/blog" },
};

export default function Page() {
  const posts = getAllPosts();

  return (
    <>
      <PageHero eyebrow="Journal" title="Décryptages et notes de terrain.">
        Articles de fond, retours d'usage et analyses pour mieux comprendre l'accès aux droits
        sociaux en France — à destination des professionnels du social, des RH et de toute
        personne concernée.
      </PageHero>

      <Section>
        {posts.length === 0 ? (
          <p className="text-elsai-ink/70">Aucun article pour le moment.</p>
        ) : (
          <div className="space-y-5">
            {posts.map((p) => (
              <article
                key={p.slug}
                className="rounded-organic border-elsai-pin/15 bg-elsai-creme hover:border-elsai-pin/40 border p-7 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-elsai-pin font-semibold tracking-[0.2em] uppercase">
                    {p.heroEyebrow}
                  </span>
                  <span className="text-elsai-ink/40">·</span>
                  <time className="text-elsai-ink/60" dateTime={p.date}>
                    {p.dateHuman}
                  </time>
                  <span className="text-elsai-ink/40">·</span>
                  <span className="text-elsai-ink/60">{p.readingMinutes} min de lecture</span>
                </div>
                <h2 className="text-elsai-pin-dark mt-3 font-serif text-2xl leading-snug md:text-3xl">
                  <Link href={`/blog/${p.slug}`} className="hover:underline">
                    {p.title}
                  </Link>
                </h2>
                <p className="text-elsai-ink/80 mt-3 leading-relaxed">{p.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/blog/${p.slug}`}
                    className="text-elsai-pin-dark text-sm font-semibold hover:underline"
                  >
                    Lire l'article →
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="bg-elsai-pin/10 text-elsai-pin-dark rounded-full px-2.5 py-1 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
