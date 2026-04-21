import { NextResponse, type NextRequest } from "next/server";

const TRACKS = new Set(["particuliers", "jeunes", "entreprises"]);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // /blog/{segment} (un seul segment, pas un track connu) → /blog/particuliers/{segment}
  const match = pathname.match(/^\/blog\/([^/]+)\/?$/);
  if (match) {
    const seg = match[1];
    if (!TRACKS.has(seg) && seg.length > 0) {
      const url = req.nextUrl.clone();
      url.pathname = `/blog/particuliers/${seg}`;
      return NextResponse.redirect(url, 301);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/blog/:path*"],
};
