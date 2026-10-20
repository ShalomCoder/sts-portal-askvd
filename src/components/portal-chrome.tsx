"use client";

import Image from "next/image";
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
import { NotificationBadge } from "@/components/notification-badge";
import { ThemeToggle } from "@/lib/theme";

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
      { href: "/faq", label: "Questions & Answers", icon: HelpIcon },
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

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <Image
        src="/brand/sts-icon.png"
        alt="University of Ghana"
        width={40}
        height={40}
        className="h-10 w-10 object-contain"
      />
      <span className="leading-tight">
        <span className="block text-[0.92rem] font-semibold text-ink-900">
          University of Ghana
        </span>
        <span className="block text-[0.72rem] text-ink-500">
          Student Self-Service
        </span>
      </span>
    </Link>
  );
}

function Nav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col overflow-y-auto pr-1">
      {GROUPS.map((group, gi) => (
        <div key={group.title} className={gi === 0 ? "" : "mt-6"}>
          <p className="mb-1.5 px-3 text-[0.7rem] font-medium tracking-wide text-ink-400">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={
                      "group flex items-center gap-3 rounded-full px-3 py-2 text-[0.9rem] transition " +
                      (active
                        ? "bg-brand-50 font-semibold text-brand-900"
                        : "text-ink-600 hover:bg-ink-100/70 hover:text-ink-900")
                    }
                  >
                    <Icon
                      className={
                        "h-[18px] w-[18px] shrink-0 transition " +
                        (active
                          ? "text-brand-600"
                          : "text-ink-400 group-hover:text-ink-600")
                      }
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

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

  const initial = (name ?? "S").trim().charAt(0).toUpperCase();

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  const footer = (
    <div className="mt-4 border-t border-ink-200/80 pt-4">
      <div className="flex items-center gap-3 px-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.85rem] font-semibold text-ink-800">
            {name ?? "Student"}
          </p>
          <p className="text-[0.7rem] text-ink-400">Signed in</p>
        </div>
      </div>
      <button
        onClick={logout}
        disabled={loggingOut}
        className="mt-3 flex w-full items-center gap-3 rounded-full px-3 py-2 text-[0.9rem] font-medium text-ink-500 transition hover:bg-ink-100/70 hover:text-ink-800 disabled:opacity-50"
      >
        <LogoutIcon className="h-[18px] w-[18px]" />
        {loggingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-[268px]">
      {/* desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[268px] flex-col border-r border-ink-200/80 px-5 py-7 lg:flex">
        <Brand />
        <div className="mt-8 flex flex-1 flex-col overflow-hidden">
          <Nav pathname={pathname} />
        </div>
        {footer}
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-ink-200/70 bg-paper/85 px-4 py-3 backdrop-blur lg:hidden">
        <button
          className="rounded-full p-2 text-ink-600 hover:bg-ink-100"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <Brand />
        <button
          onClick={() => router.push("/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
          aria-label="Open profile"
        >
          {initial}
        </button>
      </header>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[300px] flex-col bg-paper px-5 py-7 shadow-pop">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                className="rounded-full p-2 text-ink-500 hover:bg-ink-100"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-8 flex flex-1 flex-col overflow-hidden">
              <Nav pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            {footer}
          </aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-4xl px-5 pb-24 pt-8 sm:px-8 lg:pt-12">
        <div className="rise">{children}</div>
      </main>
    </div>
  );
}
