"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { localized, useLocale } from "@/lib/locale";
import type { RunWithIdeas } from "@/lib/types";
import { SourceList } from "./source-list";

export function GlobalLiterature({ runs }: { runs: RunWithIdeas[] }) {
  const { locale } = useLocale();
  const groups = runs.filter((run) => run.sources.length > 0);
  const sourceCount = groups.reduce((total, run) => total + run.sources.length, 0);
  return (
    <div className="page-container global-library-page">
      <header className="library-header">
        <p className="section-label">AI Cho-Scientist</p>
        <h1>{locale === "ko" ? "문헌" : "Literature"}</h1>
        <p>
          {locale === "ko"
            ? "분석된 출처와 보고서에 실제로 인용된 근거를 연구별로 확인합니다."
            : "Review analyzed sources and evidence actually cited in reports, organized by research run."}
        </p>
        <span>{locale === "ko" ? `공개 출처 ${sourceCount}건` : `${sourceCount} public sources`}</span>
      </header>
      {groups.map((run) => (
        <section className="library-run-section" key={run.run_id}>
          <div className="section-heading">
            <div>
              <h2>{localized(run.title, locale)}</h2>
              <p>{localized(run.subtitle, locale)}</p>
            </div>
            <Link href={`/runs/${run.slug}/literature/`}>
              {locale === "ko" ? "연구 문헌 보기" : "Open run literature"}<ArrowRight size={16} />
            </Link>
          </div>
          <SourceList runSlug={run.slug} sources={run.sources} compact run={run} />
        </section>
      ))}
      {groups.length === 0 && (
        <p className="empty-state">
          {locale === "ko" ? "현재 공개 가능한 출처가 없습니다." : "No public sources are currently available."}
        </p>
      )}
    </div>
  );
}

export function GlobalReports({ runs }: { runs: RunWithIdeas[] }) {
  const { locale } = useLocale();
  const reportCount = runs.reduce(
    (total, run) => total + run.reports.filter((report) => report.language === locale).length,
    0,
  );
  return (
    <div className="page-container global-library-page">
      <header className="library-header">
        <p className="section-label">AI Cho-Scientist</p>
        <h1>{locale === "ko" ? "보고서" : "Reports"}</h1>
        <p>
          {locale === "ko"
            ? "연구 결론, 지식 배경, 검증 문서를 읽기 순서와 역할에 따라 찾습니다."
            : "Find research conclusions, knowledge backgrounds, and validation documents by role."}
        </p>
        <span>{locale === "ko" ? `현재 언어 보고서 ${reportCount}건` : `${reportCount} reports in this language`}</span>
      </header>
      {runs.map((run) => {
        const reports = run.reports
          .filter((report) => report.language === locale)
          .sort((a, b) => a.display_order - b.display_order);
        if (reports.length === 0) return null;
        return (
          <section className="library-run-section" key={run.run_id}>
            <div className="section-heading">
              <div>
                <h2>{localized(run.title, locale)}</h2>
                <p>{localized(run.subtitle, locale)}</p>
              </div>
              <Link href={`/runs/${run.slug}/reports/`}>
                {locale === "ko" ? "모든 보고서" : "All reports"}<ArrowRight size={16} />
              </Link>
            </div>
            <div className="document-list global-report-list">
              {reports.map((report) => (
                <article key={report.report_id}>
                  <div>
                    <p className="document-role">
                      {report.report_id === run.primary_report_id
                        ? (locale === "ko" ? "주요 보고서" : "Principal report")
                        : report.role.replaceAll("_", " ")}
                    </p>
                    <h3>{localized(report.localized_title, locale)}</h3>
                    <p>{localized(report.localized_description, locale)}</p>
                  </div>
                  <Link className="text-action" href={`/runs/${run.slug}/reports/${report.report_id}/`}>
                    {locale === "ko" ? "읽기" : "Read"}<ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
