"use client";

/**
 * Client-side wrapper around our same-origin API.
 * - JSON in/out
 * - upstream session loss (401 {unauthenticated}) -> bounce to /login
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let ending = false;

/**
 * The portal can end up "half signed in": our `sts_auth` marker survives while
 * the relayed upstream session cookie is gone (upstream sends it as a browser
 * session cookie, so closing the browser drops it).
 *
 * Redirecting straight to /login in that state makes the middleware bounce back
 * to /dashboard — an endless loop — so we clear the local cookies first and
 * land on /login?expired=1. The `expired` flag makes the middleware skip its
 * "already signed in" bounce even if clearing fails (e.g. offline), which makes
 * the loop impossible rather than merely unlikely.
 */
export function endSession(): void {
  if (ending) return;
  ending = true;

  let navigated = false;
  const go = () => {
    if (navigated) return;
    navigated = true;
    window.location.replace("/login?expired=1");
  };

  void fetch("/api/auth/logout", { method: "POST", keepalive: true })
    .catch(() => undefined)
    .finally(go);
  // Don't leave the user hanging if the request stalls.
  window.setTimeout(go, 1500);
}

export async function api<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    cache: "no-store",
    ...init,
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401) {
    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      unauthenticated?: boolean;
    };
    if (data.unauthenticated) {
      endSession();
      throw new ApiError("Session expired", 401);
    }
    throw new ApiError(data.message ?? "Unauthorized", 401);
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      (data as { message?: string }).message ?? `Request failed (${res.status})`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

/** GET JSON through the generic STS proxy (auto-401 handling). */
export function stsGet<T = unknown>(pathAndQuery: string): Promise<T> {
  return api<T>(`/api/sts/${pathAndQuery.replace(/^\/+/, "")}`);
}

/** POST JSON through the generic STS proxy (CSRF injected server-side). */
export function stsPost<T = unknown>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  return api<T>(`/api/sts/${path.replace(/^\/+/, "")}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
