"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Beaker,
  ChevronRight,
  FlaskConical,
  Info,
  Menu,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { usePreferences } from "@/lib/preferences";
import type { RunStatus } from "@/lib/types";

export type RecentRunLink = {
  run_id: string;
  slug: string;
  short_title: string;
  status: RunStatus;
};

function ProductMark() {
  return (
    <span className="product-mark" aria-hidden="true">
      <FlaskConical size={18} strokeWidth={2.2} />
    </span>
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
  const nav = [
    { href: "/new-run/", label: "New Run", icon: Plus },
    { href: "/runs/", label: "Runs", icon: Beaker },
  ];

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar-brand">
        <ProductMark />
        <div>
          <strong>Scientific Core</strong>
          <span>Research Workspace</span>
        </div>
      </div>
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
      <div className="recent-runs">
        <div className="sidebar-label">Recent runs</div>
        {recentRuns.map((run) => (
          <Link
            href={`/runs/${run.slug}/`}
            prefetch={false}
            key={run.run_id}
            className="recent-run"
            onClick={onNavigate}
          >
            <span className={`run-dot ${run.status.toLowerCase()}`} />
            <span>{run.short_title}</span>
            <ChevronRight size={14} />
          </Link>
        ))}
      </div>
      <div className="sidebar-bottom">
        <Link
          href="/about/"
          prefetch={false}
          className={pathname.startsWith("/about") ? "nav-item active" : "nav-item"}
          onClick={onNavigate}
        >
          <Info size={19} />
          <span>About</span>
        </Link>
        <Link
          href="/settings/"
          prefetch={false}
          className={pathname.startsWith("/settings") ? "nav-item active" : "nav-item"}
          onClick={onNavigate}
        >
          <Settings size={19} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}

export function SiteNavigation({ recentRuns }: { recentRuns: RecentRunLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { preferences } = usePreferences();
  const visibleRecentRuns = recentRuns.slice(0, preferences.recent);

  return (
    <>
      <div className="desktop-sidebar">
        <Sidebar pathname={pathname} recentRuns={visibleRecentRuns} />
      </div>
      <header className="mobile-header">
        <button
          className="icon-button"
          type="button"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
        >
          <Menu size={21} />
        </button>
        <Link href="/runs/" prefetch={false} className="mobile-brand">
          <ProductMark />
          <strong>Scientific Core</strong>
        </Link>
      </header>
      {open && (
        <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            className="drawer-dismiss"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X size={22} />
          </button>
          <Sidebar pathname={pathname} recentRuns={visibleRecentRuns} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
