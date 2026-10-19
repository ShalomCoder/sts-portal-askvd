import { NextRequest, NextResponse } from "next/server";

/**
 * Route guard on our `sts_auth` cookie (set at login, cleared at logout).
 * Pages -> redirect /login.  API (other than auth) -> 401 JSON.
 */

const PUBLIC_PATHS = [
  "/login",
  "/forgot-pin",
  "/api/auth/login",
  "/api/auth/forgot-pin",
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
  const authed = req.cookies.get("sts_auth")?.value === "1";

  if (isPublic(pathname)) {
    // Already logged in? Send /login visitors to the dashboard.
    if (pathname === "/login" && authed) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!authed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ unauthenticated: true }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
