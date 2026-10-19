"use client";

import { useState, type FormEvent } from "react";
import { Card, PageHeader } from "@/components/ui";
import { ClipboardIcon } from "@/components/icons";

/**
 * Exam issue report. Mirrors the upstream /services/submit-exam-complaint
 * form: POST save-exam-complaint (multipart/form-data with evidence files).
 *
 * ⚠️ Mutating & deliberately UNTESTED.
 */

const COMPLAINT_TYPES = [
  "Invigilator Issue",
  "Timetable Clash",
  "Attendance Issue",
  "Venue Change",
  "Computer Issue",
  "Environment Issue",
  "Examination Material Issue",
  "Other Issue",
];

type SubmitState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; message: string }
  | { kind: "err"; message: string };

export default function ExamComplaintPage() {
  const [types, setTypes] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examVenue, setExamVenue] = useState("");
  const [additional, setAdditional] = useState("");
  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  function toggleType(t: string) {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState({ kind: "loading" });

    const fd = new FormData();
    for (const t of types) fd.append("complaint_types[]", t);
    fd.set("email", email);
    fd.set("phone", phone);
    fd.set("course_code", courseCode);
    fd.set("course_title", courseTitle);
    fd.set("exam_date", examDate);
    fd.set("exam_venue", examVenue);
    fd.set("additional_info", additional);
    fd.set("confirm_truth", confirmed ? "on" : "");
    if (timetableFile) fd.set("timetable_file", timetableFile);
    if (evidenceFile) fd.set("other_evidence_file", evidenceFile);

    try {
      const res = await fetch("/api/sts/save-exam-complaint", {
        method: "POST",
        body: fd,
      });
      if (res.status === 401) {
        const body = await res.json().catch(() => ({}));
        if (body?.unauthenticated) {
          window.location.href = "/login";
          return;
        }
      }
      const data = (await res.json().catch(() => ({}))) as {
        status?: string;
        message?: string;
      };
      if (!res.ok || data.status === "error") {
        setState({
          kind: "err",
          message: data.message ?? "Submission failed. Try again later.",
        });
        return;
      }
      setState({
        kind: "ok",
        message:
          "Exam complaint submitted. Keep your reference and follow up with the exams office.",
      });
    } catch {
      setState({ kind: "err", message: "Network error — please try again." });
    }
  }

  return (
    <>
      <PageHeader
        title="Exam Complaint"
        subtitle="Report issues experienced during an examination"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <div className="banner banner-warn mb-5">
            This form is forwarded to the official STS backend but has{" "}
            <strong>not been tested end-to-end</strong>. Review everything
            before submitting.
          </div>

          {state.kind === "ok" && (
            <div className="banner banner-success mb-4">{state.message}</div>
          )}
          {state.kind === "err" && (
            <div className="banner banner-danger mb-4" role="alert">
              {state.message}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="label">
                Complaint type(s) <span className="text-red-600">*</span>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {COMPLAINT_TYPES.map((t) => (
                  <label
                    key={t}
                    className={
                      "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition " +
                      (types.includes(t)
                        ? "border-brand-500 bg-brand-50 font-semibold text-ink-900 ring-1 ring-brand-500"
                        : "border-ink-200 text-ink-700 hover:border-ink-300")
                    }
                  >
                    <input
                      type="checkbox"
                      checked={types.includes(t)}
                      onChange={() => toggleType(t)}
                      className="accent-[var(--color-brand-600)]"
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">
                  Course code <span className="text-red-600">*</span>
                </label>
                <input
                  className="field"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. MATH 121"
                  required
                />
              </div>
              <div>
                <label className="label">
                  Course title <span className="text-red-600">*</span>
                </label>
                <input
                  className="field"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Algebra I"
                  required
                />
              </div>
              <div>
                <label className="label">
                  Exam date <span className="text-red-600">*</span>
                </label>
                <input
                  className="field"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Exam venue</label>
                <input
                  className="field"
                  value={examVenue}
                  onChange={(e) => setExamVenue(e.target.value)}
                  placeholder="e.g. Great Hall"
                />
              </div>
              <div>
                <label className="label">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  className="field"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
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
            </div>

            <div>
              <label className="label">Additional details</label>
              <textarea
                className="field"
                rows={3}
                value={additional}
                onChange={(e) => setAdditional(e.target.value)}
                placeholder="Any other details that might help resolve your complaint"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">
                  Timetable extract{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  className="field"
                  type="file"
                  accept=".pdf,.jpg,.png"
                  onChange={(e) => setTimetableFile(e.target.files?.[0] ?? null)}
                  required
                />
                <p className="mt-1 text-xs text-ink-400">
                  PDF or image showing the scheduled exam.
                </p>
              </div>
              <div>
                <label className="label">Supporting evidence</label>
                <input
                  className="field"
                  type="file"
                  accept=".pdf,.jpg,.png"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                />
                <p className="mt-1 text-xs text-ink-400">
                  Optional photo or document.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl bg-ink-50 p-4 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 accent-[var(--color-brand-600)]"
                required
              />
              <span>
                I confirm that the information provided is true and accurate to
                the best of my knowledge.
              </span>
            </label>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={state.kind === "loading" || types.length === 0}
            >
              {state.kind === "loading" ? (
                "Submitting…"
              ) : (
                <>
                  <ClipboardIcon className="h-4 w-4" />
                  Submit exam complaint
                </>
              )}
            </button>
          </form>
        </Card>

        <aside className="card h-fit">
          <h3 className="font-semibold text-ink-900">What happens next</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-600">
            <li>Your complaint is sent to the Examinations Office.</li>
            <li>
              They may contact you by email or phone for clarification.
            </li>
            <li>
              Outcomes are communicated through your college. Keep this
              reference.
            </li>
          </ol>
        </aside>
      </div>
    </>
  );
}
