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
import { BookIcon } from "@/components/icons";

/**
 * GET services/fetchtimetable ->
 *   { courses: [{course_code,…}], data: "<JSON string>" } when published,
 *   { status: "notfound" } when nothing is scheduled.
 *
 * The `data` string parses to rows like:
 *   { course_code, title, day, month, venue_id: [], exam_date, exam_time,
 *     index_range: [], status, student_no }
 */
type ExamRow = {
  course_code?: string;
  title?: string;
  day?: string;
  month?: string;
  exam_date?: string;
  exam_time?: string;
  venue_id?: string[] | string;
  index_range?: string[] | string;
  status?: string;
};

type TimetableResponse = {
  status?: string;
  courses?: unknown[] | null;
  data?: string | null;
};

export default function ExamsPage() {
  const { data, error, loading } = useAuthedFetch<TimetableResponse>(
    "/api/sts/fetchtimetable",
  );
  const [query, setQuery] = useState("");

  const rows = useMemo<ExamRow[]>(() => {
    if (!data?.data) return [];
    try {
      const parsed = JSON.parse(data.data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [data?.data]);

  const filtered = rows.filter((r) =>
    [r.course_code, r.title, r.exam_date, r.exam_time, asText(r.venue_id)]
      .some((v) =>
        String(v ?? "").toLowerCase().includes(query.toLowerCase()),
      ),
  );

  const unavailable = !loading && !error && rows.length === 0;

  return (
    <>
      <PageHeader
        title="Exam Schedule"
        subtitle="Published dates, venues and index numbers"
      />

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      {!loading && error && <ErrorNote message={error} />}

      {unavailable && (
        <EmptyState
          icon={<BookIcon className="h-6 w-6" />}
          title="No timetable published"
          body="STS has not published an examination timetable for your account yet. Check the academic calendar for exam periods, and check back after registration."
        />
      )}

      {!unavailable && (
        <div className="space-y-4">
          {rows.length > 6 && (
            <input
              className="field max-w-sm"
              placeholder="Search courses, venues, dates…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          <Card className="!p-0 overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Venue</th>
                  <th>Index range</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i}>
                    <td className="font-semibold">{r.course_code || "—"}</td>
                    <td>{r.title || "—"}</td>
                    <td className="whitespace-nowrap">
                      {r.exam_date
                        ? `${r.day ?? ""} ${r.exam_date} ${r.month ?? ""}`.trim()
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap">{r.exam_time || "—"}</td>
                    <td>{asText(r.venue_id) || "—"}</td>
                    <td className="font-mono text-xs">
                      {asText(r.index_range) || "—"}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink-500">
                      No exams match “{query}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </>
  );
}

function asText(v: string[] | string | undefined): string {
  if (Array.isArray(v)) return v.join(", ");
  return v ?? "";
}
