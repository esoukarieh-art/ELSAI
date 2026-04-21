import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Aide admin — Backoffice ELSAI",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    nocache: true,
  },
};

async function readGuide(): Promise<string> {
  // process.cwd() pointe vers elsai-poc/frontend ; le guide est dans ../../docs/admin-guide.md
  const candidates = [
    path.resolve(process.cwd(), "..", "..", "docs", "admin-guide.md"),
    path.resolve(process.cwd(), "..", "docs", "admin-guide.md"),
    path.resolve(process.cwd(), "docs", "admin-guide.md"),
  ];
  for (const p of candidates) {
    try {
      const content = await fs.readFile(p, "utf-8");
      return content;
    } catch {
      // try next
    }
  }
  return "# Guide admin introuvable\n\nLe fichier `docs/admin-guide.md` n'a pas été trouvé sur le serveur.";
}

export default async function AdminHelpPage() {
  const markdown = await readGuide();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-elsai-pin-dark font-serif text-3xl">Aide admin</h1>
          <p className="text-elsai-ink/70 text-sm">
            Guide d'utilisation du backoffice. Lecture seule. Non indexé par les moteurs.
          </p>
        </div>
        <span className="rounded-organic bg-slate-200 text-slate-700 px-2 py-1 text-[11px] uppercase">
          noindex
        </span>
      </div>

      <article className="prose-elsai rounded-organic border-elsai-pin/15 bg-white/70 border p-6">
        <MDXRemote source={markdown} />
      </article>
    </div>
  );
}
