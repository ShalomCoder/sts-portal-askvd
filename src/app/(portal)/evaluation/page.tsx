"use client";

import { useMemo } from "react";
import {
  Card,
  EmptyState,
  ErrorNote,
  PageHeader,
  Skeleton,
  useAuthedFetch,
} from "@/components/ui";
import { ClipboardIcon } from "@/components/icons";

/**
 * Course / lecturer evaluation.
 *
 * `fetchevaluationcourses` opens only during evaluation windows; outside one
 * it answers { status: "error", type: "03" } and the upstream page redirects
 * away. We detect that and render a graceful "not available" state.
 */
type EvaluationResponse = {
  status?: string;
  type?: string;
  data?: Array<Record<string, unknown>> | null;
};

export default function EvaluationPage() {
  const { data, error, loading } = useAuthedFetch<EvaluationResponse>(
    "/api/sts/fetchevaluationcourses",
  );

  const available = data?.status === "success" && Array.isArray(data.data);
  const courses = useMemo(
    () => (available ? (data!.data as Array<Record<string, unknown>>) : []),
    [available, data],
  );

  return (
    <>
      <PageHeader
        title="Course Evaluation"
        subtitle="Evaluate your courses and lecturers each semester"
      />

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}
      {!loading && error && <ErrorNote message={error} />}

      {!loading && !error && !available && (
        <EmptyState
          icon={<ClipboardIcon className="h-6 w-6" />}
          title="Evaluation is not open right now"
          body="Course evaluation runs during specific windows each semester. STS reports that this service is currently unavailable — check back when your college announces an evaluation period."
        />
      )}

      {available && (
        <div className="space-y-4">
          <div className="banner banner-info">
            Evaluation is open. Complete a form for each course and lecturer
            below — your responses are submitted to your college.
          </div>
          {courses.length === 0 ? (
            <Card>
              <p className="text-sm text-ink-500">
                No courses are available for evaluation at this time.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {courses.map((c, i) => (
                <Card key={i}>
                  <p className="font-semibold text-ink-900">
                    {String(
                      c.course_code ?? c.course ?? c.title ?? `Course ${i + 1}`,
                    )}
                  </p>
                  <p className="mt-1 text-sm text-ink-500">
                    {String(c.course_title ?? c.title ?? "")}
                  </p>
                  <p className="mt-3 text-xs text-ink-400">
                    Evaluation form opens in the official STS interface.
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
