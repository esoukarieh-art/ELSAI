"use client";

import { useState } from "react";
import { sendFeedback } from "@/lib/api";
import { captureError } from "@/lib/observability";

interface Props {
  conversationId: string;
  onClose: () => void;
  onSent: () => void;
}

export default function FeedbackModal({ conversationId, onClose, onSent }: Props) {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(value: boolean, withComment = false) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await sendFeedback(conversationId, value, withComment ? comment : undefined);
      setDone(true);
      setTimeout(onSent, 1200);
    } catch (err) {
      captureError(err, { where: "FeedbackModal" });
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 backdrop-blur-sm md:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
    >
      <div className="rounded-organic shadow-organic w-full max-w-md bg-white p-6">
        {!done ? (
          <>
            <h2 id="feedback-title" className="text-elsai-pin-dark font-serif text-xl">
              Est-ce que j'ai répondu à votre question&nbsp;?
            </h2>
            <p className="text-elsai-ink/70 mt-2 text-sm">
              Votre retour est anonyme et m'aide à m'améliorer.
            </p>

            {helpful === null ? (
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setHelpful(true)}
                  className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark flex-1 px-4 py-3 font-semibold"
                  disabled={submitting}
                >
                  👍 Oui
                </button>
                <button
                  onClick={() => setHelpful(false)}
                  className="rounded-organic border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/5 flex-1 border px-4 py-3 font-semibold"
                  disabled={submitting}
                >
                  👎 Pas vraiment
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <p className="text-elsai-ink/80 text-sm">
                  {helpful
                    ? "Super, merci. Voulez-vous ajouter un mot ?"
                    : "Désolé. Qu'est-ce qui vous a manqué ?"}
                </p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optionnel — c'est anonyme."
                  rows={3}
                  maxLength={2000}
                  className="rounded-organic border-elsai-pin/20 placeholder:text-elsai-ink/40 focus:ring-elsai-pin/60 w-full border bg-white px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => submit(helpful, true)}
                    disabled={submitting}
                    className="rounded-organic bg-elsai-pin text-elsai-creme hover:bg-elsai-pin-dark flex-1 px-4 py-2 text-sm font-semibold disabled:opacity-40"
                  >
                    Envoyer
                  </button>
                  <button
                    onClick={() => submit(helpful, false)}
                    disabled={submitting}
                    className="rounded-organic border-elsai-pin/30 text-elsai-pin-dark hover:bg-elsai-pin/5 flex-1 border px-4 py-2 text-sm font-semibold disabled:opacity-40"
                  >
                    Envoyer sans commentaire
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="text-elsai-ink/50 hover:text-elsai-ink mt-4 text-xs underline"
              disabled={submitting}
            >
              Plus tard
            </button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-elsai-pin-dark font-serif text-xl">Merci 🙏</p>
            <p className="text-elsai-ink/70 mt-2 text-sm">Votre retour a été pris en compte.</p>
          </div>
        )}
      </div>
    </div>
  );
}
