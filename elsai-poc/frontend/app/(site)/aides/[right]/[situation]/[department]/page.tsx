import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Section from "@/components/site/Section";

export const revalidate = 86400;

interface PageData {
  composite_slug: string;
  title: string;
  seo_description: string;
  content_md: string;
  right_slug: string;
  situation_slug: string;
  department_code: string;
  word_count: number;
  status: string;
}

async function fetchPage(
  rightSlug: string,
  situationSlug: string,
  departmentSlug: string,
): Promise<PageData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(
      `${apiUrl}/api/public/aides/by-keys/${rightSlug}/${situationSlug}/${departmentSlug}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ right: string; situation: string; department: string }>;
}): Promise<Metadata> {
  const { right, situation, department } = await params;
  const page = await fetchPage(right, situation, department);
  if (!page) return { title: "Page introuvable — ESLAÏ" };
  const canonical = `/aides/${right}/${situation}/${department}`;
  return {
    title: `${page.title} | ESLAÏ`,
    description: page.seo_description,
    alternates: { canonical },
    robots: page.word_count < 350 ? { index: false } : undefined,
  };
}

export default async function LongTailPage({
  params,
}: {
  params: Promise<{ right: string; situation: string; department: string }>;
}) {
  const { right, situation, department } = await params;
  const page = await fetchPage(right, situation, department);
  if (!page) notFound();

  return (
    <>
      <section className="bg-symbiose">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
            Aides locales
          </p>
          <h1 className="text-elsai-pin-dark mt-3 font-serif text-4xl leading-tight md:text-5xl">
            {page.title}
          </h1>
          <p className="text-elsai-ink/80 mt-4 text-base leading-relaxed md:text-lg">
            {page.seo_description}
          </p>
        </div>
      </section>

      <Section>
        <article className="prose-elsai max-w-3xl">
          <MarkdownContent md={page.content_md} />
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={`/start?context=${page.composite_slug}`}
              className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark inline-flex items-center px-6 py-3 font-semibold"
            >
              Poser ma question maintenant →
            </Link>
            <Link
              href="/glossaire"
              className="rounded-organic border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/5 inline-flex items-center border px-6 py-3 font-semibold"
            >
              Glossaire des sigles
            </Link>
          </div>
        </article>
      </Section>
    </>
  );
}

function MarkdownContent({ md }: { md: string }) {
  const blocks = md.split(/\n\n+/).map((b, i) => {
    const trimmed = b.trim();
    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={i} className="text-elsai-pin-dark mt-8 font-serif text-2xl">
          {trimmed.replace(/^#\s+/, "")}
        </h2>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={i} className="text-elsai-pin-dark mt-6 font-serif text-xl">
          {trimmed.replace(/^##\s+/, "")}
        </h3>
      );
    }
    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={i} className="text-elsai-pin-dark mt-4 font-serif text-lg">
          {trimmed.replace(/^###\s+/, "")}
        </h4>
      );
    }
    if (/^[-*]\s+/.test(trimmed)) {
      const items = trimmed
        .split(/\n/)
        .filter((l) => /^[-*]\s+/.test(l))
        .map((l) => l.replace(/^[-*]\s+/, ""));
      return (
        <ul key={i} className="text-elsai-ink/85 mt-3 list-disc space-y-1 pl-6">
          {items.map((it, j) => (
            <li key={j}>{it}</li>
          ))}
        </ul>
      );
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = trimmed
        .split(/\n/)
        .filter((l) => /^\d+\.\s+/.test(l))
        .map((l) => l.replace(/^\d+\.\s+/, ""));
      return (
        <ol key={i} className="text-elsai-ink/85 mt-3 list-decimal space-y-1 pl-6">
          {items.map((it, j) => (
            <li key={j}>{it}</li>
          ))}
        </ol>
      );
    }
    return (
      <p key={i} className="text-elsai-ink/85 mt-3 leading-relaxed">
        {trimmed}
      </p>
    );
  });
  return <>{blocks}</>;
}
