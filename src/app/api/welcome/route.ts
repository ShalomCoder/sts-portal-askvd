import { NextResponse } from "next/server";
import { getSessionCookies } from "@/lib/auth";
import { upstreamFetch } from "@/lib/http";
import { parseWelcome } from "@/lib/parsers/welcome";

export const dynamic = "force-dynamic";

/**
 * Parses the server-rendered welcome page: student name, greeting and
 * immediately-visible alert banners.
 */
export async function GET() {
  const cookies = await getSessionCookies();
  if (!cookies.sts_session) {
    return NextResponse.json({ unauthenticated: true }, { status: 401 });
  }

  let res: Response;
  try {
    res = await upstreamFetch("/welcome", { cookies });
  } catch {
    return NextResponse.json(
      { message: "Could not reach STS upstream" },
      { status: 502 },
    );
  }

  if (res.status === 301 || res.status === 302 || res.status === 303) {
    return NextResponse.json({ unauthenticated: true }, { status: 401 });
  }

  const html = await res.text();
  const data = parseWelcome(html);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
