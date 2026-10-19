import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookies,
  isHalfSignedIn,
  isSessionPresent,
} from "@/lib/session";

/**
 * Route guard.
 *
 * "Signed in" means our `sts_auth` marker AND the relayed `sts_session` cookie
 * are both present — see src/lib/session.ts for why checking the marker alone
 * created a redirect loop.
 *
 * Pages  -> /login (with ?expired=1 when we can tell the session died)
 * API    -> 401 JSON so the client can end the session cleanly
 */

const PUBLIC_PATHS = [
  "/login",
  "/forgot-pin",
  "/offline",
  "/api/auth/login",
  // Must be public: it is how a half-signed-in client clears its cookies.
  "/api/auth/logout",
  "/api/auth/forgot-pin",
  "/manifest.webmanifest",
  "/sw.js",
  "/_next",
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = isSessionPresent(req.cookies);
  const stale = isHalfSignedIn(req.cookies);

  if (isPublic(pathname)) {
    // Never bounce a stale marker from /login back into the portal — that is
    // the other half of the loop. `?expired=1` forces the login form.
    const expired = req.nextUrl.searchParams.get("expired") === "1";
    if (pathname === "/login" && authed && !expired) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!authed) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json(
        { unauthenticated: true },
        { status: 401 },
      );
      if (stale) clearSessionCookies(res);
      return res;
    }

    const url = new URL("/login", req.url);
    if (stale) url.searchParams.set("expired", "1");
    const res = NextResponse.redirect(url);
    // Self-heal: drop the marker that would otherwise send us straight back.
    if (stale) clearSessionCookies(res);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Everything except static assets, the service worker and the manifest.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
