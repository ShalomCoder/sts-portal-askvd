"use client";

import { useEffect, useState } from "react";

export function NetworkStatusBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="mb-4 rounded-xl border border-gold-300 bg-gold-100 px-3 py-2 text-xs text-ink-800">
      You're offline. Some features may be limited.
    </div>
  );
}
