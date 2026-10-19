import { NextResponse } from "next/server";
import { getSessionCookies } from "@/lib/auth";
import { upstreamFetch } from "@/lib/http";
import { parseProfile } from "@/lib/parsers/profile";

export const dynamic = "force-dynamic";

/**
 * Fetches the server-rendered /services/profile page upstream and returns
 * parsed {fields, photo} JSON. 302 upstream -> 401 for the client.
 */
export async function GET() {
  const cookies = await getSessionCookies();
  if (!cookies.sts_session) {
    return NextResponse.json({ unauthenticated: true }, { status: 401 });
  }

  let res: Response;
  try {
    res = await upstreamFetch("/profile", { cookies });
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
  const profile = parseProfile(html);
  return NextResponse.json(profile, {
    headers: { "Cache-Control": "no-store" },
  });
}
