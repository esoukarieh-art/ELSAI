import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/site/PageHero";
import Section from "@/components/site/Section";
import { getAllPosts, getPost } from "@/lib/blog";
import { PostContent } from "./posts";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article introuvable" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <>
      <PageHero eyebrow={post.heroEyebrow} title={post.title}>
        <span className="text-elsai-ink/60 block text-sm">
          {post.dateHuman} · {post.readingMinutes} min de lecture · {post.author}
        </span>
      </PageHero>

      <Section>
        <article className="prose-elsai mx-auto max-w-3xl">
          <PostContent slug={post.slug} />
        </article>

        <div className="border-elsai-pin/15 mx-auto mt-16 max-w-3xl border-t pt-8">
          <p className="text-elsai-ink/60 text-sm">
            Les chiffres et sources cités dans cet article sont issus de la DREES
            (Direction de la recherche, des études, de l'évaluation et des statistiques),
            enquête 2022 sur le non-recours aux prestations sociales.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/blog"
              className="text-elsai-pin-dark hover:bg-elsai-pin/5 rounded-organic border-elsai-pin/30 inline-flex items-center gap-2 border px-5 py-3 text-sm font-semibold"
            >
              ← Tous les articles
            </Link>
            <Link
              href="/offre"
              className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold"
            >
              Découvrir l'offre entreprises →
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
