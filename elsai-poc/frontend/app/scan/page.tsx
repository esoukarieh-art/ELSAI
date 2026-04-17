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
      <div className="bg-elsai-pin h-1 w-full" />
      <header className="border-elsai-pin/10 flex items-center justify-between border-b bg-white/80 px-4 py-3 backdrop-blur">
        <Link href="/chat" className="text-elsai-pin-dark flex items-center gap-2 font-bold">
          <Image src="/logo-elsai.svg" alt="" width={32} height={32} />
          <span>← ELSAI</span>
        </Link>
        <span className="text-elsai-ink/70 text-sm">Analyse de document</span>
      </header>

      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-elsai-pin-dark mb-2 font-serif text-3xl">Scanner un document</h1>
        <p className="text-elsai-ink/75 mb-8 leading-relaxed">
          Prenez en photo un courrier administratif. ELSAI vous l'explique en français simple et
          propose des actions concrètes.
        </p>

        <form
          onSubmit={onSubmit}
          className="rounded-organic border-elsai-pin/15 shadow-organic space-y-4 border bg-white/70 p-5 backdrop-blur"
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="file:rounded-organic file:bg-elsai-pin file:text-elsai-creme file:hover:bg-elsai-pin-dark block w-full text-sm file:mr-4 file:cursor-pointer file:border-0 file:px-4 file:py-2"
          />
          <button
            type="submit"
            disabled={!file || loading}
            className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark px-6 py-3 transition-colors disabled:opacity-40"
          >
            {loading ? "Analyse en cours…" : "Analyser"}
          </button>
        </form>

        {error && (
          <div className="rounded-organic border-elsai-urgence/30 bg-elsai-urgence/10 text-elsai-urgence mt-6 border p-4">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-4">
            <div className="rounded-organic border-elsai-pin/15 shadow-organic border bg-white/80 p-5 backdrop-blur">
              <h2 className="text-elsai-pin-dark mb-2 font-serif text-xl">Explication</h2>
              <p className="text-elsai-ink leading-relaxed whitespace-pre-wrap">
                {result.explanation}
              </p>
            </div>

            {result.suggested_actions.length > 0 && (
              <div className="rounded-organic border-elsai-rose/30 bg-elsai-rose/10 shadow-warm border p-5 backdrop-blur">
                <h2 className="text-elsai-rose-dark mb-3 font-serif text-xl">Actions suggérées</h2>
                <ul className="space-y-2">
                  {result.suggested_actions.map((action, i) => (
                    <li key={i} className="text-elsai-ink flex gap-3">
                      <span className="bg-elsai-rose mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <details className="rounded-organic border-elsai-pin/10 bg-elsai-creme-dark/50 border p-4 text-sm">
              <summary className="text-elsai-ink/70 cursor-pointer font-medium">
                Texte brut détecté (OCR)
              </summary>
              <pre className="text-elsai-ink/80 mt-2 font-mono text-xs whitespace-pre-wrap">
                {result.ocr_text}
              </pre>
            </details>
          </div>
        )}
      </div>
    </main>
  );
}
