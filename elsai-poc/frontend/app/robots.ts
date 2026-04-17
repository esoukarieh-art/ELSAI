import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Les espaces d'usage (chat, dashboard, scan) sont des outils privés,
        // pas du contenu vitrine à indexer.
        disallow: ["/chat", "/dashboard", "/scan", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
