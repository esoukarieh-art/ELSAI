"use client";

export interface GateInput {
  title: string;
  slug: string;
  slugAvailable: boolean | null;
  seoTitle: string;
  seoDescription: string;
  targetKeyword: string;
  audience: string;
  readabilityLevel: string | null;
  editorialOk: boolean | null;
  schemaType: string;
  ogImageUrl: string | null;
  content: string;
  freshnessReviewAt: string | null;
}

export interface GateCheck {
  key: string;
  label: string;
  ok: boolean;
  hint?: string;
}

const MONEY_RE = /\b\d+[.,]?\d*\s*(€|euros?|%|SMIC)\b/i;

export function runGate(i: GateInput): GateCheck[] {
  const title = (i.title ?? "").trim();
  const slug = (i.slug ?? "").trim();
  const seoTitle = (i.seoTitle ?? "").trim();
  const seoDesc = (i.seoDescription ?? "").trim();
  const keyword = (i.targetKeyword ?? "").trim().toLowerCase();
  const content = (i.content ?? "").toLowerCase();

  const firstSentence = content.slice(0, 300);
  const keywordPresent = !!keyword && (firstSentence.includes(keyword) || content.includes(keyword));

  const hasMoney = MONEY_RE.test(i.content ?? "");

  const checks: GateCheck[] = [
    { key: "title", label: "Titre ≥ 20 caractères", ok: title.length >= 20 },
    {
      key: "slug",
      label: "Slug valide et disponible",
      ok: slug.length >= 3 && i.slugAvailable !== false,
      hint: i.slugAvailable === null ? "vérification…" : undefined,
    },
    {
      key: "seoTitle",
      label: "SEO title 50-60 caractères",
      ok: seoTitle.length >= 50 && seoTitle.length <= 60,
      hint: `${seoTitle.length}c`,
    },
    {
      key: "seoDesc",
      label: "SEO description 140-160 caractères",
      ok: seoDesc.length >= 140 && seoDesc.length <= 160,
      hint: `${seoDesc.length}c`,
    },
    {
      key: "keyword",
      label: "Target keyword présent dans le contenu",
      ok: !!keyword && keywordPresent,
    },
    { key: "audience", label: "Audience définie", ok: !!i.audience },
    {
      key: "readability",
      label: "Lisibilité ≤ B1",
      ok: !!i.readabilityLevel && ["A1", "A2", "B1"].includes(i.readabilityLevel),
      hint: i.readabilityLevel ?? "non calculé",
    },
    {
      key: "editorial",
      label: "Check éditorial OK",
      ok: i.editorialOk === true,
      hint: i.editorialOk === null ? "non lancé" : undefined,
    },
    { key: "schema", label: "Schema type choisi", ok: !!i.schemaType },
    {
      key: "og",
      label: "og:image ou placeholder",
      ok: !!i.ogImageUrl && i.ogImageUrl.length > 0,
    },
    {
      key: "freshness",
      label: "Freshness review (si barème/montant)",
      ok: !hasMoney || !!i.freshnessReviewAt,
      hint: hasMoney ? "barème détecté" : undefined,
    },
  ];
  return checks;
}

export default function PublishGate({ input }: { input: GateInput }) {
  const checks = runGate(input);
  const allOk = checks.every((c) => c.ok);
  return (
    <div className="space-y-2">
      <div
        className={`rounded-organic border px-3 py-2 text-sm ${
          allOk
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        {allOk
          ? "✓ Tous les critères sont remplis — publication autorisée."
          : "Quelques critères bloquent encore la publication."}
      </div>
      <ul className="space-y-1 text-sm">
        {checks.map((c) => (
          <li key={c.key} className="flex items-center gap-2">
            <span
              aria-hidden
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                c.ok ? "bg-emerald-500" : "bg-rose-500"
              }`}
            >
              {c.ok ? "✓" : "×"}
            </span>
            <span className={c.ok ? "text-elsai-ink/80" : "text-elsai-ink"}>
              {c.label}
              {c.hint && <span className="text-elsai-ink/50 ml-1 text-xs">({c.hint})</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
