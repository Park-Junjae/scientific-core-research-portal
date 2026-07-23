"use client";

import Link from "next/link";
import { Download, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/display";
import { localized, useLocale } from "@/lib/locale";
import { lifecycleLabels, scoreVector } from "@/lib/portfolio";
import { withBasePath } from "@/lib/paths";
import type { ResearchIdeaManifest, ResearchReportManifestV2, ResearchSourceManifestV1 } from "@/lib/types";
import { SourceList } from "./source-list";

function reportVariant(reports: ResearchReportManifestV2[], id: string | null, locale: "ko" | "en") {
  if (!id) return null;
  const base = reports.find((report) => report.report_id === id);
  if (!base) return null;
  return reports.find((report) => report.translation_group_id === base.translation_group_id && report.language === locale) ?? null;
}

export function IdeaReader({ idea, runSlug, reports, sources }: { idea: ResearchIdeaManifest; runSlug: string; reports: ResearchReportManifestV2[]; sources: ResearchSourceManifestV1[] }) {
  const { locale, t } = useLocale();
  const report = reportVariant(reports, idea.report_id, locale);
  const baseReport = idea.report_id ? reports.find((item) => item.report_id === idea.report_id) : null;
  const missingTranslation = Boolean(baseReport && !report);
  const keyLiterature = sources.filter((source) => source.related_idea_ids.includes(idea.idea_id)).sort((a, b) => Number(b.load_bearing) - Number(a.load_bearing) || (a.display_order ?? 9999) - (b.display_order ?? 9999)).slice(0, 5);
  return <article className="idea-reading-page">
    <Link className="back-link" href={`/runs/${runSlug}/ideas/`}>{locale === "ko" ? "아이디어 목록으로" : "Back to ideas"}</Link>
    <header className="idea-reader-header"><p className="idea-role-line">{lifecycleLabels[locale][idea.lifecycle_status]}</p><h1>{localized(idea.title, locale) ?? t("noTranslation")}</h1><p>{localized(idea.abstract, locale) ?? t("noTranslation")}</p><div className="idea-meta-line"><span>{localized(idea.disposition, locale) ?? t("noTranslation")}</span><span>•</span><span>{t("updated")} {formatDate(idea.updated_at, locale)}</span></div></header>
    <div className="idea-narrative"><section><h2>{t("whyIdea")}</h2><p>{localized(idea.why_this_idea, locale) ?? t("noTranslation")}</p></section><section><h2>{t("evidence")}</h2><p>{localized(idea.evidence_basis, locale) ?? t("noTranslation")}</p></section></div>
    {keyLiterature.length > 0 && <section className="idea-key-literature"><h2>{t("keyPapers")}</h2><SourceList runSlug={runSlug} sources={keyLiterature} compact /></section>}
    <div className="idea-narrative"><section><h2>{t("proposedComparison")}</h2><p>{localized(idea.proposed_comparison, locale) ?? t("noTranslation")}</p></section><section><h2>{t("expectedResult")}</h2><p>{localized(idea.expected_result, locale) ?? t("noTranslation")}</p></section></div>
    <section className="idea-main-report"><h2>{t("mainReport")}</h2>{report ? <div className="document-heading"><div><h3>{localized(report.localized_title, locale)}</h3><p>{report.page_count ? `${report.page_count} ${t("pages")}` : null}{report.reference_count ? ` • ${report.reference_count} ${t("references")}` : ""}</p></div><div className="document-actions"><Link href={`/runs/${runSlug}/reports/${report.report_id}/`}>{t("readOnline")}</Link>{report.path && <><a href={withBasePath(report.path)} target="_blank" rel="noreferrer"><ExternalLink size={16} />{t("openPdf")}</a><a href={withBasePath(report.path)} download><Download size={16} />{t("download")}</a></>}</div></div> : missingTranslation ? <div className="translation-missing"><span>{t("noTranslation")}</span></div> : <div className="summary-only"><h3>{t("summaryOnly")}</h3><p>{localized(idea.scientific_summary, locale) ?? t("noTranslation")}</p><small>{t("noDedicatedReport")}</small></div>}</section>
    <details className="evaluation-details"><summary>{t("detailedEvaluation")}</summary><div><dl className="evaluation-grid"><div><dt>{locale === "ko" ? "인과 기전" : "Causal mechanism"}</dt><dd>{localized(idea.causal_mechanism, locale) ?? t("noTranslation")}</dd></div><div><dt>{locale === "ko" ? "가장 약한 인과 연결" : "Weakest causal edge"}</dt><dd>{localized(idea.weakest_causal_edge, locale) ?? t("noTranslation")}</dd></div><div><dt>{locale === "ko" ? "다음 판별 실험" : "Next discriminating experiment"}</dt><dd>{localized(idea.next_discriminating_experiment, locale) ?? t("noTranslation")}</dd></div><div><dt>{locale === "ko" ? "중단 조건" : "Stop condition"}</dt><dd>{idea.fatal_flaw ? localized(idea.fatal_flaw, locale) : (locale === "ko" ? "기록된 치명적 반대 근거가 없습니다." : "No fatal objection is recorded.")}</dd></div></dl>{idea.scorecard && <div className="scorecard"><h3>{locale === "ko" ? "다축 평가" : "Multi-axis evaluation"}</h3><div>{scoreVector(idea, locale).map((item) => <span key={item.axis}><small>{item.label}</small><strong>{item.score}<i>/5</i></strong></span>)}</div></div>}<section className="reviewer-profile"><h3>{locale === "ko" ? "검토자 의견" : "Reviewer critiques"}</h3><ul>{idea.reviewer_critiques.map((critique, index) => <li key={index}>{localized(critique, locale) ?? t("noTranslation")}</li>)}</ul>{idea.reviewer_disagreement && <p>{localized(idea.reviewer_disagreement, locale) ?? t("noTranslation")}</p>}</section></div></details>
  </article>;
}
