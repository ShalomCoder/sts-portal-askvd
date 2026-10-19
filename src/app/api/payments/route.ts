import { NextResponse } from "next/server";
import { getSessionCookies } from "@/lib/auth";
import { upstreamFetch } from "@/lib/http";
import { parsePaymentHistory } from "@/lib/parsers/history";

export const dynamic = "force-dynamic";

/**
 * Fetches the server-rendered /services/history page upstream and returns
 * parsed payment rows as JSON.
 */
export async function GET() {
  const cookies = await getSessionCookies();
  if (!cookies.sts_session) {
    return NextResponse.json({ unauthenticated: true }, { status: 401 });
  }

  let res: Response;
  try {
    res = await upstreamFetch("/history", { cookies });
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
  const rows = parsePaymentHistory(html);
  return NextResponse.json(
    { rows },
    { headers: { "Cache-Control": "no-store" } },
  );
}
