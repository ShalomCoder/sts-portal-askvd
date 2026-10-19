"use client";

import { sanitizeHtml } from "@/lib/sanitize-client";
import { EmptyState, ErrorNote, PageHeader, Skeleton, useAuthedFetch } from "@/components/ui";

/** GET services/fetchnotification -> { status: "success", data: [{ title, body, data? }] } */
type NotificationResponse = {
  status?: string;
  data?: Array<{ title?: string; body?: string }> | null;
};

export default function NotificationsPage() {
  const { data, error, loading } =
    useAuthedFetch<NotificationResponse>("/api/sts/fetchnotification");

  const items = Array.isArray(data?.data) ? data!.data! : [];

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Announcements pushed through STS for your account"
      />

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}
      {!loading && error && <ErrorNote message={error} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={<span className="text-xl">🔔</span>}
          title="No notifications yet"
          body="When STS pushes announcements for your account, they will appear here."
        />
      )}

      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((n, i) => (
            <li key={i} className="card p-5">
              {n.title && (
                <p className="font-semibold text-ink-900">{n.title}</p>
              )}
              {n.body && (
                <div
                  className="prose-upstream mt-1 text-sm text-ink-600"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(n.body) }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
