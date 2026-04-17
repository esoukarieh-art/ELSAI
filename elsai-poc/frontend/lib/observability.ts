/**
 * Observabilité frontend — wrapper Sentry optionnel.
 *
 * Chargé côté client uniquement si `NEXT_PUBLIC_SENTRY_DSN` est défini.
 * Sans DSN : no-op silencieux (dev local).
 *
 * Contraintes ELSAI :
 *  - Aucune PII envoyée (pas d'IP, pas de body user, pas de replay).
 *  - Masquer tous les inputs et textes par défaut.
 */

type SentryLike = {
  captureException: (err: unknown, context?: Record<string, unknown>) => void;
  addBreadcrumb: (breadcrumb: Record<string, unknown>) => void;
};

let sentry: SentryLike | null = null;
let initPromise: Promise<void> | null = null;

async function loadSentry(): Promise<void> {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || typeof window === "undefined") return;

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "dev",
      release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
      sendDefaultPii: false,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      beforeSend(event) {
        // Strip potentiels contenus message utilisateur
        if (event.request?.data) delete event.request.data;
        if (event.extra?.message) delete event.extra.message;
        return event;
      },
    });
    sentry = Sentry as unknown as SentryLike;
  } catch {
    // Sentry non installé : dégradation silencieuse
  }
}

export function initObservability(): void {
  if (initPromise) return;
  initPromise = loadSentry();
}

export function captureError(err: unknown, context?: Record<string, unknown>): void {
  // Fallback toujours actif
  if (typeof console !== "undefined") {
    console.error("[elsai]", err, context ?? {});
  }
  sentry?.captureException(err, context);
}

export function addBreadcrumb(category: string, data?: Record<string, unknown>): void {
  sentry?.addBreadcrumb({ category, level: "info", data });
}
