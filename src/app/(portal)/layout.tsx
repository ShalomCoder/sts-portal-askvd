import { cookies } from "next/headers";
import PortalChrome from "@/components/portal-chrome";
import { SessionTimeoutModal } from "@/components/session-timeout";
import { NetworkStatusBanner } from "@/components/network-status";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { BgSyncListener } from "@/components/bg-sync-listener";

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

  return (
    <PortalChrome name={name}>
      <NetworkStatusBanner />
      <PwaInstallBanner />
      {children}
      <SessionTimeoutModal />
      <BgSyncListener />
    </PortalChrome>
  );
}
