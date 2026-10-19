"use client";

import { Card, ErrorNote, PageHeader, Skeleton, useAuthedFetch } from "@/components/ui";

type Profile = {
  fields: { label: string; value: string }[];
  photo: string | null;
};

export default function ProfilePage() {
  const { data, error, loading } = useAuthedFetch<Profile>("/api/profile");

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Personal and academic details held by STS"
      />

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      {!loading && error && <ErrorNote message={error} />}

      {data && (
        <div className="space-y-6">
          <Card className="flex items-center gap-5">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-black text-white">
              {(data.fields.find((f) => f.label.startsWith("NAME"))?.value ??
                "?")
                .trim()
                .charAt(0)
                .toUpperCase()}
            </span>
            <div>
              <p className="text-lg font-bold text-ink-900">
                {data.fields.find((f) => f.label.startsWith("NAME"))?.value ??
                  "Student"}
              </p>
              <p className="text-sm text-ink-500">
                {data.fields.find((f) => f.label.startsWith("PROGRAMME"))
                  ?.value ?? ""}
              </p>
            </div>
          </Card>

          {data.fields.length === 0 ? (
            <Card>
              <p className="text-sm text-ink-500">
                No profile fields were found on the upstream page.
              </p>
            </Card>
          ) : (
            <Card className="!p-0">
              <dl className="divide-y divide-ink-100">
                {data.fields.map((f) => (
                  <div
                    key={f.label}
                    className="grid gap-1 px-6 py-4 sm:grid-cols-[240px_1fr] sm:gap-4"
                  >
                    <dt className="text-xs font-bold uppercase tracking-wider text-ink-400">
                      {f.label}
                    </dt>
                    <dd className="text-sm font-medium text-ink-900">
                      {f.value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
