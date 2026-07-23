"use client";

import Link from "next/link";
import { formatDate } from "@/lib/display";
import { localized, useLocale } from "@/lib/locale";
import { runModeLabels } from "@/lib/portfolio";
import type { ResearchRunManifest } from "@/lib/types";
import { LocalizedContent } from "./localized-content";
import { StatusBadge } from "./status-badge";

export function RunHeader({ run }: { run: ResearchRunManifest }) {
  const { locale, t } = useLocale();
  const tags = run.tags.map((tag) => localized(tag, locale)).filter((tag): tag is string => Boolean(tag));
  return <header className="run-header">
    <div className="breadcrumb"><Link href="/runs/">{t("runs")}</Link><span>/</span><LocalizedContent value={run.short_title} /></div>
    <div className="run-heading-line"><div><LocalizedContent value={run.title} as="h1" /><LocalizedContent value={run.subtitle} as="p" /></div></div>
    <div className="run-metadata-line"><StatusBadge status={run.status} /><span aria-hidden="true">•</span><span>{runModeLabels[locale][run.run_mode]}</span><span aria-hidden="true">•</span><LocalizedContent value={run.research_domain} /><span aria-hidden="true">•</span><span>{t("updated")} {formatDate(run.updated_at, locale)}</span></div>
    {tags.length > 0 && <p className="plain-tags">{tags.join(" • ")}</p>}
  </header>;
}
