import { ImageResponse } from "next/og";
import { fetchPost, audienceToTrack, TRACK_META } from "@/lib/content";

export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const post = await fetchPost(slug);

  const title = post?.title ?? "ELSAI";
  const eyebrow =
    post?.hero_eyebrow ?? (post?.tags && post.tags.length > 0 ? post.tags[0] : "ELSAI");
  const track = post ? audienceToTrack(post.audience) : "particuliers";
  const badge = TRACK_META[track].label;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundImage: "linear-gradient(135deg, #5A7E6B 0%, #F5F5ED 100%)",
          fontFamily: "system-ui, sans-serif",
          color: "#1E2A23",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#F5F5ED",
            }}
          >
            ELSAI
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              padding: "10px 22px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.85)",
              color: "#5A7E6B",
            }}
          >
            {badge}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#5A7E6B",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontSize: 62,
              fontWeight: 700,
              lineHeight: 1.15,
              color: "#1E2A23",
              maxWidth: 1000,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        "Cache-Control": "public, immutable, max-age=31536000",
      },
    },
  );
}
