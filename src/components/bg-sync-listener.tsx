"use client";

import { useEffect } from "react";

export function BgSyncListener() {
  useEffect(() => {
    const onOnline = () => {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "sync-data" });
      }
    };
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "sync-done") {
        window.dispatchEvent(new CustomEvent("sts-sync-done"));
      }
    };
    window.addEventListener("online", onOnline);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onMessage);
    }
    if (navigator.onLine) onOnline();
    return () => {
      window.removeEventListener("online", onOnline);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onMessage);
      }
    };
  }, []);

  return null;
}
