"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js).
 *
 * Production only: a service worker in `next dev` intercepts requests in ways
 * that make hot reload confusing, and the app has nothing to gain from it there.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration is a progressive enhancement — never break the app.
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
