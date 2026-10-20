"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SESSION_DURATION = 6 * 60 * 60 * 1000; // 6 hours
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "click"];

export function SessionTimeoutModal() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARNING_THRESHOLD);
  const [lastActivity, setLastActivity] = useState(() => Date.now());
  const [pinging, setPinging] = useState(false);

  useEffect(() => {
    const resetActivity = () => {
      if (!show) setLastActivity(Date.now());
    };
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, resetActivity, { passive: true });
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivity;
      const remaining = SESSION_DURATION - elapsed;
      if (remaining <= WARNING_THRESHOLD && remaining > 0) {
        setTimeLeft(remaining);
        setShow(true);
      } else if (remaining <= 0) {
        fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(
          () => {},
        );
        router.replace("/login?expired=1");
        clearInterval(interval);
      }
    }, 10000);

    return () => {
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, resetActivity);
      }
      clearInterval(interval);
    };
  }, [lastActivity, router, show]);

  async function staySignedIn() {
    setPinging(true);
    try {
      const res = await fetch("/api/welcome", { cache: "no-store" });
      if (res.status === 401) {
        fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(
          () => {},
        );
        router.replace("/login?expired=1");
        return;
      }
      setLastActivity(Date.now());
      setShow(false);
    } catch {
      fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(
        () => {},
      );
      router.replace("/login?expired=1");
    } finally {
      setPinging(false);
    }
  }

  async function signOut() {
    fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(
      () => {},
    );
    router.replace("/login");
  }

  if (!show) return null;

  const totalSec = Math.max(0, Math.floor(timeLeft / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-pop">
        <h2 className="font-serif text-lg text-ink-900">Session expiring soon</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          You'll be signed out in{" "}
          <span className="font-semibold text-brand-700">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
          . Stay signed in to continue your session.
        </p>
        <div className="mt-6 flex gap-2">
          <button
            onClick={staySignedIn}
            disabled={pinging}
            className="btn btn-primary flex-1"
          >
            {pinging ? "Extending..." : "Stay signed in"}
          </button>
          <button onClick={signOut} className="btn btn-ghost flex-1">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
