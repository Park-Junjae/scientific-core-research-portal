"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { evidenceRoleLabels, isAnalyzedSource, orderedSources, sourceCitation } from "@/lib/literature";
import { localized, useLocale } from "@/lib/locale";
import type { ResearchSourceManifestV1, RunWithIdeas } from "@/lib/types";

interface SourceListProps {
  runSlug: string;
  sources: ResearchSourceManifestV1[];
  compact?: boolean;
  run?: RunWithIdeas;
}

export function SourceList({ runSlug, sources, compact = false, run }: SourceListProps) {
  const { locale, t } = useLocale();
  return (
    <div className={`source-list${compact ? " compact" : ""}`}>
      {orderedSources(sources).map((source) => {
        const ideas = run
          ? source.related_idea_ids.map((id) => run.ideas.find((idea) => idea.idea_id === id)).filter(Boolean)
          : [];
        const reports = run
          ? source.related_report_ids.map((id) => run.reports.find((report) => report.report_id === id)).filter(Boolean)
          : [];
        return (
          <article key={source.source_id} className="source-row">
            <div className="source-main">
              <p className="source-role">{evidenceRoleLabels[locale][source.evidence_role]}</p>
              <div className="source-accounting" aria-label={locale === "ko" ? "문헌 처리 상태" : "Literature accounting status"}>
                {isAnalyzedSource(source) && <span>{locale === "ko" ? "분석됨" : "Analyzed"}</span>}
                {source.cited_in_reports.length > 0 && <span>{locale === "ko" ? "최종 보고서 인용" : "Cited in final report"}</span>}
                {source.load_bearing && <span>{locale === "ko" ? "핵심 근거" : "Load-bearing"}</span>}
                {source.corpus_membership === "FINAL_REPORT_ADDITION" && <span>{locale === "ko" ? "후속 추가" : "Post-Atlas addition"}</span>}
              </div>
              <h3>
                <Link href={`/runs/${runSlug}/literature/${source.source_id}/`}>
                  {localized(source.localized_title, locale) ?? t("noTranslation")}
                </Link>
              </h3>
              <p className="source-citation">{sourceCitation(source)}</p>
              <p className="source-relevance">{localized(source.localized_relevance, locale) ?? t("noTranslation")}</p>
              {run && (ideas.length > 0 || reports.length > 0) && (
                <p className="source-related">
                  {ideas.slice(0, 2).map((idea) => (
                    <Link key={idea!.idea_id} href={`/runs/${runSlug}/ideas/${idea!.slug}/`}>
                      {locale === "ko" ? "아이디어" : "Idea"}: {localized(idea!.short_title, locale) ?? localized(idea!.title, locale)}
                    </Link>
                  ))}
                  {reports.slice(0, 2).map((report) => (
                    <Link key={report!.report_id} href={`/runs/${runSlug}/reports/${report!.report_id}/`}>
                      {locale === "ko" ? "보고서" : "Report"}: {localized(report!.localized_title, locale)}
                    </Link>
                  ))}
                </p>
              )}
            </div>
            <div className="source-links">
              <Link href={`/runs/${runSlug}/literature/${source.source_id}/`}>{t("viewSource")}</Link>
              {source.doi && <a href={`https://doi.org/${source.doi}`} target="_blank" rel="noreferrer">DOI <ExternalLink size={14} /></a>}
              {source.pmid && <a href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`} target="_blank" rel="noreferrer">PMID <ExternalLink size={14} /></a>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
