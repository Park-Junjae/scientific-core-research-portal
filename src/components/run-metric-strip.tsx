"use client";

import { useLocale } from "@/lib/locale";
import type { LiteratureStats } from "@/lib/types";

export function RunMetricStrip({ stats }: { stats: LiteratureStats }) {
  const { locale, t } = useLocale();
  const parts: string[] = [];
  if (stats.deeply_read !== undefined) parts.push(locale === "ko" ? `${stats.deeply_read}${t("deeplyRead")}` : `${stats.deeply_read} ${t("deeplyRead")}`);
  else if (stats.full_text_reviewed !== undefined) parts.push(locale === "ko" ? `${stats.full_text_reviewed}${t("fullTexts")}` : `${stats.full_text_reviewed} ${t("fullTexts")}`);
  else if (stats.unique_cited_sources !== undefined) parts.push(locale === "ko" ? `${stats.unique_cited_sources}${t("citedSources")}` : `${stats.unique_cited_sources} ${t("citedSources")}`);
  else if (stats.report_reference_count !== undefined) parts.push(locale === "ko" ? `${stats.report_reference_count}${t("reportReferences")}` : `${stats.report_reference_count} ${t("reportReferences")}`);
  if (stats.load_bearing_sources !== undefined) parts.push(locale === "ko" ? `${stats.load_bearing_sources}${t("keyReferences")}` : `${stats.load_bearing_sources} ${t("keyReferences")}`);
  return parts.length ? <p className="literature-line">{parts.join(" • ")}</p> : null;
}
