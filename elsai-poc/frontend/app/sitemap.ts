import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { audienceToTrack, fetchPosts, TRACKS } from "@/lib/content";

const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
}[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/comment-ca-marche", priority: 0.9, changeFrequency: "monthly" },
  { path: "/exemples-concrets", priority: 0.9, changeFrequency: "monthly" },
  { path: "/pour-qui", priority: 0.9, changeFrequency: "monthly" },
  { path: "/offre", priority: 0.9, changeFrequency: "monthly" },
  { path: "/ethique", priority: 0.8, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.8, changeFrequency: "monthly" },
  { path: "/partenariats", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.6, changeFrequency: "weekly" },
  { path: "/cgv", priority: 0.3, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/mentions-legales", priority: 0.3, changeFrequency: "yearly" },
  { path: "/start", priority: 0.9, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  const trackEntries: MetadataRoute.Sitemap = TRACKS.map((track) => ({
    url: `${SITE_URL}/blog/${track}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const posts = await fetchPosts({ limit: 1000 });
  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/blog/${audienceToTrack(p.audience)}/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...trackEntries, ...postEntries];
}
