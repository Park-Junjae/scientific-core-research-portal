"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { localized, useLocale } from "@/lib/locale";
import { ideaMatchesLifecycle, lifecycleFilterLabels, lifecycleFilters, lifecycleLabels, type LifecycleFilter } from "@/lib/portfolio";
import type { ResearchIdeaManifest, RunMode } from "@/lib/types";

const roleLabels = {
  en: { PRIMARY: "Primary", ALTERNATIVE: "Alternative", CONDITIONAL: "Conditional", MEASUREMENT_PROGRAM: "Measurement program", EXTENSION: "Extension", SUPPORTING: "Supporting" },
  ko: { PRIMARY: "주요", ALTERNATIVE: "대안", CONDITIONAL: "조건부", MEASUREMENT_PROGRAM: "측정 프로그램", EXTENSION: "확장", SUPPORTING: "지원" },
} as const;

export function IdeasPortfolio({ ideas, runSlug, runMode, visibleReportIds = [] }: { ideas: ResearchIdeaManifest[]; runSlug: string; runMode: RunMode; visibleReportIds?: string[] }) {
  const { locale, t } = useLocale();
  const [filter, setFilter] = useState<LifecycleFilter>("ALL");
  const visible = useMemo(() => ideas.filter((idea) => runMode !== "DISCOVERY_PORTFOLIO_RUN" || ideaMatchesLifecycle(idea, filter)), [filter, ideas, runMode]);
  const focused = runMode !== "DISCOVERY_PORTFOLIO_RUN" && ideas.length < 8;
  return <>
    {runMode === "DISCOVERY_PORTFOLIO_RUN" && <div className="text-filters idea-filters" role="group" aria-label={locale === "ko" ? "아이디어 단계 필터" : "Filter ideas by lifecycle"}>{lifecycleFilters.map((item) => <button key={item} type="button" className={filter === item ? "active" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)}>{lifecycleFilterLabels[locale][item]}</button>)}</div>}
    <div className={`editorial-idea-list ${focused ? "focused" : "discovery"}`} aria-live="polite">{!focused && <div className="idea-list-head"><span>{t("idea")}</span><span>{t("portfolioRole")}</span><span>{t("rationale")}</span><span>{t("currentDecision")}</span><span>{t("report")}</span></div>}{visible.map((idea) => <article key={idea.idea_id} className="editorial-idea-row"><div className="idea-title-cell"><Link href={`/runs/${runSlug}/ideas/${idea.slug}/`}>{localized(idea.title, locale) ?? t("noTranslation")}</Link><p>{localized(idea.abstract, locale) ?? t("noTranslation")}</p></div><div className="idea-role-value">{roleLabels[locale][idea.idea_type]}</div><div className="idea-rationale-value">{localized(idea.strongest_reason, locale) ?? t("noTranslation")}</div><div className="idea-decision-value"><span className="decision-text">{lifecycleLabels[locale][idea.lifecycle_status]}</span><p>{localized(idea.disposition, locale) ?? t("noTranslation")}</p></div><div className="idea-report-value">{idea.report_id && visibleReportIds.includes(idea.report_id) ? <Link href={`/runs/${runSlug}/reports/${idea.report_id}/`}>{locale === "ko" ? "보고서 보기" : "Read report"}</Link> : <span className="muted-text">{t("summaryOnly")}</span>}</div></article>)}{visible.length === 0 && <p className="empty-state">{locale === "ko" ? "이 단계의 아이디어가 없습니다." : "No ideas in this lifecycle."}</p>}</div>
  </>;
}
