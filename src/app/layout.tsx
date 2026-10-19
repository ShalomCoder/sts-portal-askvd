import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "University of Ghana · Student Portal",
  description:
    "Modern frontend for the University of Ghana Student Self-Service (STS) portal.",
  applicationName: "UG Student Portal",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UG Portal",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/brand/sts-icon.png",
    apple: "/brand/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#200060",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
