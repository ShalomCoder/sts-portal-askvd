import { NextRequest, NextResponse } from "next/server";
import { getSessionCookies } from "@/lib/auth";
import {
  STS_BASE,
  extractSetCookies,
  relaySetCookieHeader,
  upstreamFetch,
  type UpstreamCookies,
} from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Generic same-origin proxy: /api/sts/<path...>?query
 *
 * - GET: passes through JSON/HTML/PDF responses; upstream 301/302/303 -> 401
 *   {unauthenticated:true} so the client can bounce to /login.
 * - POST/PUT/PATCH: accepts JSON or urlencoded bodies. When the body has no
 *   `_token`, a fresh CSRF token is scraped from an upstream HTML page
 *   (same session) and injected automatically.
 * - Upstream Set-Cookie values are relayed to keep the session fresh.
 */

async function scrapeCsrf(cookies: UpstreamCookies): Promise<string | null> {
  // Any session HTML page carries the session's _token; welcome is safe post-login.
  const res = await upstreamFetch("/welcome", { cookies });
  if (res.status === 302 || res.status === 301) return null;
  const html = await res.text();
  const m =
    html.match(/<input[^>]+name="_token"[^>]+value="([^"]+)"/) ??
    html.match(/<input[^>]+value="([^"]+)"[^>]+name="_token"/);
  return m?.[1] ?? null;
}

function relayCookies(next: NextResponse, res: Response) {
  for (const c of extractSetCookies(res)) {
    if (c.name === "sts_session" || c.name === "XSRF-TOKEN") {
      next.headers.append("Set-Cookie", relaySetCookieHeader(c));
    }
  }
}

async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const cookies = await getSessionCookies();
  if (!cookies.sts_session) {
    return NextResponse.json({ unauthenticated: true }, { status: 401 });
  }

  const url = new URL(req.url);
  const upstreamPath = `/${path.join("/")}${url.search}`;
  const method = req.method;

  let init: RequestInit & { cookies?: UpstreamCookies } = { method, cookies };
  let bodyNeedsToken = false;

  if (method !== "GET" && method !== "HEAD") {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = (await req.json()) as Record<string, unknown>;
      if (!("_token" in json)) bodyNeedsToken = true;
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(json)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) {
          for (const item of v) params.append(k, String(item));
        } else {
          params.set(k, String(v));
        }
      }
      init.body = params.toString();
      init.headers = { "Content-Type": "application/x-www-form-urlencoded" };
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const raw = await req.text();
      if (!raw.includes("_token")) bodyNeedsToken = true;
      init.body = raw;
      init.headers = { "Content-Type": "application/x-www-form-urlencoded" };
    } else if (contentType.includes("multipart/form-data")) {
      // Multipart passthrough (exam complaints with evidence files, etc.)
      const form = await req.formData();
      if (!form.has("_token")) bodyNeedsToken = true;
      init.body = form; // fetch serializes FormData with its own boundary
    } else {
      return NextResponse.json(
        { message: `Unsupported content type: ${contentType || "(none)"}` },
        { status: 415 },
      );
    }
  }

  if (bodyNeedsToken) {
    const token = await scrapeCsrf(cookies);
    if (!token) {
      return NextResponse.json({ unauthenticated: true }, { status: 401 });
    }
    if (init.body instanceof FormData) {
      init.body.set("_token", token);
    } else {
      const sep = init.body ? "&" : "";
      init.body = `${init.body ?? ""}${sep}_token=${encodeURIComponent(token)}`;
    }
  }

  let res: Response;
  try {
    res = await upstreamFetch(upstreamPath, init);
  } catch {
    return NextResponse.json(
      { message: "Could not reach STS upstream" },
      { status: 502 },
    );
  }

  const contentType = res.headers.get("content-type") ?? "";

  // JSON/API endpoints redirect only when the session died -> 401 so the
  // client can bounce to /login. (HTML page GETs keep their redirect info.)
  if (res.status === 301 || res.status === 302 || res.status === 303) {
    const location = res.headers.get("location") ?? "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json(
        { unauthenticated: true, _redirect: location },
        { status: 401 },
      );
    }
    // HTML redirect: relay it as an explicit marker instead of following
    // upstream (the browser would land on sts.ug.edu.gh directly).
    const next = NextResponse.json(
      { _redirect: location },
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
    relayCookies(next, res);
    return next;
  }

  let next: NextResponse;

  if (contentType.includes("application/json")) {
    const text = await res.text();
    next = new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } else if (
    contentType.includes("text/html") ||
    contentType.includes("text/plain")
  ) {
    const text = await res.text();
    next = new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } else {
    // Binary passthrough (PDF receipts, images...)
    const buf = await res.arrayBuffer();
    next = new NextResponse(buf, {
      status: res.status,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
      },
    });
  }

  relayCookies(next, res);
  return next;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, (await params).path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, (await params).path);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, (await params).path);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, (await params).path);
}
