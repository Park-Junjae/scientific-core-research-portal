import type { ReactNode } from "react";
import { PreferencesProvider } from "@/lib/preferences";
import { LocaleProvider } from "@/lib/locale";
import { SiteNavigation, type RecentRunLink } from "./site-navigation";
import { SkipLink } from "./skip-link";

export function AppShell({
  children,
  recentRuns,
}: {
  children: ReactNode;
  recentRuns: RecentRunLink[];
}) {
  return (
    <LocaleProvider>
      <PreferencesProvider>
        <div className="app-shell">
          <SkipLink />
          <SiteNavigation recentRuns={recentRuns} />
          <main id="main-content" className="main-content" tabIndex={-1}>{children}</main>
        </div>
      </PreferencesProvider>
    </LocaleProvider>
  );
}
