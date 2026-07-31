"use client";

import { Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/display";
import { localized, useLocale } from "@/lib/locale";
import { usePreferences } from "@/lib/preferences";
import { withBasePath } from "@/lib/paths";
import type { ResearchReportManifestV2, ResearchSourceManifestV1 } from "@/lib/types";
import { MarkdownArticle } from "./markdown-article";
import { PdfViewer } from "./pdf-viewer";

export function ReportReader({ runSlug, selectedId, reports, sources, markdownByReport }: { runSlug: string; selectedId: string; reports: ResearchReportManifestV2[]; sources: ResearchSourceManifestV1[]; markdownByReport: Record<string, string> }) {
  const { locale, t } = useLocale();
  const { preferences } = usePreferences();
  /* "PDF opening" was stored but never read. It now decides whether the page
     viewer is expanded on arrival or left for the reader to open. */
  const inlineViewer = preferences.pdf === "Inline viewer";
  const base = reports.find((report) => report.report_id === selectedId);
  const report = base ? reports.find((candidate) => candidate.translation_group_id === base.translation_group_id && candidate.language === locale) ?? null : null;
  if (!base) return <p>{t("reportUnavailable")}</p>;
  if (!report) return <section className="translation-empty"><h1>{localized(base.localized_title, base.language)}</h1><p>{t("noTranslation")}</p></section>;
  const markdown = markdownByReport[report.report_id]?.replace(/^#\s+[^\r\n]+\r?\n+/, "");
  return <article className="report-reader" data-report-id={report.report_id}>
    <Link className="back-link" href={`/runs/${runSlug}/reports/`}>{locale === "ko" ? "보고서 목록으로" : "Back to reports"}</Link>
    <header><h1>{localized(report.localized_title, locale)}</h1><p>{localized(report.localized_description, locale)}</p><p className="document-meta">{report.role.replaceAll("_", " ")} · {report.page_count ? `${report.page_count} ${t("pages")} · ` : ""}{report.reference_count ? `${report.reference_count} ${t("references")} · ` : ""}{report.language.toUpperCase()} · {formatDate(report.updated_at, locale)}</p><div className="document-actions">{report.path && <><a href={withBasePath(report.path)} target="_blank" rel="noreferrer"><ExternalLink size={16} />{t("openPdf")}</a><a href={withBasePath(report.path)} download><Download size={16} />{t("download")}</a></>}</div></header>
    {markdown && <div id="read"><MarkdownArticle markdown={markdown} runSlug={runSlug} reportId={report.report_id} sources={sources} /></div>}
    {report.path && <details className="inline-pdf" open={inlineViewer}><summary>{locale === "ko" ? "페이지 뷰어 열기" : "Open page viewer"}</summary><PdfViewer src={report.path} title={localized(report.localized_title, locale) ?? report.report_id} reportId={report.report_id} /></details>}
  </article>;
}
