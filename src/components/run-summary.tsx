"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { localized, localizedList, useLocale } from "@/lib/locale";
import { withBasePath } from "@/lib/paths";
import type { ResearchReportManifestV2, RunWithIdeas } from "@/lib/types";
import { keySources } from "@/lib/literature";
import { LiteratureScope } from "./literature-scope";
import { SourceList } from "./source-list";
import { RunPortfolioSummary } from "./run-portfolio-summary";

function variantsForLocale(reports: ResearchReportManifestV2[], locale: "ko" | "en") {
  const groups = Array.from(new Set(reports.filter((report) => ["KNOWLEDGE_BACKGROUND", "IDEA_REPORT", "PORTFOLIO_DECISION", "MEASUREMENT_REPORT", "RESEARCH_SUMMARY"].includes(report.role)).map((report) => report.translation_group_id)));
  return groups.map((group) => reports.find((report) => report.translation_group_id === group && report.language === locale)).filter((report): report is ResearchReportManifestV2 => Boolean(report)).sort((a, b) => a.display_order - b.display_order);
}

export function RunSummary({ run }: { run: RunWithIdeas }) {
  const { locale, t } = useLocale();
  const reports = variantsForLocale(run.reports, locale);
  const readingOrder = localizedList(run.reading_order, locale);
  const successCriteria = localizedList(run.success_criteria, locale);
  const keyLiterature = keySources(run.sources, 5);
  return <div className="summary-document">
    <section className="summary-conclusion"><p className="section-label">{locale === "ko" ? "현재 결론" : "Current conclusion"}</p><p className="long-lede">{localized(run.scientific_decision, locale) ?? t("noTranslation")}</p></section>
    <div className="summary-priority-grid">
      <section><p className="section-label">{t("researchQuestion")}</p><h2>{localized(run.research_question, locale) ?? t("noTranslation")}</h2></section>
      <section><h2>{locale === "ko" ? "과학적 근거" : "Scientific rationale"}</h2><p>{localized(run.summary, locale) ?? t("noTranslation")}</p></section>
      <section><h2>{locale === "ko" ? "핵심 불확실성" : "Key uncertainty"}</h2><p>{localized(run.current_bottleneck, locale) ?? t("noTranslation")}</p></section>
      <section><h2>{locale === "ko" ? "다음 판단 기준" : "Next decision criterion"}</h2><p>{successCriteria[0] ?? (locale === "ko" ? "다음 검증 기준이 공개되지 않았습니다." : "The next validation criterion is not public.")}</p></section>
    </div>
    <section><h2>{t("mainReports")}</h2><div className="document-list">{reports.map((report) => <article key={report.report_id}><div><p className="document-role">{report.role.replaceAll("_", " ")}</p><h3>{localized(report.localized_title, locale)}</h3><p>{report.page_count ? `${report.page_count} ${t("pages")}` : locale === "ko" ? "온라인 문서" : "Online document"}{report.reference_count ? ` • ${report.reference_count} ${t("references")}` : ""}</p></div><div className="document-actions"><Link href={`/runs/${run.slug}/reports/${report.report_id}/`}>{t("readOnline")}</Link>{report.path && <a href={withBasePath(report.path)} target="_blank" rel="noreferrer"><ExternalLink size={16} />{t("openPdf")}</a>}</div></article>)}</div></section>
    <section><h2>{locale === "ko" ? "근거 상태" : "Evidence state"}</h2><LiteratureScope stats={run.literature_stats} /><Link className="text-action" href={`/runs/${run.slug}/literature/`}>{locale === "ko" ? "문헌 근거 전체 보기" : "Review all literature evidence"}</Link>{keyLiterature.length > 0 && <SourceList runSlug={run.slug} sources={keyLiterature} compact />}</section>
    <details className="portfolio-details"><summary>{t("portfolioDecision")}</summary><RunPortfolioSummary run={run} /></details>
    <section><h2>{t("readingOrder")}</h2><ol className="reading-order">{readingOrder.map((item) => <li key={item}>{item}</li>)}</ol></section>
  </div>;
}
