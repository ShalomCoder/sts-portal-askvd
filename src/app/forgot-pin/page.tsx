"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";

type SubmitState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; message: string }
  | { kind: "err"; message: string; misweb?: string };

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1995 }, (_, i) => 1996 + i);

export default function ForgotPinPage() {
  const [status, setStatus] = useState("");
  const [yearOfEntry, setYearOfEntry] = useState("");
  const [yearOfCompletion, setYearOfCompletion] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [programme, setProgramme] = useState("");
  const [studentId, setStudentId] = useState("");
  const [thesis, setThesis] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  const continuing = status === "Continuing";
  const showRest = status !== "" && !continuing;

  const yearOptions = useMemo(() => YEARS.slice().reverse(), []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (continuing) return;
    setState({ kind: "loading" });

    const fd = new FormData();
    fd.set("website", ""); // honeypot — must stay empty
    fd.set("student_status", status);
    fd.set("year_of_entry", yearOfEntry);
    fd.set("year_of_completion", yearOfCompletion);
    fd.set("name", name);
    fd.set("email", email);
    fd.set("phone", phone);
    fd.set("programme", programme);
    fd.set("student_id", studentId);
    fd.set("thesis", thesis);
    if (idFile) fd.set("identification", idFile);
    if (certFile) fd.set("certificate", certFile);

    try {
      const res = await fetch("/api/auth/forgot-pin", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status === "error") {
        setState({
          kind: "err",
          message:
            data.message ??
            "STS did not accept the request. Please try again later.",
          misweb: data.misweb,
        });
        return;
      }
      setState({
        kind: "ok",
        message:
          data.message ??
          "Request submitted. Watch your email for further instructions.",
      });
    } catch {
      setState({
        kind: "err",
        message: "Network error — please try again.",
      });
    }
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-10">
      <div className="mx-auto w-full max-w-xl rise">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-3">
            <Image
              src="/brand/sts-icon.png"
              alt="University of Ghana"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="leading-tight">
              <span className="block text-[0.95rem] font-semibold text-ink-900">
                University of Ghana
              </span>
              <span className="block text-[0.72rem] text-ink-500">
                Student Self-Service
              </span>
            </span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            Back to sign in
          </Link>
        </div>

        <div className="card p-7">
          <h1 className="font-serif text-[1.6rem] leading-tight text-ink-900">
            Recover your Student ID / PIN
          </h1>
          <div className="rule-gold mt-3" />
          <p className="mt-3 text-sm text-ink-500">
            Fill the form exactly as your records appear at UG. All fields
            marked <span className="text-red-600">*</span> are mandatory.
          </p>

          <div className="banner banner-warn mt-4">
            This form is forwarded to the official STS backend but has{" "}
            <strong>not been tested end-to-end</strong>. Double-check every
            field before submitting.
          </div>

          {state.kind === "ok" && (
            <div className="banner banner-success mt-4">{state.message}</div>
          )}
          {state.kind === "err" && (
            <div className="banner banner-danger mt-4">
              {state.message}
              {state.misweb && (
                <>
                  {" "}
                  <a
                    className="font-semibold underline"
                    href={state.misweb}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open MISWeb
                  </a>
                </>
              )}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div>
              <label className="label">
                Current student status <span className="text-red-600">*</span>
              </label>
              <select
                className="field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="">--Select--</option>
                <option value="Completed">Completed</option>
                <option value="shouldhavecompleted">
                  Should have completed
                </option>
                <option value="Continuing">Continuing Student</option>
              </select>
            </div>

            {continuing && (
              <div className="banner banner-info">
                Continuing students reset their PIN on MISWeb.{" "}
                <a
                  href="https://ienabler.ug.edu.gh/pls/prodi41/w99pkg.mi_login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  Open MISWeb →
                </a>
              </div>
            )}

            {showRest && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">
                      Year of entry <span className="text-red-600">*</span>
                    </label>
                    <select
                      className="field"
                      value={yearOfEntry}
                      onChange={(e) => setYearOfEntry(e.target.value)}
                      required
                    >
                      <option value="">--Select--</option>
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">
                      Year of completion <span className="text-red-600">*</span>
                    </label>
                    <select
                      className="field"
                      value={yearOfCompletion}
                      onChange={(e) => setYearOfCompletion(e.target.value)}
                      required
                    >
                      <option value="">--Select--</option>
                      <option value="Yet">Yet to Complete</option>
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">
                      Full name <span className="text-red-600">*</span>
                    </label>
                    <input
                      className="field"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
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
                    <label className="label">
                      Phone number <span className="text-red-600">*</span>
                    </label>
                    <input
                      className="field"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Programme pursued</label>
                    <input
                      className="field"
                      value={programme}
                      onChange={(e) => setProgramme(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Student ID</label>
                    <input
                      className="field"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">
                      Thesis area (postgraduates)
                    </label>
                    <input
                      className="field"
                      value={thesis}
                      onChange={(e) => setThesis(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">
                    Upload a national ID card{" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="field"
                    type="file"
                    accept=".jpeg,.jpg,.png,.pdf"
                    onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
                    required
                  />
                </div>
                <div>
                  <label className="label">
                    Upload certificate (optional)
                  </label>
                  <input
                    className="field"
                    type="file"
                    accept=".jpeg,.jpg,.png,.pdf"
                    onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={state.kind === "loading" || !showRest}
            >
              {state.kind === "loading"
                ? "Submitting…"
                : "Submit recovery request"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          Unofficial frontend · forwards to sts.ug.edu.gh/services/saveforgotpin
        </p>
      </div>
    </div>
  );
}
