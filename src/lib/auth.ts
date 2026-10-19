import { cookies } from "next/headers";
import type { UpstreamCookies } from "./http";

export const AUTH_COOKIE = "sts_auth";

/**
 * Get the relayed upstream session cookies for the current request.
 * Next's `cookies()` exposes individual cookies (not a raw Cookie header),
 * so we read them by name. XSRF-TOKEN is stored URL-encoded upstream.
 */
export async function getSessionCookies(): Promise<UpstreamCookies> {
  const jar = await cookies();
  if (jar.get(AUTH_COOKIE)?.value !== "1") return {};

  const out: UpstreamCookies = {};
  const session = jar.get("sts_session")?.value;
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
