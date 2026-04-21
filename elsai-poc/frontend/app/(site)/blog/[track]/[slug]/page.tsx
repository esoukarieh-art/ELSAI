import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";
import { CTABlockRender } from "@/components/cta/CTABlockRender";
import { CTA_REGISTRY } from "@/components/cta/registry";
import { MDX_COMPONENTS } from "@/components/mdx";
import {
  AUDIENCE_TO_TRACK,
  TRACKS,
  TRACK_META,
  fetchPost,
  fetchPosts,
  type PublicPostDetail,
  type Track,
} from "@/lib/content";
import { buildJsonLd } from "@/lib/jsonLd";
import { computeAutoInjectedCTAs, type ExistingCTA } from "@/lib/ctaAutoInject";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 60;

type Props = { params: Promise<{ track: string; slug: string }> };

function isTrack(x: string): x is Track {
  return (TRACKS as string[]).includes(x);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track, slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: "Article introuvable" };
  const canonicalTrack = AUDIENCE_TO_TRACK[post.audience] ?? "particuliers";
  const canonical = `/blog/${canonicalTrack}/${post.slug}`;
  const image = post.og_image_url ?? `${SITE_URL}/api/og/${post.slug}`;
  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.description,
    alternates: { canonical },
    openGraph: {
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.description,
      type: "article",
      url: `${SITE_URL}${canonical}`,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.published_at ?? undefined,
      authors: post.author_display ? [post.author_display] : undefined,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.description,
      images: [image],
    },
    other: { "article:track": track },
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

function ctaKeyToBlockKey(ctaKey: string): string {
  // cta_key en DB = block key; utilisé tel quel par /api/public/ctas/{key}
  return ctaKey;
}

function renderCTAList(
  ctas: { key: string; position: string }[],
  position: "top" | "inline" | "end",
  postSlug: string,
) {
  const filtered = ctas.filter((c) => c.position === position);
  if (filtered.length === 0) return null;
  return (
    <div className={`my-8 space-y-6`} data-cta-position={position}>
      {filtered.map((c, i) => (
        <CTABlockRender key={`${c.key}:${i}`} blockKey={c.key} postSlug={postSlug} />
      ))}
    </div>
  );
}

export default async function Page({ params }: Props) {
  const { track, slug } = await params;
  if (!isTrack(track)) notFound();

  const post: PublicPostDetail | null = await fetchPost(slug);
  if (!post) notFound();

  const canonicalTrack = AUDIENCE_TO_TRACK[post.audience] ?? "particuliers";
  if (canonicalTrack !== track) {
    redirect(`/blog/${canonicalTrack}/${post.slug}`);
  }

  const meta = TRACK_META[track];

  // --- Préparer CTA list (existant + auto-injection) ------------------------
  const existing: ExistingCTA[] = post.ctas.map((c) => ({
    cta_key: c.cta_key,
    position: c.position,
  }));
  const injected = computeAutoInjectedCTAs({
    post: { tags: post.tags, audience: post.audience },
    existingCTAs: existing,
  });

  type Slot = { key: string; position: "top" | "inline" | "end" };
  const slots: Slot[] = [
    ...existing
      .filter((c) => c.position !== "sticky")
      .map<Slot>((c) => ({ key: ctaKeyToBlockKey(c.cta_key), position: c.position as Slot["position"] })),
    ...injected.map<Slot>((i) => ({ key: i.blockKey, position: i.position })),
  ];

  // --- JSON-LD ---------------------------------------------------------------
  const breadcrumb = [
    { name: "Accueil", url: `${SITE_URL}/` },
    { name: "Journal", url: `${SITE_URL}/blog` },
    { name: meta.label, url: `${SITE_URL}/blog/${track}` },
    { name: post.title, url: `${SITE_URL}/blog/${track}/${post.slug}` },
  ];
  const jsonLd = buildJsonLd(post, breadcrumb);

  // --- Articles liés (même cluster, fallback même tag) -----------------------
  let related: { slug: string; title: string }[] = [];
  if (post.cluster_id) {
    const siblings = await fetchPosts({ track, limit: 4 });
    related = siblings
      .filter((p) => p.slug !== post.slug && p.cluster_id === post.cluster_id)
      .slice(0, 3)
      .map((p) => ({ slug: p.slug, title: p.title }));
  }
  if (related.length === 0 && post.tags.length > 0) {
    const sameTag = await fetchPosts({ track, tag: post.tags[0], limit: 4 });
    related = sameTag
      .filter((p) => p.slug !== post.slug)
      .slice(0, 3)
      .map((p) => ({ slug: p.slug, title: p.title }));
  }

  // Components exposés au MDX : components éditoriaux + registre CTA (alias "Block key")
  const mdxComponents = {
    ...MDX_COMPONENTS,
    ...CTA_REGISTRY,
  };

  return (
    <>
      {jsonLd.map((obj, i) => (
        <script
          key={`ld-${i}`}
          type="application/ld+json"
          // JSON.stringify suffit — pas d'injection possible depuis objet structuré
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}

      <PageHero eyebrow={post.hero_eyebrow ?? meta.eyebrow} title={post.title}>
        <nav aria-label="Fil d'Ariane" className="text-elsai-ink/70 mb-3 text-xs">
          <ol className="flex flex-wrap gap-1">
            <li>
              <Link href="/" className="hover:underline">
                Accueil
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href="/blog" className="hover:underline">
                Journal
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href={`/blog/${track}`} className="hover:underline">
                {meta.label}
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li className="text-elsai-ink/50">{post.title}</li>
          </ol>
        </nav>
        <span className="text-elsai-ink/60 block text-sm">
          {formatDate(post.published_at)} · {post.reading_minutes} min de lecture
          {post.author_display ? ` · ${post.author_display}` : ""}
        </span>
      </PageHero>

      <Section>
        <article className="prose-elsai mx-auto max-w-3xl">
          {renderCTAList(slots, "top", post.slug)}

          <MDXRemote source={post.content_mdx || ""} components={mdxComponents} />

          {renderCTAList(slots, "inline", post.slug)}
          {renderCTAList(slots, "end", post.slug)}
        </article>

        <footer className="border-elsai-pin/15 mx-auto mt-16 max-w-3xl border-t pt-8">
          {related.length > 0 && (
            <div className="mb-8">
              <h2 className="text-elsai-pin-dark mb-3 font-serif text-xl">À lire aussi</h2>
              <ul className="space-y-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/blog/${track}/${r.slug}`}
                      className="text-elsai-pin-dark hover:underline"
                    >
                      → {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/blog/${track}`}
              className="text-elsai-pin-dark hover:bg-elsai-pin/5 rounded-organic border-elsai-pin/30 inline-flex items-center gap-2 border px-5 py-3 text-sm font-semibold"
            >
              ← Tous les articles
            </Link>
          </div>
        </footer>
      </Section>
    </>
  );
}
