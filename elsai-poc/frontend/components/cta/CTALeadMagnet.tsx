"use client";

import { useState } from "react";
import type { CTAProps } from "./types";

export interface CTALeadMagnetProps extends CTAProps {
  magnetKey: string;
  title?: string;
  description?: string;
  pdfUrl?: string;
}

interface SubscribeResponse {
  ok: boolean;
  lead_magnet_url?: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function CTALeadMagnet({
  magnetKey,
  title,
  description,
  pdfUrl,
  audience = "all",
  className,
}: CTALeadMagnetProps) {
  const isMinor = audience === "minor";
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(pdfUrl ?? null);

  const defaultTitle = "Recevez le guide gratuit";
  const defaultDescription = isMinor
    ? "Laisse ton email pour recevoir le guide en PDF."
    : "Laissez votre email pour recevoir le guide en PDF.";

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
          lead_magnet_key: magnetKey,
          consent: true,
          source: "CTALeadMagnet",
        }),
      });
      if (!res.ok) {
        setStatus("error");
        setErrorMsg("Une erreur est survenue. Réessayez.");
        return;
      }
      const data = (await res.json()) as SubscribeResponse;
      const resolvedUrl = data.lead_magnet_url ?? pdfUrl ?? null;
      setDownloadUrl(resolvedUrl);
      await fetch(`${API_URL}/api/public/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "newsletter_subscribe",
          source: "CTALeadMagnet",
          magnet_key: magnetKey,
        }),
      }).catch(() => null);
      if (typeof window !== "undefined" && (window as unknown as { plausible?: (e: string) => void }).plausible) {
        (window as unknown as { plausible: (e: string) => void }).plausible("lead_magnet_download");
      }
      setStatus("success");
      if (resolvedUrl && typeof window !== "undefined") {
        window.open(resolvedUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Une erreur est survenue. Réessayez.");
    }
  }

  if (status === "success") {
    return (
      <aside
        data-cta-component="CTALeadMagnet"
        data-magnet-key={magnetKey}
        role="status"
        className={`rounded-organic bg-elsai-cream my-6 p-6 ${className ?? ""}`}
      >
        <p className="text-elsai-pin font-medium">
          Merci ! Le téléchargement démarre.{" "}
          {downloadUrl && (
            <a href={downloadUrl} className="underline decoration-elsai-rose" target="_blank" rel="noopener noreferrer">
              Cliquez ici si rien ne se passe.
            </a>
          )}
        </p>
      </aside>
    );
  }

  return (
    <aside
      data-cta-component="CTALeadMagnet"
      data-magnet-key={magnetKey}
      role="complementary"
      aria-label={title ?? defaultTitle}
      className={`rounded-organic bg-elsai-cream my-6 p-6 ${className ?? ""}`}
    >
      <h3 className="text-elsai-pin font-semibold text-lg">{title ?? defaultTitle}</h3>
      <p className="mt-1 text-sm text-slate-700">{description ?? defaultDescription}</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label htmlFor={`magnet-email-${magnetKey}`} className="sr-only">
            Adresse email
          </label>
          <input
            id={`magnet-email-${magnetKey}`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre.email@exemple.fr"
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
          <span>J&apos;accepte de recevoir le guide et des emails d&apos;ELSAI.</span>
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
          {status === "loading" ? "Envoi…" : "Recevoir le guide"}
        </button>
      </form>
    </aside>
  );
}
