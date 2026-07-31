"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Beaker,
  BookOpen,
  FileText,
  Info,
  Menu,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { localized, useLocale } from "@/lib/locale";
import { withBasePath } from "@/lib/paths";
import { usePreferences } from "@/lib/preferences";
import { useModalDialog } from "@/lib/modal-dialog";
import type { LocalizedText, RunStatus } from "@/lib/types";

export type RecentRunLink = {
  run_id: string;
  slug: string;
  short_title: LocalizedText;
  status: RunStatus;
};

function ProductMark() {
  return (
    <span className="product-mark" aria-hidden="true">
      {/* The mark is a fixed 36px brand asset and images are unoptimized in this
          static export, so next/image would add nothing here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={withBasePath("/brand/app-icon.png")} alt="" width={36} height={36} />
    </span>
  );
}

function LocaleSelector() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="locale-switch" aria-label={locale === "ko" ? "언어 선택" : "Choose language"}>
      <button
        type="button"
        className={locale === "ko" ? "active" : ""}
        onClick={() => setLocale("ko")}
        aria-pressed={locale === "ko"}
      >
        한국어
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        className={locale === "en" ? "active" : ""}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
      >
        English
      </button>
    </div>
  );
}

function Sidebar({
  pathname,
  recentRuns,
  onNavigate,
}: {
  pathname: string;
  recentRuns: RecentRunLink[];
  onNavigate?: () => void;
}) {
  const { locale, t } = useLocale();
  const nav = [
    { href: "/new-run/", label: locale === "ko" ? "새 연구" : "New Research", icon: Plus },
    { href: "/runs/", label: locale === "ko" ? "연구 목록" : "Research Runs", icon: Beaker },
    { href: "/literature/", label: locale === "ko" ? "문헌" : "Literature", icon: BookOpen },
    { href: "/reports/", label: locale === "ko" ? "보고서" : "Reports", icon: FileText },
  ];
  return (
    <aside className="sidebar" aria-label={locale === "ko" ? "주요 탐색" : "Primary navigation"}>
      <Link
        href="/"
        prefetch={false}
        onClick={onNavigate}
        className="sidebar-brand"
        aria-label={locale === "ko" ? "홈으로" : "Go to home"}
      >
        <ProductMark />
        <div>
          <strong>AI Cho-Scientist</strong>
          <span>{locale === "ko" ? "AI 연구 워크스페이스" : "AI Research Workspace"}</span>
        </div>
      </Link>
      <nav className="sidebar-nav">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            prefetch={false}
            onClick={onNavigate}
            className={pathname.startsWith(href) ? "nav-item active" : "nav-item"}
          >
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      {recentRuns.length > 0 && (
        <div className="recent-runs">
          <div className="sidebar-label">{locale === "ko" ? "최근 연구" : "Recent runs"}</div>
          {recentRuns.map((run) => {
          const title = localized(run.short_title, locale) ?? t("noTranslation");
          return (
            <Link
              href={`/runs/${run.slug}/`}
              prefetch={false}
              key={run.run_id}
              className="recent-run"
              onClick={onNavigate}
              title={title}
            >
              <span className={`run-dot ${run.status.toLowerCase()}`} />
              <span>{title}</span>
            </Link>
          );
          })}
        </div>
      )}
      <div className="sidebar-bottom">
        <Link
          href="/about/"
          prefetch={false}
          className={pathname.startsWith("/about") ? "nav-item active" : "nav-item"}
          onClick={onNavigate}
        >
          <Info size={19} />
          <span>{t("about")}</span>
        </Link>
        <Link
          href="/settings/"
          prefetch={false}
          className={pathname.startsWith("/settings") ? "nav-item active" : "nav-item"}
          onClick={onNavigate}
        >
          <Settings size={19} />
          <span>{t("settings")}</span>
        </Link>
      </div>
    </aside>
  );
}

export function SiteNavigation({ recentRuns }: { recentRuns: RecentRunLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { preferences } = usePreferences();
  const closeDrawer = useCallback(() => setOpen(false), []);
  const { ref: drawerRef, onKeyDown: onDrawerKeyDown } =
    useModalDialog<HTMLDivElement>(open, closeDrawer);
  const { locale } = useLocale();
  const visibleRecentRuns = recentRuns.slice(0, preferences.recent);
  return (
    <>
      <div className="global-locale-control"><LocaleSelector /></div>
      <div className="desktop-sidebar">
        <Sidebar pathname={pathname} recentRuns={visibleRecentRuns} />
      </div>
      <header className="mobile-header">
        <button
          className="icon-button"
          type="button"
          aria-label={locale === "ko" ? "탐색 열기" : "Open navigation"}
          onClick={() => setOpen(true)}
        >
          <Menu size={21} />
        </button>
        <Link
          href="/"
          prefetch={false}
          className="mobile-brand"
          aria-label={locale === "ko" ? "홈으로" : "Go to home"}
        >
          <ProductMark />
          <strong>AI Cho-Scientist</strong>
        </Link>
        <span className="mobile-locale-space" aria-hidden="true" />
      </header>
      {open && (
        <div
          className="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={locale === "ko" ? "탐색" : "Navigation"}
          tabIndex={-1}
          ref={drawerRef}
          onKeyDown={onDrawerKeyDown}
        >
          <button
            className="drawer-dismiss"
            aria-label={locale === "ko" ? "탐색 닫기" : "Close navigation"}
            onClick={() => setOpen(false)}
          >
            <X size={22} />
          </button>
          <Sidebar
            pathname={pathname}
            recentRuns={visibleRecentRuns}
            onNavigate={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}
