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
    const data = await res.json().catch(() => ({}));
    if (data && (data.unauthenticated || data.message === "Invalid Student ID or PIN")) {
      if (data.unauthenticated) {
        window.location.href = "/login";
        throw new ApiError("Session expired", 401);
      }
    }
    const msg = (data as { message?: string }).message ?? "Unauthorized";
    throw new ApiError(msg, 401);
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
