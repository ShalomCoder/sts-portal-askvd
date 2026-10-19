/**
 * Shared session-cookie helpers.
 *
 * The portal counts as signed in only while BOTH cookies are present:
 *
 *   - `sts_auth`    our own marker, set at login with a Max-Age
 *   - `sts_session` the relayed upstream Laravel session
 *
 * Upstream sends `sts_session` as a *session cookie* (no Max-Age/Expires), so
 * the browser discards it when it closes — while `sts_auth` survives for hours.
 * Checking only `sts_auth` is what produced the /dashboard <-> /login redirect
 * loop: the marker said "signed in" so the middleware kept bouncing `/login`
 * back to a dashboard whose data calls 401'd immediately, forever.
 *
 * Keeping this in its own module (no imports) makes it safe to pull into the
 * edge middleware bundle — importing `next/headers` there would break it.
 */

export const AUTH_COOKIE = "sts_auth";
export const SESSION_COOKIE = "sts_session";
export const NAME_COOKIE = "sts_name";

type CookieBag = { get(name: string): { value: string } | undefined };

/** Signed in: the auth marker AND the upstream session cookie are both there. */
export function isSessionPresent(jar: CookieBag): boolean {
  return (
    jar.get(AUTH_COOKIE)?.value === "1" && !!jar.get(SESSION_COOKIE)?.value
  );
}

/**
 * "Half signed in": the marker is still set but the upstream session cookie is
 * gone. This is the exact state that used to loop, and it is worth detecting
 * explicitly so we can clear the leftovers and tell the user why.
 */
export function isHalfSignedIn(jar: CookieBag): boolean {
  return (
    jar.get(AUTH_COOKIE)?.value === "1" && !jar.get(SESSION_COOKIE)?.value
  );
}

type ClearableResponse = {
  cookies: {
    set(
      name: string,
      value: string,
      options?: { path?: string; maxAge?: number },
    ): unknown;
  };
};

/** Drop every relayed cookie on a response we are about to send. */
export function clearSessionCookies(res: ClearableResponse): void {
  for (const name of [AUTH_COOKIE, SESSION_COOKIE, "XSRF-TOKEN", NAME_COOKIE]) {
    res.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
}
