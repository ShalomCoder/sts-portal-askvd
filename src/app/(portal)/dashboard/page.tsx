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
  const { data, error, loading } = useAuthedFetch<Welcome>("/api/welcome");

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your student self-service overview"
      />

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        </div>
      )}

      {!loading && error && <ErrorNote message={error} />}

      {data && (
        <div className="space-y-6">
          {/* greeting */}
          <Card className="bg-gradient-to-br from-brand-600 to-brand-500 !text-white">
            <p className="text-sm font-medium text-brand-100">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <h2 className="mt-1 text-2xl font-bold">
              {data.name ? `Hello, ${data.name.split(",")[0].trim()}` : "Welcome"}
            </h2>
            <p className="mt-1 text-sm text-brand-100">
              {data.greeting ??
                "Signed in to your student self-service portal."}
            </p>
          </Card>

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SHORTCUTS.map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.href} href={s.href}>
                  <Card className="group h-full transition hover:-translate-y-0.5 hover:shadow-pop">
                    <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="font-semibold text-ink-900">{s.label}</p>
                    <p className="mt-1 text-sm text-ink-500">{s.body}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
