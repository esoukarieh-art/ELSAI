"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getPost } from "@/lib/admin/contentApi";
import type { BlogPostDetail } from "@/lib/admin/types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  review: "En revue",
  scheduled: "Planifié",
  published: "Publié",
  private: "Privé",
  archived: "Archivé",
};

function formatDate(iso: string | null | undefined): string {
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

export default function BlogPreviewPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getPost(id)
      .then(setPost)
      .catch((e) => setError((e as Error).message));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-elsai-urgence rounded-organic border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
          {error}
        </p>
        <Link href="/admin/blog" className="text-elsai-pin-dark mt-4 inline-block text-sm underline">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  if (!post) {
    return <p className="p-8 text-sm text-slate-500">Chargement…</p>;
  }

  return (
    <div className="bg-elsai-creme/30 min-h-screen">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm">
        <div className="flex items-center gap-3">
          <span className="rounded-organic bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">
            Aperçu admin · {STATUS_LABEL[post.status] ?? post.status}
          </span>
          <span className="text-amber-900">
            /{post.slug} · audience {post.audience}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/admin/blog/${id}`} className="text-amber-900 underline hover:no-underline">
            Éditer
          </Link>
          <Link href="/admin/blog" className="text-amber-900 underline hover:no-underline">
            Liste
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-10">
        {post.hero_eyebrow && (
          <p className="text-elsai-pin mb-2 text-sm uppercase tracking-wide">
            {post.hero_eyebrow}
          </p>
        )}
        <h1 className="text-elsai-pin-dark font-serif text-4xl md:text-5xl">{post.title}</h1>
        {post.description && (
          <p className="text-elsai-ink/80 mt-4 text-lg">{post.description}</p>
        )}
        <div className="text-elsai-ink/60 mt-4 flex flex-wrap items-center gap-3 text-xs">
          {post.author_display && <span>Par {post.author_display}</span>}
          {post.published_at ? (
            <span>Publié le {formatDate(post.published_at)}</span>
          ) : (
            <span>Modifié le {formatDate(post.updated_at)}</span>
          )}
          <span>· {post.reading_minutes} min de lecture</span>
        </div>

        {post.og_image_url && (
          <img
            src={post.og_image_url}
            alt=""
            className="rounded-organic mt-6 w-full"
          />
        )}

        <div
          className="prose prose-lg prose-elsai mt-8 max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content_mdx }}
        />

        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span
                key={t}
                className="rounded-organic bg-elsai-pin/10 text-elsai-pin-dark px-2 py-0.5 text-xs"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
