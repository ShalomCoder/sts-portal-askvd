"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card, PageHeader, Skeleton } from "@/components/ui";
import { ChatIcon } from "@/components/icons";
import { api } from "@/lib/client";

/**
 * Complaints hub. Mirrors two upstream forms:
 *   POST complaint/submit    — issue_code driven (IT/Sakai/records issues)
 *   POST sendmailtocollege   — email your college (grades, registration)
 *
 * ⚠️ Both are mutating and deliberately UNTESTED.
 */

/** issue_code = "<code>:<showCourseSelect>:<showCourseTextarea>" */
const ISSUE_OPTIONS = [
  { value: "08:0:0", label: "Not enabled to register on MISWeb" },
  { value: "13:1:0", label: "Course not showing on Sakai" },
  { value: "14:0:0", label: "Can't login to Sakai" },
  { value: "15:0:0", label: "Want course(s) removed from Sakai" },
  { value: "16:0:1", label: "HERC course not appearing on MISWeb" },
  { value: "12:0:0", label: "Can't register for HERC" },
  { value: "04:0:1", label: "Can't register for UGRC" },
  { value: "09:1:0", label: "Missing grade on MISWeb (Showing N/A)" },
  { value: "10:0:1", label: "Registered course not showing on my Academic Records" },
  { value: "11:0:1", label: "Course not showing for me to register on MISWeb" },
  { value: "01:0:0", label: "Can't login to my UG email account" },
  { value: "02:0:0", label: "Forgotten my UG Email Password" },
  { value: "17:1:0", label: "Cancel course from academic record" },
  { value: "18:1:0", label: "Transcript Issue" },
  { value: "19:0:0", label: "I HAVE PAID STUDENT MEDICAL FEE BUT I CAN'T REGISTER" },
];

const COLLEGE_ISSUE_TYPES = [
  "Missing Grade",
  "Course Not Showing",
  "Cant Register Course",
  "Other",
];

type CourseOption = { course_code: string; course_title: string };

type SubmitState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; message: string }
  | { kind: "err"; message: string };

export default function ComplaintsPage() {
  return (
    <>
      <PageHeader
        title="Complaints"
        subtitle="Report IT, registration or academic record issues"
      />
      <div className="banner banner-warn mb-6">
        Complaint submissions are forwarded to the official STS backend but
        have <strong>not been tested end-to-end</strong>. Double-check the
        details before submitting.
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <GeneralComplaintCard />
        <CollegeComplaintCard />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* complaint/submit                                                     */
/* ------------------------------------------------------------------ */

function GeneralComplaintCard() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [issueCode, setIssueCode] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [manualCourses, setManualCourses] = useState("");
  const [phone, setPhone] = useState("");
  const [additional, setAdditional] = useState("");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await (await fetch("/api/sts/fetchcoursesforcomplaints", { cache: "no-store" })).json();
        const rows = Array.isArray(res?.data) ? res.data : [];
        if (!alive) return;
        setCourses(
          rows
            // ⚠️ upstream rows contain a `pin` field — never copy it anywhere.
            .filter((r: Record<string, unknown>) => r.course_code)
            .map((r: Record<string, unknown>) => ({
              course_code: String(r.course_code),
              course_title: String(r.course_title ?? ""),
            })),
        );
      } catch {
        /* course list is optional — textarea fallback still works */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const [, showCourseSelect, showCourseTextarea] = issueCode.split(":");
  const needCourseSelect = showCourseSelect === "1";
  const needCourseTextarea = showCourseTextarea === "1";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState({ kind: "loading" });
    try {
      const data = await api<{ status?: string; message?: string }>(
        "/api/sts/complaint/submit",
        {
          method: "POST",
          body: JSON.stringify({
            issue_code: issueCode,
            "coursecode[]": selectedCourses,
            coursecode1: manualCourses,
            phone,
            additional,
          }),
        },
      );
      if (data?.status === "error") {
        setState({ kind: "err", message: data.message ?? "Submission failed." });
        return;
      }
      setState({
        kind: "ok",
        message: "Complaint submitted. Track it with your college/ICT.",
      });
    } catch (err) {
      setState({
        kind: "err",
        message:
          err instanceof Error ? err.message : "Submission failed. Try again.",
      });
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <ChatIcon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold text-ink-900">Submit a complaint</h2>
          <p className="text-xs text-ink-500">
            ICT, Sakai, MISWeb and academic record issues
          </p>
        </div>
      </div>

      {state.kind === "ok" && (
        <div className="banner banner-success mb-4">{state.message}</div>
      )}
      {state.kind === "err" && (
        <div className="banner banner-danger mb-4" role="alert">
          {state.message}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">
            Issue type <span className="text-red-600">*</span>
          </label>
          <select
            className="field"
            value={issueCode}
            onChange={(e) => {
              setIssueCode(e.target.value);
              setSelectedCourses([]);
              setManualCourses("");
            }}
            required
          >
            <option value="">Please select issue type</option>
            {ISSUE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {needCourseSelect && (
          <div>
            <label className="label">
              Course(s) <span className="text-red-600">*</span>
            </label>
            {courses.length > 0 ? (
              <select
                multiple
                className="field h-36"
                value={selectedCourses}
                onChange={(e) =>
                  setSelectedCourses(
                    Array.from(e.target.selectedOptions).map((o) => o.value),
                  )
                }
                required
              >
                {courses.map((c) => (
                  <option key={c.course_code} value={c.course_code}>
                    {c.course_code} - {c.course_title}
                  </option>
                ))}
              </select>
            ) : (
              <Skeleton className="h-24 w-full" />
            )}
            <p className="mt-1 text-xs text-ink-400">
              Hold Ctrl/Cmd to select multiple courses.
            </p>
          </div>
        )}

        {needCourseTextarea && (
          <div>
            <label className="label">
              Course codes <span className="text-red-600">*</span>
            </label>
            <textarea
              className="field"
              rows={3}
              maxLength={150}
              placeholder="Enter course codes here"
              value={manualCourses}
              onChange={(e) => setManualCourses(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label className="label">
            Phone number <span className="text-red-600">*</span>
          </label>
          <input
            className="field"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            minLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="0XX XXX XXXX"
            required
          />
        </div>

        <div>
          <label className="label">Additional info</label>
          <textarea
            className="field"
            rows={4}
            maxLength={150}
            placeholder="Anything that helps resolve the issue"
            value={additional}
            onChange={(e) => setAdditional(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={state.kind === "loading"}
        >
          {state.kind === "loading" ? "Submitting…" : "Submit complaint"}
        </button>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* sendmailtocollege                                                    */
/* ------------------------------------------------------------------ */

function CollegeComplaintCard() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [type, setType] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [additional, setAdditional] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await (await fetch("/api/sts/fetchcoursesforcomplaints", { cache: "no-store" })).json();
        const rows = Array.isArray(res?.data) ? res.data : [];
        if (!alive) return;
        setCourses(
          rows
            .filter((r: Record<string, unknown>) => r.course_code)
            .map((r: Record<string, unknown>) => ({
              course_code: String(r.course_code),
              course_title: String(r.course_title ?? ""),
            })),
        );
      } catch {
        /* optional */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const showCourseSelect = type === "Missing Grade";
  const showCourseTitle = type === "Course Not Showing";
  const needAdditional = !showCourseSelect && !showCourseTitle;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState({ kind: "loading" });
    try {
      const data = await api<{ status?: string; message?: string }>(
        "/api/sts/sendmailtocollege",
        {
          method: "POST",
          body: JSON.stringify({
            type,
            "coursecode[]": selectedCourses,
            coursecodetitle: courseTitle,
            additional,
            phone,
          }),
        },
      );
      if (data?.status === "error") {
        setState({ kind: "err", message: data.message ?? "Submission failed." });
        return;
      }
      setState({
        kind: "ok",
        message: "Email sent to your college. Follow up with them if needed.",
      });
    } catch (err) {
      setState({
        kind: "err",
        message:
          err instanceof Error ? err.message : "Submission failed. Try again.",
      });
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <ChatIcon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold text-ink-900">Email your college</h2>
          <p className="text-xs text-ink-500">
            Missing grades, course registration issues
          </p>
        </div>
      </div>

      {state.kind === "ok" && (
        <div className="banner banner-success mb-4">{state.message}</div>
      )}
      {state.kind === "err" && (
        <div className="banner banner-danger mb-4" role="alert">
          {state.message}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">
            Issue type <span className="text-red-600">*</span>
          </label>
          <select
            className="field"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setSelectedCourses([]);
              setCourseTitle("");
              setAdditional("");
            }}
            required
          >
            <option value="">Please select issue type</option>
            {COLLEGE_ISSUE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {showCourseSelect && (
          <div>
            <label className="label">
              Course(s) <span className="text-red-600">*</span>
            </label>
            {courses.length > 0 ? (
              <select
                multiple
                className="field h-36"
                value={selectedCourses}
                onChange={(e) =>
                  setSelectedCourses(
                    Array.from(e.target.selectedOptions).map((o) => o.value),
                  )
                }
                required
              >
                {courses.map((c) => (
                  <option key={c.course_code} value={c.course_code}>
                    {c.course_code} - {c.course_title}
                  </option>
                ))}
              </select>
            ) : (
              <Skeleton className="h-24 w-full" />
            )}
          </div>
        )}

        {showCourseTitle && (
          <div>
            <label className="label">
              Course code &amp; title <span className="text-red-600">*</span>
            </label>
            <input
              className="field"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="e.g. MATH 121 — Algebra I"
              required
            />
          </div>
        )}

        {type && (
          <div>
            <label className="label">
              Additional info{" "}
              {needAdditional && <span className="text-red-600">*</span>}
            </label>
            <textarea
              className="field"
              rows={4}
              maxLength={150}
              value={additional}
              onChange={(e) => setAdditional(e.target.value)}
              required={needAdditional}
            />
          </div>
        )}

        <div>
          <label className="label">Phone number</label>
          <input
            className="field"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="0XX XXX XXXX"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={state.kind === "loading" || !type}
        >
          {state.kind === "loading" ? "Sending…" : "Send to college"}
        </button>
      </form>
    </Card>
  );
}
