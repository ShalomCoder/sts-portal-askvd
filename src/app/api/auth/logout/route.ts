import { NextResponse } from "next/server";
import { upstreamFetch } from "@/lib/http";
import { AUTH_COOKIE, getSessionCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Ends the upstream session and clears our relay cookies. */
export async function POST() {
  const cookies = await getSessionCookies();

  if (cookies.sts_session) {
    try {
      // Fire the upstream logout (GET); we don't care about its body.
      await upstreamFetch("/logout", {
        cookies,
        headers: { Accept: "text/html,*/*;q=0.8" },
      });
    } catch {
      // Upstream unreachable — clear locally regardless.
    }
  }

  const next = NextResponse.json({ status: "success" });
  next.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
  next.headers.append(
    "Set-Cookie",
    `sts_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
  next.headers.append(
    "Set-Cookie",
    `XSRF-TOKEN=; Path=/; SameSite=Lax; Max-Age=0`,
  );
  next.headers.append(
    "Set-Cookie",
    `sts_name=; Path=/; SameSite=Lax; Max-Age=0`,
  );
  return next;
}
