"use client";

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
      <header className="bg-elsai-primary text-white px-4 py-3 flex items-center justify-between">
        <Link href="/chat" className="font-bold">← ELSAI</Link>
        <span className="text-sm">Analyse de document</span>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Scanner un document</h1>
        <p className="text-gray-600 mb-6">
          Prenez en photo un courrier administratif. ELSAI vous l'explique en français simple
          et propose des actions concrètes.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-elsai-primary file:text-white"
          />
          <button
            type="submit"
            disabled={!file || loading}
            className="bg-elsai-primary text-white py-3 px-6 rounded-xl disabled:opacity-50"
          >
            {loading ? "Analyse en cours…" : "Analyser"}
          </button>
        </form>

        {error && (
          <div className="mt-6 bg-red-100 border border-red-300 text-red-800 p-4 rounded-xl">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="font-bold text-elsai-primary mb-2">Explication</h2>
              <p className="whitespace-pre-wrap">{result.explanation}</p>
            </div>

            {result.suggested_actions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h2 className="font-bold text-elsai-primary mb-2">Actions suggérées</h2>
                <ul className="list-disc pl-5 space-y-1">
                  {result.suggested_actions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            <details className="bg-gray-100 rounded-xl p-4 text-sm">
              <summary className="cursor-pointer font-medium">Texte brut détecté (OCR)</summary>
              <pre className="whitespace-pre-wrap mt-2 text-gray-700">{result.ocr_text}</pre>
            </details>
          </div>
        )}
      </div>
    </main>
  );
}
