"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale";

export type RunTab = "Ideas" | "Literature" | "Knowledge" | "Summary" | "Specification" | "Reports" | "Files" | "Technical";

export function RunTabs({
  slug,
  active,
  showReports,
}: {
  slug: string;
  active: RunTab;
  showReports: boolean;
}) {
  const { t } = useLocale();
  const tabs = [
    ["summary/", t("summary"), "Summary"],
    ["ideas/", t("ideas"), "Ideas"],
    ["literature/", t("literature"), "Literature"],
    ["knowledge/", t("knowledge"), "Knowledge"],
    ["specification/", t("specification"), "Specification"],
    ...(showReports ? [["reports/", t("report"), "Reports"] as const] : []),
  ] as const;
  return <nav className="run-tabs" aria-label="Run sections">{tabs.map(([suffix, label, key]) => <Link key={key} href={`/runs/${slug}/${suffix}`} className={active === key ? "active" : ""} aria-current={active === key ? "page" : undefined}>{label}</Link>)}<details className="more-menu"><summary>{t("more")}</summary><div><Link href={`/runs/${slug}/files/`}>{t("files")}</Link><Link href={`/runs/${slug}/#technical-details`}>{t("technical")}</Link></div></details></nav>;
}
