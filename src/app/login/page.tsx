"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const expired = params.get("expired") === "1";

  const [loginAs, setLoginAs] = useState<"student" | "staff">("student");
  const [studentId, setStudentId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, pin, loginas: loginAs }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status !== "success") {
        setError(data.message ?? "Login failed. Please try again.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ------- brand panel (hidden on small screens) ------- */}
      <aside className="relative hidden overflow-hidden bg-brand-900 lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 h-[26rem] w-[26rem] rounded-full bg-gold-500/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-brand-500/25 blur-3xl"
        />

        <Image
          src="/brand/sts-logo.png"
          alt="University of Ghana"
          width={210}
          height={91}
          priority
          className="relative h-auto w-[190px] opacity-95 [filter:brightness(0)_invert(1)]"
        />

        <div className="relative max-w-md">
          <p className="eyebrow text-gold-300/90">Student Self-Service</p>
          <h1 className="mt-3 font-serif text-[2.6rem] leading-[1.1] text-white">
            Everything in one calm place.
          </h1>
          <p className="mt-4 leading-relaxed text-brand-100/80">
            Pay fees, view your profile, check exam schedules, read the academic
            calendar, lodge complaints and more — through a clean, uncluttered
            interface backed by the official STS service.
          </p>
          <ul className="mt-7 space-y-2.5 text-sm text-brand-100/80">
            {[
              "Secure login with your Student ID & PIN",
              "Fee payments via GhIPPS, Zenith, CalBank & more",
              "Complaints, suggestions and exam issue reporting",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-gold-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-200/60">
          Unofficial frontend. All data comes from sts.ug.edu.gh.
        </p>
      </aside>

      {/* ------- form panel ------- */}
      <main className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm rise">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
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
              <span className="block text-[0.75rem] text-ink-500">
                Student Self-Service
              </span>
            </span>
          </div>

          <h2 className="font-serif text-[1.9rem] leading-tight text-ink-900">
            Welcome back
          </h2>
          <div className="rule-gold mt-3" />
          <p className="mt-3 text-sm text-ink-500">
            Sign in with your Student ID or Staff ID.
          </p>

          {expired && (
            <div className="banner banner-warn mt-6">
              Your session expired. Please sign in again.
            </div>
          )}
          {error && (
            <div className="banner banner-danger mt-6" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-7 space-y-5">
            {/* role toggle */}
            <div>
              <span className="label">I am a</span>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-ink-100 p-1">
                {(["student", "staff"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setLoginAs(role)}
                    className={
                      "rounded-full px-3 py-2 text-sm font-semibold capitalize transition " +
                      (loginAs === role
                        ? "bg-white text-ink-900 shadow-sm"
                        : "text-ink-500 hover:text-ink-700")
                    }
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="studentid">
                {loginAs === "student" ? "Student ID" : "Staff ID"}
              </label>
              <input
                id="studentid"
                className="field"
                inputMode="numeric"
                autoComplete="username"
                placeholder={loginAs === "student" ? "e.g. 12345678" : "Your staff ID"}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="pin">
                PIN
              </label>
              <div className="relative">
                <input
                  id="pin"
                  className="field pr-12"
                  type={showPin ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-400 hover:text-ink-700"
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.7 9.7 0 0112 5c5 0 9 4.5 9 7a12 12 0 01-2.6 3.6M6.3 6.4C4 7.9 3 10.2 3 12c0 2.5 4 7 9 7a9.6 9.6 0 004-.9" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-ink-500">
            Forgot your Student ID or PIN?{" "}
            <a
              href="/forgot-pin"
              className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
            >
              Recover it here
            </a>
          </p>
          <p className="mt-10 text-center text-xs text-ink-400">
            Unofficial frontend · connects securely to sts.ug.edu.gh
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden bg-brand-900 lg:block" />
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-5">
          <div className="skeleton h-10 w-40" />
          <div className="skeleton h-8 w-full" />
          <div className="skeleton h-8 w-2/3" />
          <div className="skeleton h-11 w-full" />
          <div className="skeleton h-11 w-full" />
          <div className="skeleton h-11 w-full" />
        </div>
      </main>
    </div>
  );
}
