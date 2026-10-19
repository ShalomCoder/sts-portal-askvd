import { NextRequest, NextResponse } from "next/server";
import {
  STS_BASE,
  UA,
  UPSTREAM_FORM,
  extractSetCookies,
  relaySetCookieHeader,
  upstreamFetch,
} from "@/lib/http";
import { AUTH_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

type LoginBody = {
  student_id?: string;
  pin?: string;
  loginas?: "student" | "staff";
};

/**
 * Two-step Laravel login, performed server-side:
 *  1. GET  /services/            -> session cookie + CSRF _token from #login form
 *  2. POST /services/authenticate -> {status, responseurl | message}
 * Upstream Set-Cookie values are relayed to *our* browser (same-origin),
 * plus our own `sts_auth` marker used by middleware.
 */
export async function POST(req: NextRequest) {
  let body: LoginBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const studentId = (body.student_id ?? "").trim();
  const pin = (body.pin ?? "").trim();
  const loginas = body.loginas === "staff" ? "staff" : "student";

  if (!studentId || !pin) {
    return NextResponse.json(
      { message: "Student ID and PIN are required" },
      { status: 400 },
    );
  }

  // --- Step 1: fetch login page for session + CSRF token -------------
  const page = await upstreamFetch("/", {
    headers: { Accept: UPSTREAM_FORM },
  });

  const html = await page.text();
  const tokenMatch = html.match(
    /<input[^>]+name="_token"[^>]+value="([^"]+)"/,
  ) ?? html.match(/<input[^>]+value="([^"]+)"[^>]+name="_token"/);

  if (!tokenMatch) {
    return NextResponse.json(
      { message: "Could not reach STS (no CSRF token). Try again later." },
      { status: 502 },
    );
  }
  const csrf = tokenMatch[1];
  const step1Cookies = extractSetCookies(page);

  // Build the upstream cookie jar from what the login page set.
  const jar: { sts_session?: string; xsrf?: string } = {};
  for (const c of step1Cookies) {
    if (c.name === "sts_session") jar.sts_session = c.value;
    if (c.name === "XSRF-TOKEN") jar.xsrf = c.value;
  }

  // --- Step 2: POST authenticate --------------------------------------
  const form = new URLSearchParams({
    _token: csrf,
    loginas,
    student_id: studentId,
    pin,
  });

  const res = await upstreamFetch("/authenticate", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json, text/javascript, */*; q=0.01",
      Referer: `${STS_BASE}/`,
      Origin: "https://sts.ug.edu.gh",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": UA,
    },
    body: form.toString(),
    cookies: jar,
  });

  const setCookies = extractSetCookies(res);
  for (const c of setCookies) {
    if (c.name === "sts_session") jar.sts_session = c.value;
    if (c.name === "XSRF-TOKEN") jar.xsrf = c.value;
  }

  let data: { status?: string; message?: string; responseurl?: string };
  try {
    data = await res.json();
  } catch {
    return NextResponse.json(
      { message: "Unexpected response from STS. Try again later." },
      { status: 502 },
    );
  }

  if (data.status !== "success") {
    return NextResponse.json(
      { message: data.message || "Invalid Student ID or PIN" },
      { status: 401 },
    );
  }

  // --- Success: relay upstream cookies + our auth marker --------------
  // Read-only extra fetch: scrape the display name from the welcome page
  // so the portal chrome can show it (stored url-encoded; may contain commas).
  let displayName = "";
  try {
    const welcome = await upstreamFetch("/welcome", { cookies: jar });
    if (welcome.ok) {
      const whtml = await welcome.text();
      const m = whtml.match(
        /Good (?:Morning|Afternoon|Evening)\s+(.+?)\s+and Welcome/i,
      );
      if (m) displayName = m[1].trim();
    }
  } catch {
    // non-fatal — chrome just falls back to the avatar initial
  }

  const next = NextResponse.json({
    status: "success",
    responseurl: data.responseurl,
    name: displayName || null,
  });

  // Relay all Set-Cookie headers we collected (login page + authenticate),
  // de-duplicated by name with the newest value winning.
  const relayed = new Map<string, { name: string; value: string; attrs: string }>();
  for (const c of [...step1Cookies, ...setCookies]) relayed.set(c.name, c);
  for (const c of relayed.values()) {
    if (c.name !== "sts_session" && c.name !== "XSRF-TOKEN") continue;
    next.headers.append("Set-Cookie", relaySetCookieHeader(c));
  }
  next.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=21600`,
  );
  if (displayName) {
    next.headers.append(
      "Set-Cookie",
      `sts_name=${encodeURIComponent(displayName)}; Path=/; SameSite=Lax; Max-Age=21600`,
    );
  }
  return next;
}
