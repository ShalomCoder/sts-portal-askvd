"use client";

import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { ExternalIcon, GridIcon } from "@/components/icons";

/**
 * Long-tail services that are not rebuilt in this portal. Each links to the
 * official STS page (opens in a new tab; you may be asked to sign in again
 * there, since STS sessions are separate).
 */

const STS = "https://sts.ug.edu.gh/services";

const SERVICE_GROUPS: {
  title: string;
  items: { label: string; href: string; body: string }[];
}[] = [
  {
    title: "Registration & records",
    items: [
      {
        label: "Resit registration",
        href: `${STS}/resit`,
        body: "Register to resit failed courses",
      },
      {
        label: "Specialisation",
        href: `${STS}/provide-specialization`,
        body: "Choose your programme specialisation",
      },
      {
        label: "Transcript (landed)",
        href: `${STS}/transcript-land`,
        body: "Request an official transcript",
      },
      {
        label: "WES transcript",
        href: `${STS}/wes/home`,
        body: "Transcripts for WES evaluation",
      },
      {
        label: "Deferment",
        href: `${STS}/deferment`,
        body: "Apply for a deferment of studies",
      },
      {
        label: "Matriculation",
        href: `${STS}/matriculation`,
        body: "Matriculation information",
      },
    ],
  },
  {
    title: "Medical & welfare",
    items: [
      {
        label: "Medical examination",
        href: `${STS}/medical`,
        body: "Book and track your medical exam",
      },
      {
        label: "E-medical",
        href: `${STS}/emedical`,
        body: "Electronic medical records",
      },
      {
        label: "STARLife",
        href: `${STS}/starlife`,
        body: "Student health insurance",
      },
      {
        label: "Psychological support",
        href: `${STS}/psycho/intro`,
        body: "Counselling services",
      },
    ],
  },
  {
    title: "Funding & finance",
    items: [
      {
        label: "Student loan",
        href: `${STS}/studentloan`,
        body: "Apply for a student loan",
      },
      {
        label: "Internship payments",
        href: `${STS}/internship-payments`,
        body: "Internship allowance information",
      },
      {
        label: "Request a refund",
        href: `${STS}/requestrefund`,
        body: "Refund of overpaid fees",
      },
    ],
  },
  {
    title: "Certificates & letters",
    items: [
      {
        label: "Employment letter",
        href: `${STS}/emp-letter`,
        body: "Download a student status letter",
      },
      {
        label: "ID card payment",
        href: `${STS}/pay/idcard`,
        body: "Pay for your student ID card",
      },
      {
        label: "Request a certificate",
        href: `${STS}/request-certificate`,
        body: "Request an academic certificate",
      },
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        title="More Services"
        subtitle="Additional university services — these open on the official site"
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-ink-200 bg-white p-4 text-sm text-ink-600">
        <ExternalIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
        <p>
          The services below are not replicated in this portal. Each opens the
          official STS page in a new tab. You may need to sign in there again.
        </p>
      </div>

      <div className="space-y-8">
        {SERVICE_GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="mb-3 text-lg font-bold text-ink-900">
              {group.title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <Link key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">
                  <Card className="group h-full transition hover:-translate-y-0.5 hover:shadow-pop">
                    <div className="flex items-start justify-between gap-3">
                      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                        <GridIcon className="h-5 w-5" />
                      </span>
                      <ExternalIcon className="h-4 w-4 text-ink-300" />
                    </div>
                    <p className="font-semibold text-ink-900">{item.label}</p>
                    <p className="mt-1 text-sm text-ink-500">{item.body}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
