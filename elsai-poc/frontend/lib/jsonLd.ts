import { SITE_NAME, SITE_URL } from "./seo";
import type { PublicPostDetail } from "./content";
import { AUDIENCE_TO_TRACK } from "./content";

const PUBLISHER = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo.png`,
  },
};

function postUrl(post: PublicPostDetail): string {
  const track = AUDIENCE_TO_TRACK[post.audience] ?? "particuliers";
  return `${SITE_URL}/blog/${track}/${post.slug}`;
}

function parseExtra(post: PublicPostDetail): Record<string, unknown> {
  try {
    const obj = JSON.parse(post.schema_extra_json || "{}");
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

export function buildArticleJsonLd(post: PublicPostDetail): object {
  const url = postUrl(post);
  return {
    "@context": "https://schema.org",
    "@type": post.schema_type === "BlogPosting" ? "BlogPosting" : "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: post.seo_title ?? post.title,
    description: post.seo_description ?? post.description,
    image: post.og_image_url ? [post.og_image_url] : undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.published_at ?? undefined,
    author: post.author_display
      ? { "@type": "Person", name: post.author_display }
      : { "@type": "Organization", name: SITE_NAME },
    publisher: PUBLISHER,
    keywords: post.tags.join(", ") || undefined,
  };
}

export function buildHowToJsonLd(post: PublicPostDetail): object | null {
  const extra = parseExtra(post);
  const steps = Array.isArray(extra.steps) ? (extra.steps as { name?: string; text?: string }[]) : null;
  if (!steps || steps.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: post.title,
    description: post.description,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name ?? `Étape ${i + 1}`,
      text: s.text ?? "",
    })),
  };
}

export function buildFAQPageJsonLd(post: PublicPostDetail): object | null {
  const extra = parseExtra(post);
  const faq = Array.isArray(extra.faq) ? (extra.faq as { q?: string; a?: string }[]) : null;
  if (!faq || faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q ?? "",
      acceptedAnswer: { "@type": "Answer", text: item.a ?? "" },
    })),
  };
}

export function buildGovernmentServiceJsonLd(post: PublicPostDetail): object | null {
  const extra = parseExtra(post);
  const svc = extra.governmentService as Record<string, unknown> | undefined;
  if (!svc) return null;
  return {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    ...svc,
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function buildJsonLd(
  post: PublicPostDetail,
  breadcrumb: { name: string; url: string }[],
): object[] {
  const out: object[] = [];
  const schema = post.schema_type;
  if (schema === "HowTo") {
    const h = buildHowToJsonLd(post);
    if (h) out.push(h);
    else out.push(buildArticleJsonLd(post));
  } else if (schema === "FAQPage") {
    const f = buildFAQPageJsonLd(post);
    if (f) out.push(f);
    else out.push(buildArticleJsonLd(post));
  } else if (schema === "GovernmentService") {
    const g = buildGovernmentServiceJsonLd(post);
    if (g) out.push(g);
    else out.push(buildArticleJsonLd(post));
  } else {
    out.push(buildArticleJsonLd(post));
  }
  // Toujours ajouter breadcrumb
  out.push(buildBreadcrumbJsonLd(breadcrumb));
  return out;
}
