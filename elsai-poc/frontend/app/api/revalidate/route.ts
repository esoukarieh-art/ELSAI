import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

interface RevalidateBody {
  slug?: string;
  type?: "post" | "sitemap";
}

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  const provided = req.headers.get("x-revalidate-secret");
  if (provided !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: RevalidateBody = {};
  try {
    body = (await req.json()) as RevalidateBody;
  } catch {
    body = {};
  }

  const revalidated: string[] = [];

  if (body.slug) {
    revalidateTag(`post:${body.slug}`, "default");
    revalidated.push(`tag:post:${body.slug}`);
  }

  revalidateTag("posts", "default");
  revalidated.push("tag:posts");

  if (body.type === "sitemap" || body.type === "post") {
    revalidatePath("/sitemap.xml", "page");
    revalidatePath("/blog/rss.xml", "page");
    revalidated.push("path:/sitemap.xml", "path:/blog/rss.xml");
  }

  return NextResponse.json({ ok: true, revalidated });
}
