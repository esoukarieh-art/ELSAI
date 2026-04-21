import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";
import { TRACKS, TRACK_META, fetchPosts, type PublicPostSummary, type Track } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Journal ELSAI",
  description:
    "Décryptages de dispositifs, retours de terrain et notes d'usage pour mieux comprendre l'accès aux droits sociaux en France.",
  alternates: { canonical: "/blog" },
};

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

function PostCard({ post, track }: { post: PublicPostSummary; track: Track }) {
  return (
    <article className="rounded-organic border-elsai-pin/15 bg-elsai-creme hover:border-elsai-pin/40 border p-6 transition-colors">
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
        <span className="text-elsai-ink/60">{post.reading_minutes} min</span>
      </div>
      <h3 className="text-elsai-pin-dark mt-3 font-serif text-xl leading-snug md:text-2xl">
        <Link href={`/blog/${track}/${post.slug}`} className="hover:underline">
          {post.title}
        </Link>
      </h3>
      <p className="text-elsai-ink/80 mt-2 text-sm leading-relaxed">{post.description}</p>
    </article>
  );
}

export default async function Page() {
  const byTrack = await Promise.all(
    TRACKS.map(async (track) => ({
      track,
      posts: await fetchPosts({ track, limit: 3 }),
    })),
  );

  const hasAny = byTrack.some((t) => t.posts.length > 0);

  return (
    <>
      <PageHero eyebrow="Journal" title="Décryptages et notes de terrain.">
        Articles de fond, retours d'usage et analyses pour mieux comprendre l'accès aux droits
        sociaux en France.
      </PageHero>

      <Section>
        {!hasAny ? (
          <p className="text-elsai-ink/70">Aucun article pour le moment.</p>
        ) : (
          <div className="space-y-14">
            {byTrack.map(({ track, posts }) => {
              const meta = TRACK_META[track];
              return (
                <section key={track} aria-labelledby={`track-${track}`}>
                  <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
                        {meta.eyebrow}
                      </p>
                      <h2
                        id={`track-${track}`}
                        className="text-elsai-pin-dark font-serif text-2xl md:text-3xl"
                      >
                        {meta.label}
                      </h2>
                    </div>
                    <Link
                      href={`/blog/${track}`}
                      className="text-elsai-pin-dark text-sm font-semibold hover:underline"
                    >
                      Tous les articles →
                    </Link>
                  </div>
                  {posts.length === 0 ? (
                    <p className="text-elsai-ink/60 text-sm">Bientôt.</p>
                  ) : (
                    <div className="grid gap-5 md:grid-cols-3">
                      {posts.map((p) => (
                        <PostCard key={p.slug} post={p} track={track} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </Section>
    </>
  );
}
