import { cookies } from "next/headers";
import type { UpstreamCookies } from "./http";
import { AUTH_COOKIE, SESSION_COOKIE } from "./session";

export { AUTH_COOKIE, SESSION_COOKIE };

/**
 * Get the relayed upstream session cookies for the current request.
 * Next's `cookies()` exposes individual cookies (not a raw Cookie header),
 * so we read them by name. XSRF-TOKEN is stored URL-encoded upstream.
 */
export async function getSessionCookies(): Promise<UpstreamCookies> {
  const jar = await cookies();
  if (jar.get(AUTH_COOKIE)?.value !== "1") return {};

  const out: UpstreamCookies = {};
  const session = jar.get(SESSION_COOKIE)?.value;
  if (session) out.sts_session = session;

  const xsrf = jar.get("XSRF-TOKEN")?.value;
  if (xsrf) {
    try {
      out.xsrf = decodeURIComponent(xsrf);
    } catch {
      out.xsrf = xsrf;
    }
  }
  return out;
}

export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE)?.value === "1";
}
