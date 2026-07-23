"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { keySources, orderedSources } from "@/lib/literature";
import { useLocale } from "@/lib/locale";
import type { RunWithIdeas } from "@/lib/types";
import { LiteratureScope } from "./literature-scope";
import { SourceList } from "./source-list";

type Filter = "ALL" | "FINAL_CITED" | "LOAD_BEARING" | "NOT_CITED" | "FINAL_ADDITION";
type Sort = "relevance" | "year" | "author" | "citation";
const filters: Filter[] = ["ALL", "FINAL_CITED", "LOAD_BEARING", "NOT_CITED", "FINAL_ADDITION"];

export function LiteratureExplorer({ run }: { run: RunWithIdeas }) {
  const { locale, t } = useLocale();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("relevance");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = run.sources.filter((source) => {
      if (filter === "FINAL_CITED") return source.final_report_cited ?? source.cited_in_reports.length > 0;
      if (filter === "LOAD_BEARING") return source.load_bearing;
      if (filter === "NOT_CITED") return !(source.final_report_cited ?? source.cited_in_reports.length > 0);
      if (filter === "FINAL_ADDITION") return source.corpus_membership === "FINAL_REPORT_ADDITION";
      return true;
    }).filter((source) => {
      if (!normalized) return true;
      const relatedIdeas = source.related_idea_ids.map((id) => run.ideas.find((idea) => idea.idea_id === id)).filter(Boolean).map((idea) => Object.values(idea!.title).join(" "));
      const relatedReports = source.related_report_ids.map((id) => run.reports.find((report) => report.report_id === id)).filter(Boolean).map((report) => Object.values(report!.localized_title).join(" "));
      return [Object.values(source.localized_title).join(" "), source.authors.join(" "), source.journal, source.doi ?? "", source.pmid ?? "", ...relatedIdeas, ...relatedReports].join(" ").toLowerCase().includes(normalized);
    });
    if (sort === "year") return [...filtered].sort((a, b) => b.year - a.year);
    if (sort === "author") return [...filtered].sort((a, b) => a.authors[0].localeCompare(b.authors[0]));
    if (sort === "citation") return [...filtered].sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999));
    return orderedSources(filtered).sort((a, b) => Number(b.load_bearing) - Number(a.load_bearing) || (a.display_order ?? 9999) - (b.display_order ?? 9999));
  }, [filter, query, run.ideas, run.reports, run.sources, sort]);
  const keys = keySources(run.sources, 10);
  const counts: Record<Filter, number> = {
    ALL: run.sources.length,
    FINAL_CITED: run.sources.filter((source) => source.final_report_cited ?? source.cited_in_reports.length > 0).length,
    LOAD_BEARING: run.sources.filter((source) => source.load_bearing).length,
    NOT_CITED: run.sources.filter((source) => !(source.final_report_cited ?? source.cited_in_reports.length > 0)).length,
    FINAL_ADDITION: run.sources.filter((source) => source.corpus_membership === "FINAL_REPORT_ADDITION").length,
  };
  const labels: Record<Filter, string> = locale === "ko" ? {
    ALL: "전체",
    FINAL_CITED: "최종 보고서 인용",
    LOAD_BEARING: "핵심 근거",
    NOT_CITED: "보고서 미인용",
    FINAL_ADDITION: "후속 추가",
  } : {
    ALL: "All",
    FINAL_CITED: "Cited in final reports",
    LOAD_BEARING: "Load-bearing",
    NOT_CITED: "Not cited",
    FINAL_ADDITION: "Post-Atlas addition",
  };
  return <div className="literature-page"><header><h1>{t("literature")}</h1><p>{locale === "ko" ? "이 연구에서 공개 가능한 문헌 경계와 보고서·아이디어 연결을 확인합니다." : "Explore the public source boundary and its links to reports and research ideas."}</p></header>
    {keys.length > 0 && <section><h2>{t("keyPapers")}</h2><SourceList runSlug={run.slug} sources={keys} compact run={run} /></section>}
    <section><h2>{t("literatureScope")}</h2><LiteratureScope stats={run.literature_stats} /></section>
    <section><div className="literature-section-heading"><h2>{t("allSources")}</h2><span>{locale === "ko" ? `${run.sources.length}개 출처` : `${run.sources.length} sources`}</span></div>{run.sources.length > 0 ? <><label className="search-bar literature-search"><Search size={19} /><span className="sr-only">{t("search")}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "ko" ? "제목, 저자, 학술지, DOI, PMID 검색" : "Search title, author, journal, DOI, or PMID"} /></label><div className="literature-toolbar"><div className="text-filters" aria-label={locale === "ko" ? "문헌 corpus 필터" : "Literature corpus filters"}>{filters.map((item) => <button key={item} type="button" className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{labels[item]} {counts[item]}</button>)}</div><label className="sort-control"><span>{locale === "ko" ? "정렬" : "Sort"}</span><select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="relevance">{locale === "ko" ? "관련성" : "Relevance"}</option><option value="year">{locale === "ko" ? "연도" : "Year"}</option><option value="author">{locale === "ko" ? "제1저자" : "First author"}</option><option value="citation">{locale === "ko" ? "인용 순서" : "Citation order"}</option></select></label></div><SourceList runSlug={run.slug} sources={visible} run={run} /></> : <p className="muted-text">{locale === "ko" ? "이 합성 예시에는 공개된 개별 출처 레코드가 없습니다." : "No individual source records are published for this synthetic fixture."}</p>}</section>
  </div>;
}
