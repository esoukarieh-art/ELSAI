"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createPost } from "@/lib/admin/contentApi";
import type { Audience } from "@/lib/admin/types";

const AUDIENCES: Array<{ value: Audience; label: string }> = [
  { value: "adult", label: "Adulte" },
  { value: "minor", label: "Mineur" },
  { value: "b2b", label: "B2B" },
  { value: "all", label: "Tous publics" },
];

export default function NewBlogPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [audience, setAudience] = useState<Audience>("adult");
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const post = await createPost({
        title: title.trim(),
        slug: slug.trim() || undefined,
        audience,
        target_keyword: keyword.trim() || undefined,
      });
      router.push(`/admin/blog/${post.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-elsai-pin-dark mb-2 font-serif text-2xl">Nouveau post</h1>
      <p className="text-elsai-ink/70 mb-4 text-sm">
        Créez un draft — vous éditerez le contenu, SEO et CTA sur la page suivante.
      </p>
      {error && (
        <p className="text-elsai-urgence rounded-organic mb-3 border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <form
        onSubmit={submit}
        className="rounded-organic border-elsai-pin/15 bg-white/70 space-y-3 border p-4"
      >
        <label className="block text-sm">
          <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">Titre *</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
          />
        </label>
        <label className="block text-sm">
          <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">
            Slug (optionnel — auto)
          </span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto depuis le titre"
            className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
          />
        </label>
        <div>
          <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">Audience</span>
          <div className="flex flex-wrap gap-1">
            {AUDIENCES.map((a) => (
              <button
                type="button"
                key={a.value}
                onClick={() => setAudience(a.value)}
                className={`rounded-organic border px-3 py-1 text-xs ${
                  audience === a.value
                    ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                    : "border-elsai-pin/20 bg-white"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-sm">
          <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">
            Target keyword (optionnel)
          </span>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-4 py-2 text-sm transition-colors disabled:opacity-50"
        >
          {saving ? "Création…" : "Créer le draft"}
        </button>
      </form>
    </div>
  );
}
