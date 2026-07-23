"use client";

import { useLocale } from "@/lib/locale";
import type { LiteratureStats } from "@/lib/types";

export function LiteratureScope({ stats }: { stats: LiteratureStats }) {
  const { locale, t } = useLocale();
  const items = [
    stats.analyzed_unique_total !== null ? (locale === "ko" ? `${stats.analyzed_unique_total}개 문헌 분석` : `${stats.analyzed_unique_total} papers analyzed`) : null,
    stats.discovered !== undefined ? (locale === "ko" ? `${stats.discovered}건 발견` : `${stats.discovered} records discovered`) : null,
    stats.title_abstract_screened !== undefined ? (locale === "ko" ? `${stats.title_abstract_screened}건 제목·초록 검토` : `${stats.title_abstract_screened} titles and abstracts reviewed`) : null,
    stats.full_text_reviewed !== undefined ? (locale === "ko" ? `${stats.full_text_reviewed}편 전문 검토` : `${stats.full_text_reviewed} full texts reviewed`) : null,
    stats.deeply_read !== undefined ? (locale === "ko" ? `${stats.deeply_read}편 정독` : `${stats.deeply_read} papers deeply read`) : null,
    stats.load_bearing_sources !== undefined ? (locale === "ko" ? `${stats.load_bearing_sources}편 핵심 근거` : `${stats.load_bearing_sources} load-bearing sources`) : null,
    stats.unique_cited_sources !== undefined ? (locale === "ko" ? `${stats.unique_cited_sources}${t("citedSources")}` : `${stats.unique_cited_sources} ${t("citedSources")}`) : null,
    stats.report_reference_count !== undefined ? (locale === "ko" ? `${stats.report_reference_count}${t("reportReferences")}` : `${stats.report_reference_count} ${t("reportReferences")}`) : null,
  ].filter((item): item is string => Boolean(item));
  return items.length ? <p className="literature-scope-line">{items.join(" · ")}</p> : <p className="muted-text">{locale === "ko" ? "검토 단계 통계가 공개되지 않았습니다." : "Review-stage statistics are not available."}</p>;
}
