import { NextRequest, NextResponse } from "next/server";
import {
  extractSetCookies,
  relaySetCookieHeader,
  upstreamFetch,
} from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * PUBLIC (pre-login) forgot Student ID / PIN submission.
 *
 * Mirrors the upstream modal on the login page:
 *   GET  /services/            -> fresh session + CSRF token
 *   POST /services/saveforgotpin (multipart/form-data)
 *
 * WARNING: this is a mutating endpoint and is deliberately UNTESTED.
 * It forwards exactly the fields the original form collects (including the
 * `website` honeypot, which must stay empty) plus the required ID upload.
 */
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ message: "Invalid form data" }, { status: 400 });
  }

  const status = String(form.get("student_status") ?? "");
  if (!status) {
    return NextResponse.json(
      { message: "Please choose your current student status" },
      { status: 400 },
    );
  }
  // Upstream behaviour: continuing students must use MISWeb instead.
  if (status === "Continuing") {
    return NextResponse.json(
      {
        message:
          "Continuing students must reset their PIN via MISWeb (ienabler.ug.edu.gh).",
        misweb: "https://ienabler.ug.edu.gh/pls/prodi41/w99pkg.mi_login",
      },
      { status: 400 },
    );
  }

  // --- Step 1: fresh public session + CSRF token ----------------------
  const page = await upstreamFetch("/", {});
  const html = await page.text();
  const tokenMatch =
    html.match(/<input[^>]+name="_token"[^>]+value="([^"]+)"/) ??
    html.match(/<input[^>]+value="([^"]+)"[^>]+name="_token"/);
  if (!tokenMatch) {
    return NextResponse.json(
      { message: "Could not reach STS. Try again later." },
      { status: 502 },
    );
  }
  const csrf = tokenMatch[1];
  const step1Cookies = extractSetCookies(page);
  const jar: { sts_session?: string; xsrf?: string } = {};
  for (const c of step1Cookies) {
    if (c.name === "sts_session") jar.sts_session = c.value;
    if (c.name === "XSRF-TOKEN") jar.xsrf = c.value;
  }

  // --- Step 2: forward the multipart form verbatim --------------------
  const out = new FormData();
  for (const [key, value] of form.entries()) {
    if (key === "_token") continue; // always use the fresh token
    if (value instanceof File && value.size === 0) continue;
    out.append(key, value);
  }
  out.append("_token", csrf);
  if (!form.has("website")) out.append("website", ""); // honeypot

  let res: Response;
  try {
    res = await upstreamFetch("/saveforgotpin", {
      method: "POST",
      body: out,
      cookies: jar,
      headers: { Referer: "https://sts.ug.edu.gh/services/" },
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach STS upstream" },
      { status: 502 },
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  const setCookies = extractSetCookies(res);

  if (res.status >= 300 && res.status < 400) {
    const next = NextResponse.json({
      status: "success",
      message: "Request submitted. Watch your email for further instructions.",
    });
    for (const c of setCookies) {
      if (c.name === "sts_session" || c.name === "XSRF-TOKEN") {
        next.headers.append("Set-Cookie", relaySetCookieHeader(c));
      }
    }
    return next;
  }

  if (contentType.includes("application/json")) {
    const data = await res.json().catch(() => null);
    const next = NextResponse.json(data ?? { status: "error" }, {
      status: res.status,
    });
    for (const c of setCookies) {
      if (c.name === "sts_session" || c.name === "XSRF-TOKEN") {
        next.headers.append("Set-Cookie", relaySetCookieHeader(c));
      }
    }
    return next;
  }

  // HTML response: pass it through as text so callers can inspect outcome.
  const text = await res.text();
  return NextResponse.json(
    { status: res.ok ? "success" : "error", html: text.slice(0, 4000) },
    { status: res.status },
  );
}
