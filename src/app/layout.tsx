import type { Metadata } from "next";
import "@fontsource/noto-sans-kr/korean-400.css";
import "@fontsource/noto-sans-kr/korean-500.css";
import "@fontsource/noto-sans-kr/korean-600.css";
import "@fontsource/noto-sans-kr/korean-700.css";
import "@fontsource/noto-sans-kr/latin-400.css";
import "@fontsource/noto-sans-kr/latin-500.css";
import "@fontsource/noto-sans-kr/latin-600.css";
import "@fontsource/noto-sans-kr/latin-700.css";
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
  const recentRuns = getRuns().slice(0, 10).map(({ run_id, slug, short_title, status }) => ({
    run_id,
    slug,
    short_title,
    status,
  }));

  return (
    <html lang="en" data-font-family="Noto Sans KR">
      <body>
        <AppShell recentRuns={recentRuns}>{children}</AppShell>
      </body>
    </html>
  );
}
