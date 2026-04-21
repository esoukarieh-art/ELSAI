"use client";

import { useState } from "react";
import type { CTAProps } from "./types";

export interface CTANewsletterInlineProps extends CTAProps {
  title?: string;
  placeholder?: string;
  successMessage?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function CTANewsletterInline({
  title,
  placeholder,
  successMessage,
  audience = "all",
  className,
}: CTANewsletterInlineProps) {
  const isMinor = audience === "minor";
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const defaultTitle = isMinor
    ? "Reçois nos conseils par mail"
    : "Recevez nos conseils par mail";
  const defaultPlaceholder = "votre.email@exemple.fr";
  const defaultSuccess = isMinor
    ? "Merci ! Vérifie ta boîte mail."
    : "Merci ! Vérifiez votre boîte mail.";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) {
      setErrorMsg("Merci d'accepter le consentement RGPD.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/public/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          audience: audience === "all" ? "adult" : audience,
          consent: true,
          source: "CTANewsletterInline",
        }),
      });
      if (!res.ok) {
        setStatus("error");
        setErrorMsg("Une erreur est survenue. Réessayez.");
        return;
      }
      await fetch(`${API_URL}/api/public/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_type: "newsletter_subscribe", source: "CTANewsletterInline" }),
      }).catch(() => null);
      if (typeof window !== "undefined" && (window as unknown as { plausible?: (e: string) => void }).plausible) {
        (window as unknown as { plausible: (e: string) => void }).plausible("newsletter_subscribe");
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMsg("Une erreur est survenue. Réessayez.");
    }
  }

  if (status === "success") {
    return (
      <aside
        data-cta-component="CTANewsletterInline"
        role="status"
        className={`rounded-organic bg-elsai-cream my-6 p-6 ${className ?? ""}`}
      >
        <p className="text-elsai-pin font-medium">{successMessage ?? defaultSuccess}</p>
      </aside>
    );
  }

  return (
    <aside
      data-cta-component="CTANewsletterInline"
      role="complementary"
      aria-label="Inscription à la newsletter"
      className={`rounded-organic bg-elsai-cream my-6 p-6 ${className ?? ""}`}
    >
      <h3 className="text-elsai-pin font-semibold text-lg">{title ?? defaultTitle}</h3>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="newsletter-email" className="sr-only">
            Adresse email
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder ?? defaultPlaceholder}
            disabled={status === "loading"}
            className="w-full rounded-organic border border-slate-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-elsai-pin"
          />
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
            className="mt-1 focus-visible:ring-2 focus-visible:ring-elsai-pin"
          />
          <span>
            J&apos;accepte de recevoir des emails d&apos;ELSAI. Je peux me désabonner à tout moment.
          </span>
        </label>
        {errorMsg && (
          <p role="alert" className="text-sm text-elsai-rose">
            {errorMsg}
          </p>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center rounded-organic bg-elsai-pin px-4 py-2 text-elsai-cream font-medium hover:bg-elsai-pin/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-elsai-pin focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {status === "loading" ? "Envoi…" : "S'inscrire"}
        </button>
      </form>
    </aside>
  );
}
