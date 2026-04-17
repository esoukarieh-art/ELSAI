import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const ROUTES: {
  path: string;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
}[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/comment-ca-marche", priority: 0.9, changeFrequency: "monthly" },
  { path: "/cas-usage", priority: 0.9, changeFrequency: "monthly" },
  { path: "/pour-qui", priority: 0.9, changeFrequency: "monthly" },
  { path: "/ethique", priority: 0.8, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.8, changeFrequency: "monthly" },
  { path: "/partenariats", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.6, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/mentions-legales", priority: 0.3, changeFrequency: "yearly" },
  { path: "/start", priority: 0.9, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
