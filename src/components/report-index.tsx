"use client";

import Link from "next/link";
import { localized, useLocale } from "@/lib/locale";
import type { ResearchReportManifestV2 } from "@/lib/types";

export function ReportIndex({ runSlug, reports }: { runSlug: string; reports: ResearchReportManifestV2[] }) {
  const { locale, t } = useLocale();
  const visible = reports.filter((report) => report.language === locale).sort((a, b) => a.display_order - b.display_order);
  return <section className="secondary-document-page"><h1>{t("reportsDownloads")}</h1><p>{locale === "ko" ? "보고서는 과학적 역할과 언어에 따라 표시됩니다." : "Reports are organized by scientific role and language."}</p><div className="document-list">{visible.map((report) => <article key={report.report_id}><div><p className="document-role">{report.role.replaceAll("_", " ")}</p><h2>{localized(report.localized_title, locale)}</h2><p>{report.page_count ? `${report.page_count} ${t("pages")}` : locale === "ko" ? "온라인 문서" : "Online document"}{report.reference_count ? ` • ${report.reference_count} ${t("references")}` : ""}</p></div><div className="document-actions"><Link href={`/runs/${runSlug}/reports/${report.report_id}/`}>{t("readOnline")}</Link></div></article>)}</div></section>;
}
