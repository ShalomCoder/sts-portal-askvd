"use client";

import Link from "next/link";
import { Card, PageHeader, Skeleton, useAuthedFetch } from "@/components/ui";
import { PinIcon } from "@/components/icons";

type PhonesResponse = { status?: string; phones?: string[] | null };

export default function PinResetPage() {
  const { data, loading } = useAuthedFetch<PhonesResponse>(
    "/api/sts/fetch-phone-numbers",
  );
  const phones = Array.isArray(data?.phones) ? data!.phones! : [];

  return (
    <>
      <PageHeader
        title="Reset PIN"
        subtitle="Recover access to your Student ID or PIN"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <PinIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-bold text-ink-900">
                PIN recovery is handled by the official form
              </h2>
              <p className="mt-2 text-sm text-ink-600">
                For security, resetting a forgotten Student ID or PIN requires
                proof of identity and is processed by the university. The
                recovery form asks for your student status, entry/completion
                years, contact details and a scanned national ID.
              </p>

              <div className="banner banner-info mt-4">
                <strong>Continuing students</strong> must reset their PIN via
                MISWeb instead.
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/forgot-pin" className="btn btn-primary">
                  Open recovery form
                </Link>
                <a
                  href="https://ienabler.ug.edu.gh/pls/prodi41/w99pkg.mi_login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                >
                  Go to MISWeb
                </a>
              </div>
            </div>
          </div>
        </Card>

        <aside className="space-y-4">
          <Card>
            <h3 className="font-semibold text-ink-900">Tips</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-600">
              <li>Have your national ID card ready as a scanned image.</li>
              <li>Use the same email and phone on record with UG.</li>
              <li>
                Recovery requests are reviewed manually — allow a few working
                days.
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className="font-semibold text-ink-900">Support contacts</h3>
            {loading && <Skeleton className="mt-3 h-10 w-full" />}
            {!loading && phones.length === 0 && (
              <p className="mt-2 text-sm text-ink-500">
                No published support numbers for your account. Contact your
                college office.
              </p>
            )}
            {phones.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                {phones.map((p, i) => (
                  <li key={i}>
                    <a
                      href={`tel:${p.replace(/\s/g, "")}`}
                      className="font-semibold text-brand-600 hover:underline"
                    >
                      {p}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
