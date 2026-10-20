"use client";

import { useEffect, useState } from "react";
import { BellIcon } from "@/components/icons";

type Props = {
  className?: string;
};

const READ_KEY = "sts_notifs_last_read";

export function NotificationBadge({ className = "" }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        // Try cached first for offline
        let items: any[] = [];
        if (typeof caches !== "undefined") {
          const cache = await caches.open("sts-data-v1").catch(() => null);
          if (cache) {
            const res = await cache.match("/api/notifications").catch(() => null);
            if (res) {
              const json = await res.json().catch(() => null);
              if (Array.isArray(json)) items = json;
            }
          }
        }
        if (items.length === 0) {
          const res = await fetch("/api/notifications", {
            cache: "no-store",
            credentials: "include",
          });
          if (res.ok) {
            items = (await res.json().catch(() => [])) as any[];
            if (typeof caches !== "undefined") {
              const cache = await caches.open("sts-data-v1").catch(() => null);
              cache?.put("/api/notifications", new Response(JSON.stringify(items)));
            }
          }
        }
        const lastRead = parseInt(localStorage.getItem(READ_KEY) || "0", 10);
        const unread = items.filter((n) => {
          const t = n?.created_at || n?.date || n?.time || "";
          const ts = t ? Date.parse(t) : 0;
          if (ts) return ts > lastRead;
          return true;
        }).length;
        if (alive) setCount(Math.min(unread, 99));
      } catch {
        // ignore
      }
    };

    load();
    const onSync = () => load();
    window.addEventListener("sts-sync-done", onSync);
    return () => {
      alive = false;
      window.removeEventListener("sts-sync-done", onSync);
    };
  }, []);

  return (
    <span className={`relative inline-flex ${className}`}>
      <BellIcon className="h-[18px] w-[18px]" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-semibold text-white">
          {count}
        </span>
      )}
    </span>
  );
}

export function markNotificationsRead() {
  if (typeof window === "undefined") return;
  localStorage.setItem(READ_KEY, String(Date.now()));
}
