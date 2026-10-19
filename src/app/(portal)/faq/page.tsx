"use client";

import { useMemo, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize-client";
import {
  EmptyState,
  ErrorNote,
  PageHeader,
  Skeleton,
  useAuthedFetch,
} from "@/components/ui";
import { HelpIcon } from "@/components/icons";

/**
 * GET services/fetchfaq -> { status: "success", data: [ { title, body(html) } ] }
 * `body` carries upstream HTML — sanitized client-side before rendering.
 */
type FaqResponse = {
  status?: string;
  data?: Array<{ title?: string; body?: string }> | null;
};

export default function FaqPage() {
  const { data, error, loading } = useAuthedFetch<FaqResponse>(
    "/api/sts/fetchfaq",
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(0);

  const items = useMemo(
    () =>
      (Array.isArray(data?.data) ? data!.data! : []).map((entry) => ({
        title: entry.title ?? "Question",
        body: entry.body ?? "",
      })),
    [data?.data],
  );

  const filtered = items.filter(
    (it) =>
      it.title.toLowerCase().includes(query.toLowerCase()) ||
      it.body.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="FAQ"
        subtitle="Answers to common questions about the STS portal"
      />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}
      {!loading && error && <ErrorNote message={error} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={<HelpIcon className="h-6 w-6" />}
          title="No FAQs available"
          body="The FAQ list could not be loaded right now. Try again later."
        />
      )}

      {items.length > 0 && (
        <div className="space-y-4">
          {items.length > 5 && (
            <input
              className="field max-w-sm"
              placeholder="Search questions…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}

          <div className="space-y-2">
            {filtered.map((it, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className="card overflow-hidden !p-0">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold text-ink-900">
                      {it.title}
                    </span>
                    <svg
                      className={
                        "h-4 w-4 shrink-0 text-ink-400 transition-transform " +
                        (isOpen ? "rotate-180" : "")
                      }
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {isOpen && it.body && (
                    <div
                      className="prose-upstream border-t border-ink-100 px-5 py-4"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(it.body) }}
                    />
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-500">
                No questions match “{query}”.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
