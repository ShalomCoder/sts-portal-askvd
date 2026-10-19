import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import ServiceForm from "@/components/service-form";
import { getService } from "@/lib/services";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const spec = getService((await params).slug);
  return { title: spec ? `${spec.title} · Student Portal` : "Service" };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const spec = getService(slug);
  if (!spec) notFound();

  return (
    <>
      <Link
        href="/services"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-700"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All services
      </Link>

      <PageHeader title={spec.title} subtitle={spec.subtitle} />

      <ServiceForm spec={spec} />
    </>
  );
}
