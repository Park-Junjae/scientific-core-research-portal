import type { Metadata } from "next";
import "./pretendard.css";
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
  metadataBase: new URL("https://app.aichoscientist.com"),
  title: {
    default: "AI Cho-Scientist",
    template: "%s | AI Cho-Scientist",
  },
  description: "문헌, 아이디어, 기전 분석과 연구 보고서를 통합하는 AI 연구 워크스페이스",
  applicationName: "AI Cho-Scientist",
  openGraph: {
    title: "AI Cho-Scientist",
    description: "문헌, 아이디어, 기전 분석과 연구 보고서를 통합하는 AI 연구 워크스페이스",
    type: "website",
    siteName: "AI Cho-Scientist",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const recentRuns = getRuns()
    .filter((run) => run.publication_status !== "DEMO_ONLY")
    .slice(0, 10)
    .map(({ run_id, slug, short_title, status }) => ({
      run_id,
      slug,
      short_title,
      status,
    }));

  return (
    <html lang="ko" data-font-family="Pretendard Variable">
      <body>
        <AppShell recentRuns={recentRuns}>{children}</AppShell>
      </body>
    </html>
  );
}
