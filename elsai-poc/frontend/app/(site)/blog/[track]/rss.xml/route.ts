import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/seo";
import {
  audienceToTrack,
  fetchPosts,
  TRACKS,
  TRACK_META,
  type PublicPostSummary,
  type Track,
} from "@/lib/content";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ track: string }> },
): Promise<Response> {
  const { track } = await params;
  if (!TRACKS.includes(track as Track)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const typedTrack = track as Track;
  const meta = TRACK_META[typedTrack];
  const posts = await fetchPosts({ track: typedTrack, limit: 1000 });
  const items = posts.map(itemXml).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ELSAI Blog — ${escapeXml(meta.label)}</title>
    <link>${SITE_URL}/blog/${typedTrack}</link>
    <description>${escapeXml(meta.description)}</description>
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
