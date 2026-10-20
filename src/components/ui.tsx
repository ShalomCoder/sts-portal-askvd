"use client";

import { useEffect, useState } from "react";
import { ApiError, endSession } from "@/lib/client";

/* ---------- page header ---------- */

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 border-b border-ink-200/80 pb-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h1 className="font-serif text-[1.7rem] leading-tight tracking-tight text-ink-900">
            {title}
          </h1>
          <div className="rule-gold mt-2" />
          {subtitle && (
            <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-500">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}


/* ---------- fetch states ---------- */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="banner banner-danger" role="alert">
      {message}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        {icon ?? "∅"}
      </span>
      <p className="mt-1 font-serif text-lg text-ink-900">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-ink-500">{body}</p>
    </div>
  );
}

/** Wraps an authed JSON fetch with loading / error / 401 handling. */
export function useAuthedFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res.status === 401) {
          const body = await res.json().catch(() => ({}));
          if (body?.unauthenticated) {
            endSession();
            return;
          }
          throw new ApiError(body?.message ?? "Unauthorized", 401);
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new ApiError(
            body?.message ?? `Request failed (${res.status})`,
            res.status,
          );
        }
        const json = (await res.json()) as T;
        if (alive) setData(json);
      } catch (e) {
        if (alive)
          setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [url, nonce]);

  return {
    data,
    error,
    loading,
    refetch: () => setNonce((n) => n + 1),
  };
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`card p-6 ${className}`}>{children}</div>;
}
