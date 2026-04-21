"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AiToolbar from "@/components/admin/AiToolbar";
import CTAPickerModal from "@/components/admin/CTAPickerModal";
import ContentEditor from "@/components/admin/ContentEditor";
import PublishGate, { runGate, type GateInput } from "@/components/admin/PublishGate";
import ReadabilityGauge from "@/components/admin/ReadabilityGauge";
import SchemaSelector, { type SchemaType } from "@/components/admin/SchemaSelector";
import {
  aiSeoMeta,
  attachCTA,
  checkSlug,
  getPost,
  publishPost,
  schedulePost,
  updatePost,
} from "@/lib/admin/contentApi";
import {
  getPostAnalytics,
  type PostDetailResponse,
} from "@/lib/admin/analyticsApi";
import type {
  Audience,
  BlogPostDetail,
  BriefResult,
  PostKind,
  EditorialCheckResult,
  ReadabilityResult,
  SchemaSuggestion,
} from "@/lib/admin/types";

type TabKey = "meta" | "seo" | "schema" | "cta" | "gate" | "perf" | "revisions";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "meta", label: "Meta" },
  { key: "seo", label: "SEO" },
  { key: "schema", label: "Schema" },
  { key: "cta", label: "CTA" },
  { key: "gate", label: "Gate" },
  { key: "perf", label: "Perf" },
  { key: "revisions", label: "Revisions" },
];

const AUDIENCES: Array<{ value: Audience; label: string }> = [
  { value: "adult", label: "Adulte" },
  { value: "minor", label: "Mineur" },
  { value: "b2b", label: "B2B" },
  { value: "all", label: "Tous" },
];

const KINDS: Array<{ value: PostKind; label: string; hint: string }> = [
  { value: "article", label: "Article (blog)", hint: "Visible dans /blog, workflow éditorial." },
  { value: "help", label: "Aide (guide utilisateur)", hint: "Visible dans /aide, centre d'aide SEO." },
];

function wordsOf(plain: string): number {
  return plain.trim() ? plain.trim().split(/\s+/).length : 0;
}

function htmlToPlain(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, " ");
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || "";
}

export default function BlogEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [tab, setTab] = useState<TabKey>("meta");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // draft fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [plainText, setPlainText] = useState("");
  const [audience, setAudience] = useState<Audience>("adult");
  const [kind, setKind] = useState<PostKind>("article");
  const [tags, setTags] = useState<string[]>([]);
  const [authorDisplay, setAuthorDisplay] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [schemaType, setSchemaType] = useState<string>("Article");
  const [schemaExtraJson, setSchemaExtraJson] = useState<string>("{}");

  // gate / ai results
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [readability, setReadability] = useState<ReadabilityResult | null>(null);
  const [editorial, setEditorial] = useState<EditorialCheckResult | null>(null);
  const [brief, setBrief] = useState<BriefResult | null>(null);
  const [schemaSuggest, setSchemaSuggest] = useState<SchemaSuggestion | null>(null);
  const [freshnessReviewAt, setFreshnessReviewAt] = useState<string>("");

  // cta modal
  const [ctaOpen, setCtaOpen] = useState(false);

  // analytics (panneau Performance)
  const [analytics, setAnalytics] = useState<PostDetailResponse | null>(null);

  const readabilityCacheRef = useRef<Map<string, ReadabilityResult>>(new Map());

  const hydrate = useCallback((p: BlogPostDetail) => {
    setPost(p);
    setTitle(p.title);
    setSlug(p.slug);
    setContentHtml(p.content_mdx);
    setPlainText(htmlToPlain(p.content_mdx));
    setAudience(p.audience);
    setKind((p.kind ?? "article") as PostKind);
    setTags(p.tags ?? []);
    setAuthorDisplay(p.author_display ?? "");
    setTargetKeyword(p.target_keyword ?? "");
    setSeoTitle(p.seo_title ?? "");
    setSeoDescription(p.seo_description ?? "");
    setOgImage(p.og_image_url ?? "");
    setSchemaType(p.schema_type ?? "Article");
    setSchemaExtraJson(p.schema_extra_json ?? "{}");
    setDirty(false);
  }, []);

  useEffect(() => {
    if (!id) return;
    getPost(id).then(hydrate).catch((e) => setError((e as Error).message));
  }, [id, hydrate]);

  // Charge les analytics du post si publié (/api/admin/analytics/posts/{slug}).
  useEffect(() => {
    if (!post || post.status !== "published" || !post.slug) {
      setAnalytics(null);
      return;
    }
    let cancelled = false;
    getPostAnalytics(post.slug, "30d")
      .then((r) => {
        if (!cancelled) setAnalytics(r);
      })
      .catch(() => {
        if (!cancelled) setAnalytics(null);
      });
    return () => {
      cancelled = true;
    };
  }, [post]);

  // mobile detection
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // slug availability
  useEffect(() => {
    if (!id || !slug) {
      setSlugAvailable(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await checkSlug(slug, id);
        if (!cancelled) setSlugAvailable(r.available);
      } catch {
        if (!cancelled) setSlugAvailable(null);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slug, id]);

  // mark dirty on any field change
  useEffect(() => {
    if (!post) return;
    setDirty(true);
  }, [
    title,
    slug,
    contentHtml,
    audience,
    kind,
    tags,
    authorDisplay,
    targetKeyword,
    seoTitle,
    seoDescription,
    ogImage,
    schemaType,
    schemaExtraJson,
    post,
  ]);

  // beforeunload warning
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const save = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!id) return;
      setSaving(true);
      setError(null);
      if (!opts.silent) setInfo(null);
      try {
        const minutes = Math.max(1, Math.round(wordsOf(plainText) / 200));
        const updated = await updatePost(id, {
          title,
          slug,
          content_mdx: contentHtml,
          audience,
          kind,
          tags,
          author_display: authorDisplay || null,
          target_keyword: targetKeyword || null,
          reading_minutes: minutes,
          seo_title: seoTitle,
          seo_description: seoDescription,
          og_image_url: ogImage || null,
          schema_type: schemaType,
          schema_extra_json: schemaExtraJson,
          readability_level: readability?.level ?? null,
          readability_score: readability?.score ?? null,
        });
        setPost(updated);
        setDirty(false);
        if (!opts.silent) setInfo("Enregistré.");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [
      id,
      title,
      slug,
      contentHtml,
      audience,
      kind,
      tags,
      authorDisplay,
      targetKeyword,
      seoTitle,
      seoDescription,
      ogImage,
      schemaType,
      schemaExtraJson,
      plainText,
      readability,
    ],
  );

  // autosave every 10s if dirty
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => save({ silent: true }), 10_000);
    return () => clearTimeout(t);
  }, [dirty, save]);

  // Ctrl+S
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  const gateInput: GateInput = useMemo(
    () => ({
      title,
      slug,
      slugAvailable,
      seoTitle,
      seoDescription,
      targetKeyword,
      audience,
      readabilityLevel: readability?.level ?? post?.readability_level ?? null,
      editorialOk: editorial ? editorial.ok : null,
      schemaType,
      ogImageUrl: ogImage,
      content: plainText,
      freshnessReviewAt: freshnessReviewAt || null,
    }),
    [
      title,
      slug,
      slugAvailable,
      seoTitle,
      seoDescription,
      targetKeyword,
      audience,
      readability,
      post?.readability_level,
      editorial,
      schemaType,
      ogImage,
      plainText,
      freshnessReviewAt,
    ],
  );

  const canPublish = useMemo(() => runGate(gateInput).every((c) => c.ok), [gateInput]);

  async function handlePublish() {
    if (!id || !canPublish) return;
    await save({ silent: true });
    try {
      const p = await publishPost(id);
      hydrate(p);
      setInfo("Publié.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleSchedule() {
    if (!id) return;
    const iso = window.prompt("Date ISO (YYYY-MM-DDTHH:mm) :", new Date().toISOString().slice(0, 16));
    if (!iso) return;
    await save({ silent: true });
    try {
      const p = await schedulePost(id, new Date(iso).toISOString());
      hydrate(p);
      setInfo(`Planifié pour ${p.scheduled_for}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleGenSeoMeta() {
    if (!id) return;
    try {
      const r = await aiSeoMeta(title, contentHtml);
      setSeoTitle(r.seo_title);
      setSeoDescription(r.seo_description);
      setInfo("Méta SEO générées.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleCtaPick(key: string) {
    if (!id) return;
    try {
      const p = await attachCTA(id, key);
      setPost(p);
      setInfo(`CTA ${key} attaché.`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleCtaDetach(key: string) {
    if (!id) return;
    try {
      const p = await attachCTA(id, key, "inline", 0, true);
      setPost(p);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // Apply rewritten/shortened text to editor (simplified: append)
  const onApplyToSelection = useCallback((text: string) => {
    setContentHtml((prev) => `${prev}\n<p>${text.replace(/\n/g, "<br/>")}</p>`);
    setPlainText((prev) => `${prev}\n${text}`);
  }, []);

  // Cached readability trigger (debounced via AiToolbar button only for P0.5)
  const onReadability = useCallback((r: ReadabilityResult) => {
    const key = plainText.slice(0, 4000);
    readabilityCacheRef.current.set(key, r);
    setReadability(r);
  }, [plainText]);

  if (isMobile) {
    return (
      <div className="rounded-organic border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Édition ordinateur recommandée — cet éditeur n'est pas optimisé pour mobile.
      </div>
    );
  }

  if (!post) {
    return <p className="text-elsai-ink/60 text-sm">Chargement…</p>;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/admin/blog" className="text-elsai-pin-dark text-xs hover:underline">
            ← Liste des articles
          </Link>
          <h1 className="text-elsai-pin-dark font-serif text-2xl">
            {title || "(sans titre)"}
          </h1>
          <p className="text-elsai-ink/60 text-xs">
            Statut : <strong>{post.status}</strong> · modifié le{" "}
            {new Date(post.updated_at).toLocaleString("fr-FR")}
            {dirty && <span className="text-amber-700"> · modifications non enregistrées</span>}
            {saving && <span className="ml-1 text-emerald-700">· enregistrement…</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => save()}
            className="rounded-organic border-elsai-pin text-elsai-pin-dark hover:bg-elsai-pin/10 border px-3 py-1.5 text-sm"
          >
            Enregistrer draft (Ctrl+S)
          </button>
          <button
            onClick={handleSchedule}
            className="rounded-organic border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/10 border px-3 py-1.5 text-sm"
          >
            Planifier
          </button>
          <button
            onClick={handlePublish}
            disabled={!canPublish}
            title={canPublish ? "Publier maintenant" : "Gate non satisfait"}
            className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Publier
          </button>
        </div>
      </div>

      {error && (
        <p className="text-elsai-urgence rounded-organic mb-3 border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {info && (
        <p className="mb-3 rounded-organic border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {info}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        {/* LEFT — content */}
        <section className="space-y-3">
          <div className="rounded-organic border-elsai-pin/15 bg-white/70 space-y-3 border p-3">
            <label className="block">
              <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">Titre</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-elsai-ink/80 mb-1 flex items-center justify-between text-xs uppercase">
                Slug
                <span
                  className={`text-[10px] ${
                    slugAvailable === false
                      ? "text-elsai-urgence"
                      : slugAvailable
                        ? "text-emerald-700"
                        : "text-elsai-ink/50"
                  }`}
                >
                  {slugAvailable === false
                    ? "déjà utilisé"
                    : slugAvailable
                      ? "disponible"
                      : "vérification…"}
                </span>
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
              />
            </label>
          </div>

          <AiToolbar
            getSelection={() => ""}
            getContent={() => plainText}
            getTitle={() => title}
            getKeyword={() => targetKeyword}
            audience={audience === "b2b" ? "adult" : audience === "all" ? "adult" : audience}
            onApplyToSelection={onApplyToSelection}
            onReadability={onReadability}
            onEditorial={setEditorial}
            onBrief={setBrief}
            onSchemaSuggest={setSchemaSuggest}
          />

          <ContentEditor
            initialContent={post.content_mdx}
            onChange={(html, plain) => {
              setContentHtml(html);
              setPlainText(plain);
            }}
            onInsertCTA={() => setCtaOpen(true)}
          />

          {brief && (
            <div className="rounded-organic border-elsai-pin/20 bg-elsai-creme/40 border p-3 text-sm">
              <h3 className="text-elsai-pin-dark mb-1 font-semibold">Brief IA</h3>
              <p className="text-elsai-ink/80 mb-1">
                <strong>Angle :</strong> {brief.angle}
              </p>
              {Array.isArray(brief.outline) && (
                <ul className="text-elsai-ink/80 list-disc pl-5 text-xs">
                  {brief.outline.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {editorial && (
            <div className="rounded-organic border-slate-200 bg-white/70 border p-3 text-sm">
              <h3 className="text-elsai-pin-dark mb-1 font-semibold">
                Check éditorial — {editorial.ok ? "✅ OK" : "⚠ à revoir"}
              </h3>
              {editorial.flags?.length ? (
                <ul className="text-elsai-ink/80 list-disc pl-5 text-xs">
                  {editorial.flags.map((f, i) => (
                    <li key={i}>
                      <strong>{f.severity}</strong> · {f.kind} — {f.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-elsai-ink/60 text-xs">Aucun flag.</p>
              )}
            </div>
          )}
          {schemaSuggest && (
            <div className="rounded-organic border-slate-200 bg-white/70 border p-3 text-sm">
              <h3 className="text-elsai-pin-dark mb-1 font-semibold">
                Schema suggéré : {schemaSuggest.schema_type}
              </h3>
              <p className="text-elsai-ink/70 text-xs">{schemaSuggest.reason}</p>
              <button
                type="button"
                onClick={() => setSchemaType(schemaSuggest.schema_type)}
                className="text-elsai-pin-dark mt-1 text-xs underline"
              >
                Appliquer
              </button>
            </div>
          )}
        </section>

        {/* RIGHT — side panel */}
        <aside className="rounded-organic border-elsai-pin/15 bg-white/70 border p-3">
          <div className="mb-3 flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-organic border px-2 py-1 text-xs ${
                  tab === t.key
                    ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                    : "border-elsai-pin/20 bg-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "meta" && (
            <div className="space-y-3">
              <div>
                <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">
                  Type de contenu
                </span>
                <div className="flex flex-wrap gap-1">
                  {KINDS.map((k) => (
                    <button
                      key={k.value}
                      onClick={() => setKind(k.value)}
                      title={k.hint}
                      className={`rounded-organic border px-2 py-1 text-xs ${
                        kind === k.value
                          ? "bg-elsai-pin text-elsai-creme border-elsai-pin"
                          : "border-elsai-pin/20 bg-white"
                      }`}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
                <p className="text-elsai-ink/60 mt-1 text-[11px]">
                  {KINDS.find((k) => k.value === kind)?.hint}
                </p>
              </div>
              <div>
                <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">Audience</span>
                <div className="flex flex-wrap gap-1">
                  {AUDIENCES.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setAudience(a.value)}
                      className={`rounded-organic border px-2 py-1 text-xs ${
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
                  Tags (séparés par virgule)
                </span>
                <input
                  value={tags.join(", ")}
                  onChange={(e) =>
                    setTags(e.target.value.split(",").map((t) => t.trim()).filter(Boolean))
                  }
                  className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">
                  Auteur affiché
                </span>
                <input
                  value={authorDisplay}
                  onChange={(e) => setAuthorDisplay(e.target.value)}
                  className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">
                  Target keyword
                </span>
                <input
                  value={targetKeyword}
                  onChange={(e) => setTargetKeyword(e.target.value)}
                  className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
                />
              </label>
              <p className="text-elsai-ink/60 text-xs">
                Mots : {wordsOf(plainText)} · reading_minutes ≈{" "}
                {Math.max(1, Math.round(wordsOf(plainText) / 200))}
              </p>
              <ReadabilityGauge
                level={readability?.level ?? post.readability_level}
                score={readability?.score ?? post.readability_score}
              />
            </div>
          )}

          {tab === "seo" && (
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-elsai-ink/80 mb-1 flex items-center justify-between text-xs uppercase">
                  SEO title <span className="text-[10px]">{seoTitle.length}c (cible 50-60)</span>
                </span>
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="text-elsai-ink/80 mb-1 flex items-center justify-between text-xs uppercase">
                  SEO description
                  <span className="text-[10px]">{seoDescription.length}c (cible 140-160)</span>
                </span>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={3}
                  className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">
                  og:image URL
                </span>
                <input
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://…"
                  className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
                />
              </label>
              <button
                onClick={handleGenSeoMeta}
                className="rounded-organic border-elsai-pin text-elsai-pin-dark hover:bg-elsai-pin/10 border px-3 py-1 text-xs"
              >
                Générer avec IA
              </button>
            </div>
          )}

          {tab === "schema" && (
            <SchemaSelector
              value={schemaType as SchemaType}
              extraJson={schemaExtraJson}
              onChange={(t, extra) => {
                setSchemaType(t);
                setSchemaExtraJson(extra);
              }}
            />
          )}

          {tab === "cta" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-elsai-pin-dark text-sm font-semibold">CTA attachés</h3>
                <button
                  onClick={() => setCtaOpen(true)}
                  className="text-elsai-pin-dark text-xs underline"
                >
                  + Ajouter
                </button>
              </div>
              {post.ctas.length === 0 ? (
                <p className="text-elsai-ink/50 text-xs">Aucun CTA attaché.</p>
              ) : (
                <ul className="space-y-1">
                  {post.ctas.map((c) => (
                    <li
                      key={c.cta_key}
                      className="rounded-organic flex items-center justify-between border border-slate-200 bg-white px-2 py-1 text-xs"
                    >
                      <span>
                        <code>{c.cta_key}</code> · {c.position} (ordre {c.sort_order})
                      </span>
                      <button
                        onClick={() => handleCtaDetach(c.cta_key)}
                        className="text-elsai-urgence text-[11px] underline"
                      >
                        Retirer
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "gate" && (
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-elsai-ink/80 mb-1 block text-xs uppercase">
                  Freshness review (si barème)
                </span>
                <input
                  type="date"
                  value={freshnessReviewAt}
                  onChange={(e) => setFreshnessReviewAt(e.target.value)}
                  className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin w-full border bg-white px-3 py-2 text-sm focus:outline-none"
                />
              </label>
              <PublishGate input={gateInput} />
            </div>
          )}

          {tab === "perf" && (
            <div className="space-y-3 text-sm">
              {post.status !== "published" ? (
                <p className="text-elsai-ink/60 text-xs">
                  Disponible après publication de l'article.
                </p>
              ) : !analytics ? (
                <p className="text-elsai-ink/50 text-xs">Chargement…</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-organic border border-elsai-pin/20 bg-elsai-pin/5 p-2">
                      <p className="text-elsai-ink/60 text-[10px] uppercase">Vues 30j</p>
                      <p className="text-elsai-pin-dark font-serif text-lg">
                        {analytics.post?.views.toLocaleString("fr-FR") ?? 0}
                      </p>
                    </div>
                    <div className="rounded-organic border border-elsai-rose/20 bg-elsai-rose/5 p-2">
                      <p className="text-elsai-ink/60 text-[10px] uppercase">CTR CTA</p>
                      <p className="text-elsai-pin-dark font-serif text-lg">
                        {((analytics.post?.cta_ctr ?? 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-organic border border-slate-200 bg-white p-2">
                      <p className="text-elsai-ink/60 text-[10px] uppercase">Clics CTA</p>
                      <p className="text-elsai-pin-dark font-serif text-lg">
                        {analytics.post?.cta_clicks ?? 0}
                      </p>
                    </div>
                    <div className="rounded-organic border border-slate-200 bg-white p-2">
                      <p className="text-elsai-ink/60 text-[10px] uppercase">Subscribes</p>
                      <p className="text-elsai-pin-dark font-serif text-lg">
                        {analytics.post?.newsletter_subscribes ?? 0}
                      </p>
                    </div>
                  </div>
                  {!analytics.plausible_configured && (
                    <p className="text-elsai-ink/50 text-[11px]">
                      Plausible non configuré — vues à 0.
                    </p>
                  )}
                  {analytics.ctas.length > 0 && (
                    <div>
                      <p className="text-elsai-ink/80 mb-1 text-xs uppercase">Variantes CTA</p>
                      <ul className="space-y-1 text-xs">
                        {analytics.ctas.map((c) => (
                          <li
                            key={`${c.block_key}:${c.variant}`}
                            className="flex items-center justify-between rounded-organic border border-slate-100 bg-white px-2 py-1"
                          >
                            <span className="font-mono">
                              {c.block_key}:{c.variant}
                            </span>
                            <span className="text-elsai-ink/70">
                              {c.clicks}/{c.impressions} ({(c.ctr * 100).toFixed(1)}%)
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "revisions" && (
            <Link
              href={`/admin/blog/${id}/revisions`}
              className="text-elsai-pin-dark text-sm underline"
            >
              Voir l'historique des révisions →
            </Link>
          )}
        </aside>
      </div>

      <CTAPickerModal
        open={ctaOpen}
        onClose={() => setCtaOpen(false)}
        onPick={handleCtaPick}
        excludeKeys={post?.ctas.map((c) => c.cta_key) ?? []}
      />
    </div>
  );
}
