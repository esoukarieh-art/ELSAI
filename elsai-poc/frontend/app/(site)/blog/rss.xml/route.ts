import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/seo";
import { audienceToTrack, fetchPosts, type PublicPostSummary } from "@/lib/content";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function itemXml(p: PublicPostSummary): string {
  const track = audienceToTrack(p.audience);
  const link = `${SITE_URL}/blog/${track}/${p.slug}`;
  const pubDate = p.published_at
    ? new Date(p.published_at).toUTCString()
    : new Date().toUTCString();
  return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(p.description ?? "")}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(p.audience)}</category>
    </item>`;
}

export async function GET(): Promise<Response> {
  const posts = await fetchPosts({ limit: 1000 });
  const items = posts.map(itemXml).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ELSAI Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Décryptages et ressources sociales ELSAI</description>
    <language>fr-FR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
