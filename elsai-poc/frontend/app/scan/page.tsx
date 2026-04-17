"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { analyzeDocument, type DocumentAnalyzeResponse } from "@/lib/api";

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocumentAnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeDocument(file);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="h-1 w-full bg-elsai-pin" />
      <header className="flex items-center justify-between border-b border-elsai-pin/10 bg-white/80 px-4 py-3 backdrop-blur">
        <Link href="/chat" className="flex items-center gap-2 font-bold text-elsai-pin-dark">
          <Image src="/logo-elsai.svg" alt="" width={32} height={32} />
          <span>← ELSAI</span>
        </Link>
        <span className="text-sm text-elsai-ink/70">Analyse de document</span>
      </header>

      <div className="mx-auto max-w-2xl p-6">
        <h1 className="mb-2 font-serif text-3xl text-elsai-pin-dark">Scanner un document</h1>
        <p className="mb-8 leading-relaxed text-elsai-ink/75">
          Prenez en photo un courrier administratif. ELSAI vous l'explique en français simple et
          propose des actions concrètes.
        </p>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-organic border border-elsai-pin/15 bg-white/70 p-5 shadow-organic backdrop-blur"
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-4 file:cursor-pointer file:rounded-organic file:border-0 file:bg-elsai-pin file:px-4 file:py-2 file:text-elsai-creme file:hover:bg-elsai-pin-dark"
          />
          <button
            type="submit"
            disabled={!file || loading}
            className="rounded-organic bg-elsai-pin px-6 py-3 text-elsai-creme shadow-organic transition-colors hover:bg-elsai-pin-dark disabled:opacity-40"
          >
            {loading ? "Analyse en cours…" : "Analyser"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-organic border border-elsai-urgence/30 bg-elsai-urgence/10 p-4 text-elsai-urgence">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-4">
            <div className="rounded-organic border border-elsai-pin/15 bg-white/80 p-5 shadow-organic backdrop-blur">
              <h2 className="mb-2 font-serif text-xl text-elsai-pin-dark">Explication</h2>
              <p className="whitespace-pre-wrap leading-relaxed text-elsai-ink">
                {result.explanation}
              </p>
            </div>

            {result.suggested_actions.length > 0 && (
              <div className="rounded-organic border border-elsai-rose/30 bg-elsai-rose/10 p-5 shadow-warm backdrop-blur">
                <h2 className="mb-3 font-serif text-xl text-elsai-rose-dark">Actions suggérées</h2>
                <ul className="space-y-2">
                  {result.suggested_actions.map((action, i) => (
                    <li key={i} className="flex gap-3 text-elsai-ink">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-elsai-rose" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <details className="rounded-organic border border-elsai-pin/10 bg-elsai-creme-dark/50 p-4 text-sm">
              <summary className="cursor-pointer font-medium text-elsai-ink/70">
                Texte brut détecté (OCR)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-elsai-ink/80">
                {result.ocr_text}
              </pre>
            </details>
          </div>
        )}
      </div>
    </main>
  );
}
