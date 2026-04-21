import { CTA_REGISTRY } from "./registry";
import { CTATrackingClient } from "./CTATrackingClient";
import type { CTAResolvedResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface CTABlockRenderProps {
  blockKey: string;
  postSlug?: string;
  overrides?: Record<string, unknown>;
}

/**
 * Server Component async.
 *
 * 1. Résout la variante active via /api/public/ctas/{blockKey} (no-store pour A/B)
 * 2. Merge props DB + overrides
 * 3. Rend le composant du registry, enrobé pour le tracking
 */
export async function CTABlockRender({
  blockKey,
  postSlug,
  overrides,
}: CTABlockRenderProps) {
  let data: CTAResolvedResponse | null = null;
  try {
    const res = await fetch(`${API_URL}/api/public/ctas/${blockKey}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    data = (await res.json()) as CTAResolvedResponse;
  } catch {
    return null;
  }
  if (!data) return null;

  const Component = CTA_REGISTRY[data.component];
  if (!Component) {
    // eslint-disable-next-line no-console
    console.warn(`[CTABlockRender] composant inconnu: ${data.component}`);
    return null;
  }

  const props = {
    ...(data.props ?? {}),
    ...(overrides ?? {}),
    audience: (overrides?.audience as string | undefined) ?? data.audience,
    variant: data.variant,
    blockKey,
  };

  return (
    <span data-cta-key={blockKey} data-variant={data.variant}>
      <Component {...props} />
      <CTATrackingClient
        blockKey={blockKey}
        variant={data.variant}
        postSlug={postSlug}
      />
    </span>
  );
}
