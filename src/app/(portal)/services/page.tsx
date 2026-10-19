"use client";

import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import {
  BookIcon,
  CardIcon,
  ClipboardIcon,
  ExternalIcon,
  UserIcon,
  WalletIcon,
} from "@/components/icons";
import { EXTERNAL_SERVICES, SERVICES } from "@/lib/services";
import type { ComponentType, SVGProps } from "react";

const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  book: BookIcon,
  clipboard: ClipboardIcon,
  user: UserIcon,
  doc: CardIcon,
  wallet: WalletIcon,
};

function groupServices() {
  const groups = new Map<string, typeof SERVICES>();
  for (const s of SERVICES) {
    const list = groups.get(s.group) ?? [];
    list.push(s);
    groups.set(s.group, list);
  }
  return [...groups.entries()];
}

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        title="More Services"
        subtitle="Registration, certificates, finance and welfare — handled inside this portal."
      />

      <div className="space-y-9">
        {groupServices().map(([group, items]) => (
          <section key={group}>
            <h2 className="mb-3 font-serif text-xl text-ink-900">{group}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const Icon = ICONS[item.icon] ?? ClipboardIcon;
                return (
                  <Link key={item.slug} href={`/services/${item.slug}`}>
                    <Card className="group h-full transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop">
                      <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="font-semibold text-ink-900">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-500">
                        {item.summary}
                      </p>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {EXTERNAL_SERVICES.map((group) => (
          <section key={group.group}>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="font-serif text-xl text-ink-900">{group.group}</h2>
              <ExternalIcon className="h-4 w-4 text-ink-300" />
            </div>
            <p className="mb-3 max-w-2xl text-sm leading-relaxed text-ink-500">
              {group.note}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => {
                const external = item.href.startsWith("http");
                const body = (
                  <Card className="group h-full border-dashed transition duration-200 hover:-translate-y-0.5 hover:border-brand-200">
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
                      <ExternalIcon className="h-5 w-5" />
                    </span>
                    <p className="font-semibold text-ink-900">{item.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">
                      {item.body}
                    </p>
                  </Card>
                );
                return external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {body}
                  </a>
                ) : (
                  <Link key={item.label} href={item.href}>
                    {body}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
