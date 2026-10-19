export const STS_BASE =
  process.env.STS_BASE ?? "https://sts.ug.edu.gh/services";

export const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

export const UPSTREAM_FORM =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

/** Session cookies received from upstream (our server holds them per request via the browser's relay cookies). */
export type UpstreamCookies = {
  sts_session?: string;
  xsrf?: string;
};

/** Parse the Cookie header our browser sends us into upstream components. */
export function readRelayCookies(cookieHeader: string | null): UpstreamCookies {
  const out: UpstreamCookies = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === "sts_session" && v) out.sts_session = v;
    if (k === "XSRF-TOKEN" && v) out.xsrf = decodeURIComponent(v);
  }
  return out;
}

export function buildUpstreamCookie(c: UpstreamCookies): string {
  const parts: string[] = [];
  if (c.sts_session) parts.push(`sts_session=${c.sts_session}`);
  if (c.xsrf) parts.push(`XSRF-TOKEN=${encodeURIComponent(c.xsrf)}`);
  return parts.join("; ");
}

/**
 * Issue a request to the upstream STS server.
 * - redirect: "manual" so we can translate Laravel 302s into 401s for our client.
 * - cache: "no-store" because these are authenticated, per-user responses.
 */
export async function upstreamFetch(
  path: string,
  init: RequestInit & { cookies?: UpstreamCookies } = {},
): Promise<Response> {
  const { cookies, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (!headers.has("User-Agent")) headers.set("User-Agent", UA);
  if (!headers.has("Accept")) headers.set("Accept", UPSTREAM_FORM);
  const cookie = buildUpstreamCookie(cookies ?? {});
  if (cookie) headers.set("Cookie", cookie);

  const url = path.startsWith("http") ? path : `${STS_BASE}${path}`;
  return fetch(url, {
    ...rest,
    headers,
    redirect: "manual",
    cache: "no-store",
  });
}

/**
 * Extract Set-Cookie values from an upstream response so we can relay them
 * to the browser (same-origin). Returns name/value pairs; HttpOnly/Secure
 * attributes are preserved for sts_session, XSRF-TOKEN is readable by JS-free
 * relay as well (we re-emit both ourselves).
 */
export function extractSetCookies(res: Response): {
  name: string;
  value: string;
  attrs: string;
}[] {
  const raw =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
  return raw.map((line) => {
    const [first, ...rest] = line.split(";");
    const eq = first.indexOf("=");
    const name = eq > 0 ? first.slice(0, eq).trim() : first.trim();
    const value = eq > 0 ? first.slice(eq + 1).trim() : "";
    return { name, value, attrs: rest.map((s) => s.trim()).join("; ") };
  });
}

/** Build a Set-Cookie header string to send to our own browser. */
export function relaySetCookieHeader(c: {
  name: string;
  value: string;
  attrs?: string;
}): string {
  // Ensure our cookie is scoped to the whole app and follows the upstream's intent.
  const base = `${c.name}=${c.value}; Path=/; SameSite=Lax`;
  const attrs = c.attrs ?? "";
  // Drop upstream Domain (would not match our host) and keep the rest (Max-Age, HttpOnly...).
  const kept = attrs
    .split(";")
    .map((s) => s.trim())
    .filter(
      (s) =>
        s &&
        !/^domain=/i.test(s) &&
        // We manage our own auth marker; just relay session material.
        !/^expires=/i.test(s),
    )
    .join("; ");
  return kept ? `${base}; ${kept}` : base;
}

/** A tiny wrapper for JSON API responses from upstream. */
export async function upstreamJson<T = unknown>(
  path: string,
  init: Parameters<typeof upstreamFetch>[1] = {},
): Promise<{ ok: boolean; status: number; data: T | null; res: Response }> {
  const res = await upstreamFetch(path, init);
  if (res.status === 302 || res.status === 301 || res.status === 303) {
    return { ok: false, status: res.status, data: null, res };
  }
  try {
    const data = (await res.json()) as T;
    return { ok: res.ok, status: res.status, data, res };
  } catch {
    return { ok: false, status: res.status, data: null, res };
  }
}
