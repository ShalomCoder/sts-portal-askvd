import { cookies } from "next/headers";
import PortalChrome from "@/components/portal-chrome";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const raw = jar.get("sts_name")?.value;
  let name: string | null = null;
  if (raw) {
    try {
      name = decodeURIComponent(raw);
    } catch {
      name = raw;
    }
  }

  return <PortalChrome name={name}>{children}</PortalChrome>;
}
