"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ComponentType, type SVGProps } from "react";
import {
  AlertIcon,
  BellIcon,
  BookIcon,
  CalendarIcon,
  CardIcon,
  ChatIcon,
  ClipboardIcon,
  GridIcon,
  HelpIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  PinIcon,
  UserIcon,
  WalletIcon,
  XIcon,
  MegaphoneIcon,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
      { href: "/profile", label: "My Profile", icon: UserIcon },
      { href: "/notifications", label: "Notifications", icon: BellIcon },
    ],
  },
  {
    title: "Academics",
    items: [
      { href: "/exams", label: "Exam Schedule", icon: BookIcon },
      { href: "/calendar", label: "Academic Calendar", icon: CalendarIcon },
      { href: "/faq", label: "FAQ", icon: HelpIcon },
    ],
  },
  {
    title: "Finances",
    items: [
      { href: "/pay", label: "Pay Fees", icon: WalletIcon },
      { href: "/payments", label: "Payment History", icon: CardIcon },
    ],
  },
  {
    title: "Support",
    items: [
      { href: "/evaluation", label: "Course Evaluation", icon: ClipboardIcon },
      { href: "/complaints", label: "Complaints", icon: ChatIcon },
      { href: "/exam-complaint", label: "Exam Complaint", icon: AlertIcon },
      { href: "/suggestions", label: "Suggestions", icon: MegaphoneIcon },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/pin-reset", label: "Reset PIN", icon: PinIcon },
      { href: "/services", label: "More Services", icon: GridIcon },
    ],
  },
];

export default function PortalChrome({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  const sidebar = (
    <nav className="flex h-full flex-col gap-6 p-5">
      <Link href="/dashboard" className="flex items-center gap-3 px-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-black text-white">
          S
        </span>
        <span className="text-[15px] font-bold text-white">
          UG Student Portal
        </span>
      </Link>

      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-ink-500">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition " +
                        (active
                          ? "bg-brand-600 text-white shadow-md shadow-brand-900/40"
                          : "text-ink-300 hover:bg-white/5 hover:text-white")
                      }
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-4">
        <button
          onClick={logout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink-300 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
        >
          <LogoutIcon className="h-[18px] w-[18px]" />
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink-50 lg:pl-[264px]">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] bg-ink-950 lg:block">
        {sidebar}
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-ink-950 shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      {/* topbar */}
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <button
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            {name && (
              <span className="hidden max-w-[240px] truncate text-sm font-semibold text-ink-700 sm:block">
                {name}
              </span>
            )}
            <button
              onClick={() => router.push("/profile")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white"
              aria-label="Open profile"
            >
              {(name ?? "S").trim().charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="rise">{children}</div>
      </main>
    </div>
  );
}
