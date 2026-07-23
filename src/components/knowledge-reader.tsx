"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { localized, useLocale } from "@/lib/locale";
import { keySources, orderedSources } from "@/lib/literature";
import { withBasePath } from "@/lib/paths";
import type { RunWithIdeas } from "@/lib/types";
import { headingId, MarkdownArticle } from "./markdown-article";
import { RunMetricStrip } from "./run-metric-strip";
import { SourceList } from "./source-list";

function knowledgeVariant(run: RunWithIdeas, locale: "ko" | "en") {
  const base = run.reports.find((report) => report.report_id === run.primary_knowledge_id);
  if (!base) return null;
  return run.reports.find((report) => report.translation_group_id === base.translation_group_id && report.language === locale) ?? null;
}

export function KnowledgeReader({ run, markdownByReport }: { run: RunWithIdeas; markdownByReport: Record<string, string> }) {
  const { locale, t } = useLocale();
  const [view, setView] = useState<"read" | "key" | "references">("read");
  const report = knowledgeVariant(run, locale);
  if (!report) return <section className="translation-empty"><h1>{t("knowledge")}</h1><p>{t("noTranslation")}</p></section>;
  const markdown = markdownByReport[report.report_id] ?? "";
  const headings = markdown.split("\n").filter((line) => line.startsWith("## ")).map((line) => line.slice(3).replace(/<[^>]+>/g, ""));
  const outline = <nav>{headings.map((heading) => <a key={heading} href={`#${headingId(heading)}`}>{heading}</a>)}</nav>;
  return <section className="knowledge-reader">
    <header className="knowledge-title"><h1>{t("knowledge")}</h1><p>{localized(report.localized_description, locale)}</p><RunMetricStrip stats={run.literature_stats} />{report.page_count || report.reference_count ? <p className="document-meta">{report.page_count ? `${report.page_count} ${t("pages")}` : ""}{report.reference_count ? ` • ${report.reference_count} ${t("references")}` : ""}</p> : null}{report.path && <a className="text-action" href={withBasePath(report.path)} target="_blank" rel="noreferrer"><ExternalLink size={16} />{t("openPdf")}</a>}</header>
    <nav className="knowledge-subnav" aria-label={locale === "ko" ? "지식 배경 보기" : "Knowledge views"}><button type="button" className={view === "read" ? "active" : ""} onClick={() => setView("read")}>{locale === "ko" ? "본문" : "Read"}</button><button type="button" className={view === "key" ? "active" : ""} onClick={() => setView("key")}>{t("keyPapers")}</button><button type="button" className={view === "references" ? "active" : ""} onClick={() => setView("references")}>{t("references")}</button></nav>
    {view === "read" && <><div className="knowledge-layout"><main className="knowledge-body"><MarkdownArticle markdown={markdown} runSlug={run.slug} reportId={report.report_id} sources={run.sources} /></main><aside className="page-outline desktop-outline"><strong>{t("onThisPage")}</strong>{outline}</aside></div><details className="mobile-outline"><summary>{t("onThisPage")}</summary>{outline}</details></>}
    {view === "key" && <div className="knowledge-source-view"><h2>{t("keyPapers")}</h2><SourceList runSlug={run.slug} sources={keySources(run.sources, 10)} /></div>}
    {view === "references" && <div className="knowledge-source-view"><h2>{t("references")}</h2><SourceList runSlug={run.slug} sources={orderedSources(run.sources.filter((source) => source.final_report_cited ?? source.cited_in_reports.length > 0))} /></div>}
    <details className="technical-details evidence-sources"><summary>{locale === "ko" ? "근거 자료" : "Evidence sources"}</summary><p>{locale === "ko" ? "내부 claim ID와 감사 메타데이터는 기술 자료에만 유지됩니다." : "Internal claim IDs and audit metadata remain in technical materials."}</p></details>
  </section>;
}
