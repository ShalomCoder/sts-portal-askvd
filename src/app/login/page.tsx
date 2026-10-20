"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const expired = params.get("expired") === "1";
  const next = params.get("next") || "";

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
      try {
        if (typeof window !== "undefined" && next && next.startsWith("/")) {
          sessionStorage.setItem("sts_post_login", next);
        }
      } catch {}
      const target =
        next && next.startsWith("/") ? next : "/dashboard";
      router.push(target);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand-900 lg:flex lg:flex-col lg:justify-between lg:p-14">
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
            Pay fees, view your profile, check exam schedules and more.
          </p>
        </div>
        <p className="relative text-xs text-brand-200/60">
          Unofficial frontend. All data comes from sts.ug.edu.gh.
        </p>
      </aside>
      <main className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm rise">
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
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
