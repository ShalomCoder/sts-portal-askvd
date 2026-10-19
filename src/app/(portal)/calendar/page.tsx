"use client";

import { useMemo, useState } from "react";
import {
  Card,
  EmptyState,
  ErrorNote,
  PageHeader,
  Skeleton,
  useAuthedFetch,
} from "@/components/ui";
import { CalendarIcon } from "@/components/icons";
import { shortDate } from "@/lib/fmt";

/**
 * GET services/pullcalender -> { status: "success", data: { "<year-label>": [ { id, title, start_date, end_date, … } ] } }
 */
type CalendarResponse = {
  status?: string;
  data?: Record<string, unknown> | null;
};

type EventRow = { start: string; end: string; title: string };

export default function CalendarPage() {
  const { data, error, loading } = useAuthedFetch<CalendarResponse>(
    "/api/sts/pullcalender",
  );
  const [year, setYear] = useState("all");

  const years = useMemo(() => {
    const resp = data?.data;
    if (!resp || typeof resp !== "object") return [] as string[];
    return Object.keys(resp).sort(
      (a, b) =>
        Number(b.slice(0, 4) || 0) - Number(a.slice(0, 4) || 0),
    );
  }, [data?.data]);

  const grouped = useMemo(() => {
    const resp = data?.data;
    if (!resp || typeof resp !== "object") return [];
    return years
      .filter((y) => year === "all" || y === year)
      .map((y) => ({ year: y, events: toEvents(resp[y]) }));
  }, [data?.data, years, year]);

  const total = grouped.reduce((n, g) => n + g.events.length, 0);

  return (
    <>
      <PageHeader
        title="Academic Calendar"
        subtitle="Registration windows, lectures, exams and holidays"
        action={
          years.length > 1 ? (
            <select
              className="field !w-auto"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="all">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          ) : undefined
        }
      />

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      {!loading && error && <ErrorNote message={error} />}

      {!loading && !error && total === 0 && (
        <EmptyState
          icon={<CalendarIcon className="h-6 w-6" />}
          title="No calendar entries"
          body="The academic calendar has not been published for this period yet."
        />
      )}

      {grouped.map((group) => (
        <section key={group.year} className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-ink-900">
            {group.year}
          </h2>
          <Card className="!p-0 overflow-hidden">
            <ul className="divide-y divide-ink-100">
              {group.events.map((ev, i) => (
                <li
                  key={i}
                  className="grid gap-1 px-5 py-3.5 sm:grid-cols-[180px_1fr] sm:gap-4"
                >
                  <span className="text-xs font-semibold text-brand-700">
                    {ev.start}
                    {ev.end && ev.end !== ev.start ? ` → ${ev.end}` : ""}
                  </span>
                  <span className="text-sm text-ink-800">{ev.title}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ))}
    </>
  );
}

function toEvents(value: unknown): EventRow[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item): EventRow[] => {
      if (typeof item === "string") return [{ start: "", end: "", title: item }];
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const start = fmtDate(pick(o, ["start_date", "startdate", "date", "start"]));
        const end = fmtDate(pick(o, ["end_date", "enddate", "end"]));
        const title = pick(o, ["title", "event", "description", "activity", "name"]);
        if (start || title) return [{ start, end, title }];
      }
      return [];
    });
  }
  if (typeof value === "string") return [{ start: "", end: "", title: value }];
  return [];
}

function pick(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (v != null && typeof v !== "object") return String(v).trim();
  }
  return "";
}

function fmtDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : shortDate(raw);
}
