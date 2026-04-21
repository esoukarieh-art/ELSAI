"use client";

import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface PlausibleFn {
  (event: string, options?: { props?: Record<string, string> }): void;
}

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

export interface CTATrackingClientProps {
  blockKey: string;
  variant: string;
  postSlug?: string;
}

/**
 * Envoie un event "view" au mount + écoute les clics sur le parent
 * [data-cta-key="{blockKey}"] pour émettre "cta_click".
 * Plausible optionnel (si window.plausible).
 */
export function CTATrackingClient({
  blockKey,
  variant,
  postSlug,
}: CTATrackingClientProps) {
  useEffect(() => {
    const post = postSlug ?? (typeof window !== "undefined" ? window.location.pathname : "");

    // 1) view au mount
    fetch(`${API_URL}/api/public/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_slug: post,
        event_type: "view",
        variant: `${blockKey}:${variant}`,
      }),
      keepalive: true,
    }).catch(() => null);

    // 2) listener clic sur le parent
    const parent = document.querySelector<HTMLElement>(
      `[data-cta-key="${blockKey}"]`,
    );
    if (!parent) return;

    const onClick = () => {
      fetch(`${API_URL}/api/public/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_slug: post,
          event_type: "cta_click",
          variant: `${blockKey}:${variant}`,
        }),
        keepalive: true,
      }).catch(() => null);

      if (typeof window !== "undefined" && window.plausible) {
        window.plausible("CTA Click", {
          props: { key: blockKey, variant },
        });
      }
    };

    parent.addEventListener("click", onClick);
    return () => parent.removeEventListener("click", onClick);
  }, [blockKey, variant, postSlug]);

  return null;
}
