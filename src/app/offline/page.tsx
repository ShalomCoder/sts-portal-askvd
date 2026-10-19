import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline · Student Portal",
};

/**
 * Shown by the service worker when a navigation fails while offline.
 * Static and public — it must render without a session.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <Image
          src="/brand/sts-icon.png"
          alt="University of Ghana"
          width={64}
          height={64}
          className="mx-auto h-16 w-16 object-contain"
        />
        <h1 className="mt-6 font-serif text-[1.9rem] leading-tight text-ink-900">
          You&apos;re offline
        </h1>
        <div className="rule-gold mx-auto mt-3" />
        <p className="mt-4 text-sm leading-relaxed text-ink-600">
          This page needs a live connection to the university system, so it
          can&apos;t be shown from a cache. Reconnect and try again.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link href="/dashboard" className="btn btn-primary">
            Try again
          </Link>
          <Link href="/login" className="btn btn-ghost">
            Sign in
          </Link>
        </div>
        <p className="mt-10 text-xs text-ink-400">
          Unofficial frontend · connects securely to sts.ug.edu.gh
        </p>
      </div>
    </main>
  );
}
