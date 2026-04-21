"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  aiGenerateDraftStream,
  type ArticleTemplate,
  createPost,
  listArticleTemplates,
} from "@/lib/admin/contentApi";
import type { Audience, PostKind } from "@/lib/admin/types";

const AUDIENCES: Array<{ value: Audience; label: string }> = [
  { value: "adult", label: "Adulte" },
  { value: "minor", label: "Mineur" },
  { value: "b2b", label: "B2B" },
  { value: "all", label: "Tous publics" },
];

const KINDS: Array<{ value: PostKind; label: string }> = [
  { value: "article", label: "Article (blog)" },
  { value: "help", label: "Aide (guide)" },
];

export default function NewBlogPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [audience, setAudience] = useState<Audience>("adult");
  const [kind, setKind] = useState<PostKind>("article");
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [templates, setTemplates] = useState<ArticleTemplate[]>([]);
  const [templateKey, setTemplateKey] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [streamText, setStreamText] = useState("");
  const [streamChars, setStreamChars] = useState(0);

  useEffect(() => {
    if (!generating) return;
    setElapsed(0);
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [generating]);

  const EXPECTED_CHARS = 6000;
  const progressPct = Math.min(98, Math.round((streamChars / EXPECTED_CHARS) * 100));
  const phase =
    streamChars === 0
      ? "Connexion au modèle…"
      : streamChars < 1500
        ? "Rédaction de l'intro…"
        : streamChars < 4000
          ? "Corps de l'article…"
          : streamChars < 5500
            ? "Finalisation & SEO…"
            : "Presque fini…";

  useEffect(() => {
    listArticleTemplates()
      .then((t) => {
        setTemplates(t);
        if (t.length) setTemplateKey(t[0].key);
      })
      .catch(() => setTemplates([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const post = await createPost({
        title: title.trim(),
        slug: slug.trim() || undefined,
        audience,
        kind,
        target_keyword: keyword.trim() || undefined,
      });
      router.push(`/admin/blog/${post.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  async function createWithAI() {
    setError(null);
    if (!title.trim() || title.trim().length < 3) {
      setError("Saisissez un titre (3 car min) avant de générer.");
      return;
    }
    if (!templateKey) {
      setError("Choisissez un template.");
      return;
    }
    setGenerating(true);
    setStreamText("");
    setStreamChars(0);
    try {
      const draft = await aiGenerateDraftStream(
        {
          template_key: templateKey,
          title: title.trim(),
          keyword: keyword.trim(),
          audience,
          kind,
        },
        {
          onChunk: (_t, accumulated) => {
            setStreamText(accumulated);
            setStreamChars(accumulated.length);
          },
        },
      );
      const post = await createPost({
        title: title.trim(),
        slug: slug.trim() || undefined,
        audience,
        kind,
        target_keyword: keyword.trim() || undefined,
        content_mdx: draft.content_mdx,
        seo_title: draft.seo_title,
        seo_description: draft.seo_description,
        description: draft.excerpt,
      });
      router.push(`/admin/blog/${post.id}`);
    } catch (err) {
      setError((err as Error).message);
      setGenerating(false);
    }
  }

  const activeTemplate = templates.find((t) => t.key === templateKey);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-elsai-pin-dark mb-2 font-serif text-2xl">Nouveau post</h1>
      <p className="text-elsai-ink/70 mb-4 text-sm">
        Créez un draft vide ou laissez l'IA pré-remplir le contenu via un template.
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
          <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">Type</span>
          <div className="flex flex-wrap gap-1">
            {KINDS.map((k) => (
              <button
                type="button"
                key={k.value}
                onClick={() => setKind(k.value)}
                className={`rounded-organic border px-3 py-1 text-xs ${
                  kind === k.value
                    ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                    : "border-elsai-pin/20 bg-white"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>
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

        {aiOpen && (
          <div className="rounded-organic border-elsai-pin/20 bg-elsai-creme/40 space-y-2 border p-3">
            <span className="text-elsai-ink/80 block text-xs uppercase">
              Template de prompt IA
            </span>
            <div className="flex flex-wrap gap-1">
              {templates.map((t) => (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => setTemplateKey(t.key)}
                  className={`rounded-organic border px-3 py-1 text-xs ${
                    templateKey === t.key
                      ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                      : "border-elsai-pin/20 bg-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {activeTemplate && (
              <p className="text-elsai-ink/70 text-xs">{activeTemplate.description}</p>
            )}
            <p className="text-elsai-ink/60 text-xs">
              Les prompts sont éditables dans{" "}
              <a href="/admin/prompts" className="underline">
                Admin → Prompts
              </a>{" "}
              (clé <code>ai_article_…</code>).
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={saving || generating}
            className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-4 py-2 text-sm transition-colors disabled:opacity-50"
          >
            {saving ? "Création…" : "Créer le draft"}
          </button>
          {!aiOpen ? (
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              disabled={saving || generating || templates.length === 0}
              className="rounded-organic border-elsai-pin text-elsai-pin-dark hover:bg-elsai-pin/10 border px-4 py-2 text-sm transition-colors disabled:opacity-50"
            >
              ✨ Créer avec IA
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={createWithAI}
                disabled={saving || generating}
                className="rounded-organic bg-elsai-pin-dark text-elsai-creme hover:bg-elsai-pin px-4 py-2 text-sm transition-colors disabled:opacity-50"
              >
                {generating ? "Génération IA…" : "✨ Générer & créer"}
              </button>
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                disabled={generating}
                className="rounded-organic border-elsai-pin/30 px-3 py-2 text-xs"
              >
                Annuler
              </button>
            </>
          )}
        </div>
        {generating && (
          <div className="rounded-organic border-elsai-pin/20 bg-white mt-2 space-y-2 border p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-elsai-ink/80">{phase}</span>
              <span className="text-elsai-ink/60 tabular-nums">
                {streamChars} car · {elapsed}s
              </span>
            </div>
            <div className="bg-elsai-pin/10 h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-elsai-pin h-full rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {streamText && (
              <pre className="bg-elsai-creme/40 text-elsai-ink/80 max-h-48 overflow-auto whitespace-pre-wrap rounded p-2 font-mono text-[11px] leading-snug">
                {streamText.slice(-1200)}
                <span className="animate-pulse">▍</span>
              </pre>
            )}
            <p className="text-elsai-ink/50 text-[11px]">
              Streaming en direct — ne fermez pas la page.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
