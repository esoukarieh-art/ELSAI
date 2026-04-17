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
      <header className="bg-white/80 backdrop-blur border-b border-elsai-pin/10 px-4 py-3 flex items-center justify-between">
        <Link href="/chat" className="flex items-center gap-2 text-elsai-pin-dark font-bold">
          <Image src="/logo-elsai.svg" alt="" width={32} height={32} />
          <span>← ELSAI</span>
        </Link>
        <span className="text-sm text-elsai-ink/70">Analyse de document</span>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-serif text-elsai-pin-dark mb-2">
          Scanner un document
        </h1>
        <p className="text-elsai-ink/75 mb-8 leading-relaxed">
          Prenez en photo un courrier administratif. ELSAI vous l'explique en
          français simple et propose des actions concrètes.
        </p>

        <form
          onSubmit={onSubmit}
          className="space-y-4 bg-white/70 backdrop-blur border border-elsai-pin/15 rounded-organic p-5 shadow-organic"
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-organic file:border-0 file:bg-elsai-pin file:text-elsai-creme file:hover:bg-elsai-pin-dark file:cursor-pointer"
          />
          <button
            type="submit"
            disabled={!file || loading}
            className="bg-elsai-pin text-elsai-creme py-3 px-6 rounded-organic shadow-organic hover:bg-elsai-pin-dark transition-colors disabled:opacity-40"
          >
            {loading ? "Analyse en cours…" : "Analyser"}
          </button>
        </form>

        {error && (
          <div className="mt-6 bg-elsai-urgence/10 border border-elsai-urgence/30 text-elsai-urgence p-4 rounded-organic">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-4">
            <div className="bg-white/80 backdrop-blur border border-elsai-pin/15 rounded-organic p-5 shadow-organic">
              <h2 className="font-serif text-xl text-elsai-pin-dark mb-2">
                Explication
              </h2>
              <p className="whitespace-pre-wrap text-elsai-ink leading-relaxed">
                {result.explanation}
              </p>
            </div>

            {result.suggested_actions.length > 0 && (
              <div className="bg-elsai-rose/10 backdrop-blur border border-elsai-rose/30 rounded-organic p-5 shadow-warm">
                <h2 className="font-serif text-xl text-elsai-rose-dark mb-3">
                  Actions suggérées
                </h2>
                <ul className="space-y-2">
                  {result.suggested_actions.map((action, i) => (
                    <li key={i} className="flex gap-3 text-elsai-ink">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-elsai-rose shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <details className="bg-elsai-creme-dark/50 rounded-organic p-4 text-sm border border-elsai-pin/10">
              <summary className="cursor-pointer font-medium text-elsai-ink/70">
                Texte brut détecté (OCR)
              </summary>
              <pre className="whitespace-pre-wrap mt-2 text-elsai-ink/80 font-mono text-xs">
                {result.ocr_text}
              </pre>
            </details>
          </div>
        )}
      </div>
    </main>
  );
}
