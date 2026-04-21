import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";
import {
  TRACKS,
  TRACK_META,
  fetchPosts,
  type PublicPostSummary,
  type Track,
} from "@/lib/content";

export const revalidate = 60;

type Props = {
  params: Promise<{ track: string }>;
  searchParams: Promise<{ page?: string }>;
};

const PAGE_SIZE = 12;

function isTrack(x: string): x is Track {
  return (TRACKS as string[]).includes(x);
}

export async function generateStaticParams() {
  return TRACKS.map((track) => ({ track }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track } = await params;
  if (!isTrack(track)) return { title: "Journal ELSAI" };
  const meta = TRACK_META[track];
  return {
    title: `Journal ELSAI — ${meta.label}`,
    description: meta.description,
    alternates: { canonical: `/blog/${track}` },
    openGraph: {
      title: `Journal ELSAI — ${meta.label}`,
      description: meta.description,
      type: "website",
    },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function Card({ post, track, tutoiement }: { post: PublicPostSummary; track: Track; tutoiement: boolean }) {
  return (
    <article className="rounded-organic border-elsai-pin/15 bg-elsai-creme hover:border-elsai-pin/40 border p-7 transition-colors">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {post.hero_eyebrow && (
          <span className="text-elsai-pin font-semibold tracking-[0.2em] uppercase">
            {post.hero_eyebrow}
          </span>
        )}
        {post.published_at && (
          <>
            <span className="text-elsai-ink/40">·</span>
            <time className="text-elsai-ink/60" dateTime={post.published_at}>
              {formatDate(post.published_at)}
            </time>
          </>
        )}
        <span className="text-elsai-ink/40">·</span>
        <span className="text-elsai-ink/60">{post.reading_minutes} min de lecture</span>
      </div>
      <h2 className="text-elsai-pin-dark mt-3 font-serif text-2xl leading-snug md:text-3xl">
        <Link href={`/blog/${track}/${post.slug}`} className="hover:underline">
          {post.title}
        </Link>
      </h2>
      <p className="text-elsai-ink/80 mt-3 leading-relaxed">{post.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/blog/${track}/${post.slug}`}
          className="text-elsai-pin-dark text-sm font-semibold hover:underline"
        >
          {tutoiement ? "Lis l'article" : "Lire l'article"} →
        </Link>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((t) => (
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
  );
}

export default async function Page({ params, searchParams }: Props) {
  const { track } = await params;
  if (!isTrack(track)) notFound();
  const sp = await searchParams;
  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  const meta = TRACK_META[track];
  const posts = await fetchPosts({ track, limit: PAGE_SIZE + 1, offset });
  const hasNext = posts.length > PAGE_SIZE;
  const visible = posts.slice(0, PAGE_SIZE);
  const tutoiement = track === "jeunes";

  return (
    <>
      <PageHero eyebrow={meta.eyebrow} title={`Journal — ${meta.label}`}>
        {meta.description}
      </PageHero>

      <Section>
        {visible.length === 0 ? (
          <p className="text-elsai-ink/70">
            {tutoiement ? "Rien pour l'instant, reviens bientôt." : "Aucun article pour le moment."}
          </p>
        ) : (
          <div className="space-y-5">
            {visible.map((p) => (
              <Card key={p.slug} post={p} track={track} tutoiement={tutoiement} />
            ))}
          </div>
        )}

        {(pageNum > 1 || hasNext) && (
          <nav className="mt-10 flex justify-between" aria-label="Pagination">
            {pageNum > 1 ? (
              <Link
                href={`/blog/${track}${pageNum - 1 > 1 ? `?page=${pageNum - 1}` : ""}`}
                className="text-elsai-pin-dark text-sm font-semibold hover:underline"
              >
                ← Page précédente
              </Link>
            ) : (
              <span />
            )}
            {hasNext && (
              <Link
                href={`/blog/${track}?page=${pageNum + 1}`}
                className="text-elsai-pin-dark text-sm font-semibold hover:underline"
              >
                Page suivante →
              </Link>
            )}
          </nav>
        )}
      </Section>
    </>
  );
}
