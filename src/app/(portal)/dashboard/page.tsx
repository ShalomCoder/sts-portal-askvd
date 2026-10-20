"use client";

import Link from "next/link";
import { Card, ErrorNote, PageHeader, Skeleton, useAuthedFetch } from "@/components/ui";
import {
  AlertIcon,
  BellIcon,
  BookIcon,
  CalendarIcon,
  CardIcon,
  ChatIcon,
  WalletIcon,
} from "@/components/icons";
import { PullToRefresh } from "@/components/pull-to-refresh";

type Welcome = {
  name: string | null;
  greeting: string | null;
  alerts: { variant: "danger" | "warning" | "info" | "success"; heading: string; body: string }[];
};

const ALERT_STYLES: Record<Welcome["alerts"][number]["variant"], string> = {
  danger: "banner-danger",
  warning: "banner-warn",
  info: "banner-info",
  success: "banner-success",
};

const SHORTCUTS = [
  {
    href: "/pay",
    label: "Pay fees",
    body: "Academic, residential & internship fees",
    icon: WalletIcon,
  },
  {
    href: "/payments",
    label: "Payment history",
    body: "Receipts and GhIPPS references",
    icon: CardIcon,
  },
  {
    href: "/exams",
    label: "Exam schedule",
    body: "Dates, venues and index ranges",
    icon: BookIcon,
  },
  {
    href: "/calendar",
    label: "Academic calendar",
    body: "Registration, lectures & exams",
    icon: CalendarIcon,
  },
  {
    href: "/complaints",
    label: "Lodge a complaint",
    body: "Courses, grades, IT issues",
    icon: ChatIcon,
  },
  {
    href: "/notifications",
    label: "Notifications",
    body: "Announcements from STS",
    icon: BellIcon,
  },
];

export default function DashboardPage() {
  const { data, error, loading, refetch } = useAuthedFetch<Welcome>("/api/welcome");

  const content = (
    <>
      <PageHeader title="Dashboard" subtitle="Overview" />

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      )}

      {!loading && error && <ErrorNote message={error} />}

      {data && (
        <div className="space-y-6">
          {/* greeting */}
          <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-[var(--shadow-card)] sm:p-7">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl"
            />
            <div className="relative">
              <p className="eyebrow">
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h2 className="mt-2 font-serif text-[1.8rem] leading-tight text-ink-900">
                {data.name
                  ? `Hello, ${data.name.split(",")[0].trim()}`
                  : "Welcome"}
              </h2>
              <div className="rule-gold mt-3" />
              <p className="mt-3 max-w-xl text-[0.9rem] leading-relaxed text-ink-600">
                {data.greeting ?? "Signed in to your student self-service portal."}
              </p>
            </div>
          </div>

          {/* alerts from upstream */}
          {data.alerts.length > 0 && (
            <div className="space-y-3">
              {data.alerts.map((a, i) => (
                <div
                  key={i}
                  className={`banner flex items-start gap-3 ${ALERT_STYLES[a.variant]}`}
                >
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    {a.heading && (
                      <p className="font-bold">{a.heading}</p>
                    )}
                    {a.body && <p className="mt-0.5">{a.body}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* shortcuts */}
          <section>
            <p className="eyebrow mb-2">Quick access</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SHORTCUTS.map((s) => {
                const Icon = s.icon;
                return (
                  <Link key={s.href} href={s.href}>
                    <Card className="group h-full transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop p-4">
                      <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="text-[0.95rem] font-semibold text-ink-900">{s.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-500">
                        {s.body}
                      </p>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </>
  );

  return (
    <PullToRefresh
      onRefresh={async () => {
        await refetch();
      }}
    >
      {content}
    </PullToRefresh>
  );
}
