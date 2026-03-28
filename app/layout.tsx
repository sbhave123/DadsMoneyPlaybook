import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dad's Playbook",
  description:
    "A calm, calendar-driven financial accountability partner for young professionals.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#B2D6B8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="min-h-dvh font-sans antialiased">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
