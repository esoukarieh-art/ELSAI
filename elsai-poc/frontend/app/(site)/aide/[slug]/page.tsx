import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";
import { CTABlockRender } from "@/components/cta/CTABlockRender";
import { CTA_REGISTRY } from "@/components/cta/registry";
import { MDX_COMPONENTS } from "@/components/mdx";
import {
  fetchHelpPage,
  fetchHelpPages,
  type PublicPostDetail,
} from "@/lib/content";
import { buildJsonLd } from "@/lib/jsonLd";
import { computeAutoInjectedCTAs, type ExistingCTA } from "@/lib/ctaAutoInject";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchHelpPage(slug);
  if (!post) return { title: "Page d'aide introuvable" };
  const canonical = `/aide/${post.slug}`;
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
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.description,
      images: [image],
    },
  };
}

function renderCTAList(
  ctas: { key: string; position: string }[],
  position: "top" | "inline" | "end",
  postSlug: string,
) {
  const filtered = ctas.filter((c) => c.position === position);
  if (filtered.length === 0) return null;
  return (
    <div className="my-8 space-y-6" data-cta-position={position}>
      {filtered.map((c, i) => (
        <CTABlockRender key={`${c.key}:${i}`} blockKey={c.key} postSlug={postSlug} />
      ))}
    </div>
  );
}

export default async function HelpDetailPage({ params }: Props) {
  const { slug } = await params;

  const post: PublicPostDetail | null = await fetchHelpPage(slug);
  if (!post) notFound();

  // --- CTA : existants + auto-injection ------------------------------------
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
      .map<Slot>((c) => ({ key: c.cta_key, position: c.position as Slot["position"] })),
    ...injected.map<Slot>((i) => ({ key: i.blockKey, position: i.position })),
  ];

  // --- JSON-LD -------------------------------------------------------------
  const breadcrumb = [
    { name: "Accueil", url: `${SITE_URL}/` },
    { name: "Aide", url: `${SITE_URL}/aide` },
    { name: post.title, url: `${SITE_URL}/aide/${post.slug}` },
  ];
  const jsonLd = buildJsonLd(post, breadcrumb);

  // --- Voir aussi : 3 autres pages d'aide ----------------------------------
  const siblings = await fetchHelpPages({ limit: 20 });
  const related = siblings
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3)
    .map((p) => ({ slug: p.slug, title: p.title }));

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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}

      <PageHero eyebrow={post.hero_eyebrow ?? "Centre d'aide"} title={post.title}>
        <nav aria-label="Fil d'Ariane" className="text-elsai-ink/70 mb-3 text-xs">
          <ol className="flex flex-wrap gap-1">
            <li>
              <Link href="/" className="hover:underline">
                Accueil
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href="/aide" className="hover:underline">
                Aide
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li className="text-elsai-ink/50">{post.title}</li>
          </ol>
        </nav>
        <span className="text-elsai-ink/60 block text-sm">
          {post.reading_minutes > 0 ? `${post.reading_minutes} min de lecture` : ""}
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
              <h2 className="text-elsai-pin-dark mb-3 font-serif text-xl">
                Voir aussi
              </h2>
              <ul className="space-y-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/aide/${r.slug}`}
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
              href="/aide"
              className="text-elsai-pin-dark hover:bg-elsai-pin/5 rounded-organic border-elsai-pin/30 inline-flex items-center gap-2 border px-5 py-3 text-sm font-semibold"
            >
              ← Centre d'aide
            </Link>
            <Link
              href="/start"
              className="bg-elsai-pin hover:bg-elsai-pin-dark text-elsai-creme rounded-organic inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold"
            >
              Démarrer une conversation →
            </Link>
          </div>
        </footer>
      </Section>
    </>
  );
}
