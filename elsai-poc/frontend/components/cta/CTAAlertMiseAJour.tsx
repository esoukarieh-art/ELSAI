"use client";

import { useState } from "react";
import type { CTAProps } from "./types";

export interface CTAAlertMiseAJourProps extends CTAProps {
  updatedAt?: string;
  topicSlug?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export function CTAAlertMiseAJour({
  updatedAt,
  topicSlug,
  audience = "all",
  className,
}: CTAAlertMiseAJourProps) {
  const isMinor = audience === "minor";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dateStr = formatDate(updatedAt);
  const title = dateStr
    ? `Cet article a été mis à jour le ${dateStr}`
    : "Cet article est régulièrement mis à jour";
  const description = isMinor
    ? "Abonne-toi pour recevoir les prochaines mises à jour."
    : "Abonnez-vous pour recevoir les prochaines mises à jour.";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);
    try {
      await fetch(`${API_URL}/api/public/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topic_slug: topicSlug }),
      }).catch(() => null);
      await fetch(`${API_URL}/api/public/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "newsletter_subscribe",
          source: "CTAAlertMiseAJour",
          topic_slug: topicSlug,
        }),
      }).catch(() => null);
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMsg("Une erreur est survenue. Réessayez.");
    }
  }

  return (
    <aside
      data-cta-component="CTAAlertMiseAJour"
      aria-label="Alerte de mise à jour"
      className={`rounded-organic bg-elsai-cream my-6 p-5 ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-elsai-pin font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-slate-700">{description}</p>
        </div>
        {!open && status !== "success" && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-organic bg-elsai-pin text-elsai-cream hover:bg-elsai-pin/90 focus-visible:ring-elsai-pin inline-flex items-center px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            S&apos;abonner aux alertes
          </button>
        )}
      </div>
      {open && status !== "success" && (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="alert-email" className="sr-only">
            Adresse email
          </label>
          <input
            id="alert-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre.email@exemple.fr"
            disabled={status === "loading"}
            className="rounded-organic focus-visible:ring-elsai-pin flex-1 border border-slate-300 px-3 py-2 focus-visible:ring-2 focus-visible:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-organic bg-elsai-pin text-elsai-cream hover:bg-elsai-pin/90 focus-visible:ring-elsai-pin inline-flex items-center px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
          >
            {status === "loading" ? "Envoi…" : "Valider"}
          </button>
        </form>
      )}
      {errorMsg && (
        <p role="alert" className="text-elsai-rose mt-2 text-sm">
          {errorMsg}
        </p>
      )}
      {status === "success" && (
        <p role="status" className="text-elsai-pin mt-2 text-sm font-medium">
          Merci ! Vous serez prévenu·e des prochaines mises à jour.
        </p>
      )}
    </aside>
  );
}
