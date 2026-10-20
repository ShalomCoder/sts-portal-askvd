"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { endSession } from "@/lib/client";

type PullToRefreshProps = {
  onRefresh?: () => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
};

const THRESHOLD = 70;

export function PullToRefresh({
  onRefresh,
  children,
  className = "",
}: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => {
      setCanPull(window.scrollY === 0);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    if (!canPull || refreshing) return;
    setStartY(e.touches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!canPull || refreshing || startY === 0) return;
    const y = e.touches[0].clientY - startY;
    if (y > 0) {
      setPullY(Math.min(y * 0.5, THRESHOLD * 1.2));
      if (y > 10) e.preventDefault();
    }
  };

  const onTouchEnd = async () => {
    if (!canPull || refreshing) return;
    if (pullY >= THRESHOLD && onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPullY(0);
    setStartY(0);
  };

  const show = pullY > 0 || refreshing;

  return (
    <div
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        overscrollBehaviorY: "contain",
      }}
    >
      {show && (
        <div
          className="flex items-center justify-center py-2 text-xs text-ink-500"
          style={{ height: refreshing ? 32 : Math.max(16, pullY) }}
        >
          <span
            className={
              refreshing ? "animate-pulse" : pullY >= THRESHOLD ? "text-brand-600" : ""
            }
          >
            {refreshing
              ? "Refreshing..."
              : pullY >= THRESHOLD
              ? "Release to refresh"
              : "Pull to refresh"}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
