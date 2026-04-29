"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface IndexEntry {
  slug: string;
  sigle: string;
  full_name: string;
}

let GLOSSARY_CACHE: IndexEntry[] | null = null;

async function loadGlossary(): Promise<IndexEntry[]> {
  if (GLOSSARY_CACHE) return GLOSSARY_CACHE;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/api/public/glossary/`);
    if (!res.ok) return [];
    const data = (await res.json()) as IndexEntry[];
    GLOSSARY_CACHE = data;
    return data;
  } catch {
    return [];
  }
}

export default function MessageWithGlossary({ content }: { content: string }) {
  const [glossary, setGlossary] = useState<IndexEntry[]>([]);

  useEffect(() => {
    loadGlossary().then(setGlossary);
  }, []);

  if (glossary.length === 0) return <>{content}</>;

  // Build regex from sigles, longest first to avoid partial matches.
  const sigles = glossary
    .map((g) => g.sigle)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex);
  const re = new RegExp(`\\b(${sigles.join("|")})\\b`, "g");

  const parts: Array<{ kind: "text" | "link"; text: string; slug?: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ kind: "text", text: content.slice(lastIndex, match.index) });
    }
    const matched = match[1];
    const entry = glossary.find((g) => g.sigle === matched);
    parts.push({ kind: "link", text: matched, slug: entry?.slug });
    lastIndex = match.index + matched.length;
  }
  if (lastIndex < content.length) {
    parts.push({ kind: "text", text: content.slice(lastIndex) });
  }

  return (
    <>
      {parts.map((p, i) =>
        p.kind === "link" && p.slug ? (
          <Link
            key={i}
            href={`/glossaire/${p.slug}`}
            target="_blank"
            className="text-elsai-pin underline decoration-dotted underline-offset-2 hover:decoration-solid"
            title={`Définition de ${p.text}`}
          >
            {p.text}
          </Link>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
