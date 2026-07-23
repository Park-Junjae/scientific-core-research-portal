"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { evidenceRoleLabels, sourceCitation } from "@/lib/literature";
import { localized, useLocale } from "@/lib/locale";
import type { ResearchSourceManifestV1, RunWithIdeas } from "@/lib/types";

export function SourceDetail({ run, source }: { run: RunWithIdeas; source: ResearchSourceManifestV1 }) {
  const { locale, t } = useLocale();
  const ideas = source.related_idea_ids.map((id) => run.ideas.find((idea) => idea.idea_id === id)).filter(Boolean);
  const reports = source.related_report_ids.map((id) => run.reports.find((report) => report.report_id === id)).filter(Boolean);
  const membershipLabels = locale === "ko" ? {
    SOURCE_ATLAS_ONLY: "Source Atlas 수록 · 최종 보고서 미인용",
    SOURCE_ATLAS_AND_FINAL_REPORT: "Source Atlas 수록 · 최종 보고서 인용",
    FINAL_REPORT_ADDITION: "최종 보고서 단계에서 후속 추가",
  } : {
    SOURCE_ATLAS_ONLY: "Source Atlas only · not cited in final reports",
    SOURCE_ATLAS_AND_FINAL_REPORT: "Source Atlas · cited in final reports",
    FINAL_REPORT_ADDITION: "Added during final report preparation",
  };
  const stageLabel = (stage?: string) => ({
    SOURCE_ATLAS_CURATED: locale === "ko" ? "Source Atlas 큐레이션" : "Source Atlas curation",
    BIBLIOGRAPHY_SOURCE_VERIFIED: locale === "ko" ? "참고문헌 확인" : "Bibliography source verification",
    REPORT_ARGUMENT_USED: locale === "ko" ? "최종 보고서 사용" : "Final report use",
  })[stage ?? ""] ?? stage?.replaceAll("_", " ").toLowerCase() ?? "—";
  return <article className="source-detail"><Link className="back-link" href={`/runs/${run.slug}/literature/`}>{locale === "ko" ? "문헌 목록으로" : "Back to literature"}</Link><header><p className="source-role">{evidenceRoleLabels[locale][source.evidence_role]}</p><h1>{localized(source.localized_title, locale) ?? t("noTranslation")}</h1><p className="source-citation">{sourceCitation(source)}</p></header>
    <section><h2>{t("whyItMatters")}</h2><p>{localized(source.localized_relevance, locale) ?? t("noTranslation")}</p></section>
    <section><h2>{t("whatShows")}</h2><p>{localized(source.localized_shows, locale) ?? t("noTranslation")}</p></section>
    <section><h2>{t("whatDoesNotShow")}</h2><p>{localized(source.localized_does_not_show, locale) ?? t("noTranslation")}</p></section>
    {source.corpus_membership && <section><h2>{locale === "ko" ? "연구 문헌 이력" : "Run source provenance"}</h2><dl className="metadata-list"><div><dt>{locale === "ko" ? "문헌 소속" : "Corpus membership"}</dt><dd>{membershipLabels[source.corpus_membership]}</dd></div><div><dt>{locale === "ko" ? "최초 기록 단계" : "First recorded stage"}</dt><dd>{stageLabel(source.first_seen_stage)}</dd></div><div><dt>{locale === "ko" ? "마지막 사용 단계" : "Last used stage"}</dt><dd>{stageLabel(source.last_used_stage)}</dd></div><div><dt>{locale === "ko" ? "분석 이벤트" : "Analysis events"}</dt><dd>{source.analysis_event_count ?? "—"}</dd></div></dl>{!source.final_report_cited && <p className="muted-text">{locale === "ko" ? "이 문헌은 연구 큐레이션 문헌군에 포함되었지만 최종 독자용 보고서에는 인용되지 않았습니다. 비인용은 배제나 낮은 품질을 의미하지 않습니다." : "This source was included in the research curation corpus but was not cited in the final reader-facing reports. Non-citation does not mean rejection or low quality."}</p>}</section>}
    <section><h2>{locale === "ko" ? "관련 아이디어" : "Related ideas"}</h2>{ideas.length > 0 ? <ul>{ideas.map((idea) => <li key={idea!.idea_id}><Link href={`/runs/${run.slug}/ideas/${idea!.slug}/`}>{localized(idea!.title, locale) ?? t("noTranslation")}</Link></li>)}</ul> : <p className="muted-text">{locale === "ko" ? "직접 연결된 아이디어가 없습니다." : "No directly related idea is recorded."}</p>}</section>
    <section><h2>{locale === "ko" ? "관련 보고서와 섹션" : "Related reports and sections"}</h2>{reports.length > 0 ? <ul>{reports.map((report) => { const section = source.related_report_sections.find((item) => item.report_id === report!.report_id); return <li key={report!.report_id}><Link href={`/runs/${run.slug}/reports/${report!.report_id}/`}>{localized(report!.localized_title, locale) ?? t("noTranslation")}</Link>{section?.section_ids.length ? <span className="related-sections"> · {section.section_ids.join(", ")}</span> : null}</li>; })}</ul> : <p className="muted-text">{locale === "ko" ? "직접 연결된 보고서가 없습니다." : "No directly related report is recorded."}</p>}</section>
    <section><h2>{locale === "ko" ? "확인 범위와 원문" : "Access and source links"}</h2><p>{t("accessLevel")}: {source.access_level.replaceAll("_", " ").toLowerCase()}</p>{source.full_text_reviewed === null && <p className="muted-text">{locale === "ko" ? "원본 검토 단계는 현재 공개 메타데이터에 없습니다." : "The review stage was not preserved in the public metadata."}</p>}<div className="source-links">{source.doi && <a href={`https://doi.org/${source.doi}`} target="_blank" rel="noreferrer">DOI: {source.doi} <ExternalLink size={14} /></a>}{source.pmid && <a href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`} target="_blank" rel="noreferrer">PMID: {source.pmid} <ExternalLink size={14} /></a>}{source.url && !source.doi && <a href={source.url} target="_blank" rel="noreferrer">{locale === "ko" ? "원문 링크" : "Source link"} <ExternalLink size={14} /></a>}</div></section>
  </article>;
}
