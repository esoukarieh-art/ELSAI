"use client";

import { useState } from "react";
import { createOptionalAccount, loginOptionalAccount, setSession } from "@/lib/api";
import { captureError } from "@/lib/observability";

interface Props {
  conversationId?: string;
  onClose: () => void;
  onSuccess: (pseudo: string) => void;
  initialMode?: "create" | "login";
}

export default function AccountModal({
  conversationId,
  onClose,
  onSuccess,
  initialMode = "create",
}: Props) {
  const [mode, setMode] = useState<"create" | "login">(initialMode);
  const [pseudo, setPseudo] = useState("");
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data =
        mode === "create"
          ? await createOptionalAccount(pseudo.trim(), phrase, conversationId)
          : await loginOptionalAccount(pseudo.trim(), phrase);
      setSession(data.token, data.token, "adult");
      onSuccess(data.pseudo);
    } catch (err) {
      captureError(err, { where: "AccountModal", mode });
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
    >
      <form
        onSubmit={submit}
        className="rounded-organic shadow-organic w-full max-w-md bg-white p-6"
      >
        <h2 className="text-elsai-pin-dark font-serif text-xl">
          {mode === "create" ? "Sauvegarder cette conversation" : "Retrouver mes conversations"}
        </h2>
        <p className="text-elsai-ink/70 mt-2 text-sm">
          {mode === "create"
            ? "Choisis un pseudo et une phrase secrète. Aucun email demandé. Phrase perdue = compte perdu — c'est volontaire pour ton anonymat."
            : "Entre ton pseudo et ta phrase secrète."}
        </p>

        <div className="mt-4 space-y-3">
          <input
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Pseudo (ex. PinDeMer42)"
            minLength={3}
            maxLength={64}
            required
            autoComplete="off"
            className="rounded-organic border-elsai-pin/20 w-full border px-3 py-2"
          />
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            type="password"
            placeholder="Phrase secrète (12 caractères min)"
            minLength={12}
            maxLength={200}
            required
            autoComplete="new-password"
            className="rounded-organic border-elsai-pin/20 w-full border px-3 py-2"
          />
        </div>

        {error && <p className="text-elsai-rose-dark mt-3 text-sm">⚠️ {error}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark px-5 py-2 font-semibold disabled:opacity-40"
          >
            {mode === "create" ? "Créer le compte" : "Se reconnecter"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "create" ? "login" : "create")}
            className="text-elsai-ink/70 text-sm underline"
          >
            {mode === "create" ? "J'ai déjà un compte" : "Créer un compte"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-elsai-ink/50 ml-auto text-sm hover:underline"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
