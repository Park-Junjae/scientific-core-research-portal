import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getRuns } from "@/lib/content";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Scientific Core",
    template: "%s | Scientific Core",
  },
  description: "A static, readable workspace for approved Scientific Core research runs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const recentRuns = getRuns().slice(0, 5).map(({ run_id, slug, short_title, status }) => ({
    run_id,
    slug,
    short_title,
    status,
  }));

  return (
    <html lang="en">
      <body>
        <AppShell recentRuns={recentRuns}>{children}</AppShell>
      </body>
    </html>
  );
}
