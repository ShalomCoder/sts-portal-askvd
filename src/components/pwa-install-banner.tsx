"use client";

import { usePwaInstall } from "./pwa-provider";

export function PwaInstallBanner() {
  const { showPrompt, install, dismiss } = usePwaInstall();

  if (!showPrompt) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-900">
      <span>Install the UG Portal for faster access.</span>
      <div className="flex gap-2">
        <button onClick={install} className="btn btn-primary py-1.5 px-3 text-xs">
          Install
        </button>
        <button onClick={dismiss} className="btn btn-ghost py-1.5 px-3 text-xs">
          Dismiss
        </button>
      </div>
    </div>
  );
}
