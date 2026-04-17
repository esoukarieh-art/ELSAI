"use client";

import { forgetMe } from "@/lib/api";

export function ForgetButton({ className }: { className?: string }) {
  async function handle() {
    if (!confirm("Supprimer toute la conversation ? Cette action est définitive.")) return;
    try {
      await forgetMe();
    } catch {
      // Session déjà absente : on redirige quand même.
    }
    location.href = "/";
  }

  return (
    <button
      onClick={handle}
      className={className ?? "hover:text-elsai-urgence transition-colors"}
      aria-label="Droit à l'oubli"
    >
      Tout oublier
    </button>
  );
}
