import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "University of Ghana · Student Portal",
  description:
    "Modern frontend for the University of Ghana Student Self-Service (STS) portal.",
  icons: { icon: "/brand/sts-icon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
