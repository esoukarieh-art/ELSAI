"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (ctaKey: string) => void;
}

/**
 * Stub P0.5 — le picker complet (liste CTA seedés, filtres audience) arrive
 * en P0.6. Ici on permet seulement la saisie libre d'une cta_key.
 */
export default function CTAPickerModal({ open, onClose, onPick }: Props) {
  const [key, setKey] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="rounded-organic w-full max-w-md bg-white p-4 shadow-lg">
        <h3 className="text-elsai-pin-dark mb-2 font-serif text-lg">Ajouter un CTA</h3>
        <p className="text-elsai-ink/60 mb-3 text-xs">
          Picker complet en P0.6. Entrez la clé CTA existante (ex.
          <code className="mx-1">cta_inscription_adulte</code>).
        </p>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="cta_key"
          className="rounded-organic border-elsai-pin/20 focus:border-elsai-pin mb-3 w-full border px-3 py-2 text-sm focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-organic border-elsai-pin/20 text-elsai-ink/70 border px-3 py-1 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              if (key.trim()) {
                onPick(key.trim());
                setKey("");
                onClose();
              }
            }}
            className="rounded-organic bg-elsai-pin text-elsai-creme px-3 py-1 text-sm"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
