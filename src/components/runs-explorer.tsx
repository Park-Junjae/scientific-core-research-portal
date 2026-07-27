"use client";

import Link from "next/link";
import { MoreHorizontal, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { formatDate } from "@/lib/display";
import { localized, useLocale } from "@/lib/locale";
import { analyzedLiteratureCount } from "@/lib/literature";
import type { Locale, RunStatus, RunWithIdeas } from "@/lib/types";
import { StatusBadge } from "./status-badge";

type Filter = "ALL" | "DRAFT" | "RUNNING" | "REVIEW_REQUIRED" | "DONE" | "FAILED" | "ARCHIVED";
type Sort = "updated" | "title" | "ideas" | "literature_desc" | "literature_asc";

const filters: Filter[] = ["ALL", "DRAFT", "RUNNING", "REVIEW_REQUIRED", "DONE", "FAILED", "ARCHIVED"];

function allLocalized(value: Partial<Record<Locale, string>>) {
  return Object.values(value).join(" ");
}

function defaultRunHref(run: RunWithIdeas) {
  return run.run_mode === "DISCOVERY_PORTFOLIO_RUN"
    ? `/runs/${run.slug}/ideas/`
    : `/runs/${run.slug}/summary/`;
}

export function filterAndSortRuns(
  runs: RunWithIdeas[],
  query: string,
  filter: Filter,
  sort: Sort,
  locale: Locale = "en",
) {
  const normalized = query.trim().toLowerCase();
  return runs
    .filter((run) => filter === "ALL" || run.status === filter)
    .filter((run) => {
      if (!normalized) return true;
      const searchable = [
        allLocalized(run.title),
        allLocalized(run.subtitle),
        allLocalized(run.research_question),
        allLocalized(run.summary),
        allLocalized(run.research_domain),
        ...run.tags.map(allLocalized),
        ...run.ideas.flatMap((idea) => [allLocalized(idea.title), allLocalized(idea.abstract)]),
        ...run.sources.flatMap((source) => [
          allLocalized(source.localized_title),
          source.doi ?? "",
          source.pmid ?? "",
          source.journal,
          ...source.authors,
        ]),
      ].join(" ").toLowerCase();
      return searchable.includes(normalized);
    })
    .sort((a, b) => {
      if (sort === "title") {
        return (localized(a.title, locale) ?? "").localeCompare(localized(b.title, locale) ?? "", locale);
      }
      if (sort === "ideas") return b.idea_count - a.idea_count;
      if (sort === "literature_desc" || sort === "literature_asc") {
        const aCount = analyzedLiteratureCount(a.literature_stats);
        const bCount = analyzedLiteratureCount(b.literature_stats);
        if (aCount === null || bCount === null) {
          if (aCount === null && bCount === null) return 0;
          return aCount === null ? 1 : -1;
        }
        const difference = sort === "literature_desc" ? bCount - aCount : aCount - bCount;
        return difference || (localized(a.title, locale) ?? "").localeCompare(localized(b.title, locale) ?? "", locale);
      }
      return b.updated_at.localeCompare(a.updated_at);
    });
}

function LiteratureCells({ run, ko }: { run: RunWithIdeas; ko: boolean }) {
  if (run.literature_scope_enabled === false) {
    return <span className="scope-excluded">{ko ? "문헌 분석 제외" : "Literature excluded"}</span>;
  }
  const stats = run.literature_stats;
  const analyzed = analyzedLiteratureCount(stats);
  return (
    <span className="run-literature-counts">
      <span><b>{analyzed ?? "—"}</b>{ko ? "분석" : "analyzed"}</span>
      <span><b>{stats.unique_cited_sources ?? "—"}</b>{ko ? "인용" : "cited"}</span>
      <span><b>{stats.load_bearing_sources ?? "—"}</b>{ko ? "핵심 근거" : "load-bearing"}</span>
    </span>
  );
}

export function RunsExplorer({ runs, home = false }: { runs: RunWithIdeas[]; home?: boolean }) {
  const { locale, t } = useLocale();
  const ko = locale === "ko";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("updated");
  const visible = useMemo(
    () => filterAndSortRuns(runs, query, filter, sort, locale),
    [runs, query, filter, sort, locale],
  );
  const filterLabels: Record<Filter, string> = {
    ALL: t("all"),
    DRAFT: t("draft"),
    RUNNING: t("running"),
    REVIEW_REQUIRED: t("reviewRequired"),
    DONE: t("done"),
    FAILED: t("failed"),
    ARCHIVED: t("archived"),
  };
  const statusLabels: Record<RunStatus, string> = {
    DRAFT: t("draft"),
    RUNNING: t("running"),
    REVIEW_REQUIRED: t("reviewRequired"),
    DONE: t("done"),
    FAILED: t("failed"),
    BLOCKED: t("blocked"),
    ARCHIVED: t("archived"),
  };

  return (
    <div className={`page-container runs-page${home ? " home-page" : ""}`}>
      {home ? (
        <header className="research-entry">
          <div className="hero-main">
            <p className="product-context">AI Cho-Scientist</p>
            <h1>{ko ? "어떤 연구 질문을 탐구하시겠습니까?" : "What research question would you like to investigate?"}</h1>
            <p className="hero-lede">
              {ko
                ? "문헌 검토, 가설 생성, 기전 검토를 거쳐 읽기 쉬운 연구 보고서를 만듭니다."
                : "Move from literature review and hypothesis generation to mechanism review and a readable research report."}
            </p>
            <Link className="research-composer" href="/new-run/" prefetch={false}>
              <span className="composer-hint">{ko ? "연구 질문이나 해결할 문제를 적어주세요." : "Describe the research question or problem to solve."}</span>
              <span className="composer-cta">{ko ? "새 연구 시작" : "Start new research"}</span>
            </Link>
            <p className="research-entry-note">
              {ko
                ? "요청 검토 단계에서는 외부 모델 호출이나 비용이 발생하지 않습니다."
                : "The request review stage does not call an external model or incur provider cost."}
            </p>
          </div>
        </header>
      ) : (
        <div className="page-heading-row">
          <div><h1>{t("researchRuns")}</h1><p className="page-lede">{ko ? "연구 진행 상태와 검토 완료된 결과를 확인합니다." : "Review research progress and approved results."}</p></div>
          <Link href="/new-run/" prefetch={false} className="primary-button">{t("createRequest")}</Link>
        </div>
      )}

      {runs.length === 0 ? (
        <section className="empty-workspace-state">
          <h2>{ko ? "아직 완료된 연구가 없습니다." : "No completed research yet."}</h2>
          <p>{ko ? "새 연구를 시작하면 진행 상태와 최종 보고서가 여기에 표시됩니다." : "Start a new research request to see progress and final reports here."}</p>
          <Link className="primary-button" href="/new-run/" prefetch={false}>{ko ? "새 연구 시작" : "Start new research"}</Link>
        </section>
      ) : (
        <>
          {home && <div className="section-heading"><div><p className="section-label">{ko ? "연구 워크스페이스" : "Research workspace"}</p><h2>{ko ? "최근 연구" : "Recent research"}</h2></div><Link href="/runs/">{ko ? "전체 연구 보기" : "View all runs"}</Link></div>}
          <label className="search-bar"><Search size={20} aria-hidden="true" /><span className="sr-only">{t("search")}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ko ? "제목, 질문, 아이디어, 논문 또는 DOI 검색" : "Search titles, questions, ideas, papers, or DOI"} /></label>
          <div className="runs-toolbar">
            <div className="text-filters" aria-label={ko ? "상태별 연구 필터" : "Filter runs by status"}>{filters.map((item) => <button type="button" key={item} className={filter === item ? "active" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)}>{filterLabels[item]}</button>)}</div>
            <label className="sort-control"><span>{ko ? "정렬" : "Sort"}</span><select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="updated">{t("lastUpdated")}</option><option value="title">{t("title")}</option><option value="ideas">{t("ideas")}</option><option value="literature_desc">{ko ? "분석 문헌 많은 순" : "Literature analyzed: high to low"}</option><option value="literature_asc">{ko ? "분석 문헌 적은 순" : "Literature analyzed: low to high"}</option></select></label>
          </div>
          <p className="result-count">{ko ? `${visible.length}개 연구` : `${visible.length} runs`}</p>
          <div className="run-table-wrap">
            <table className="run-table">
              <thead><tr><th>{t("title")}</th><th>{t("status")}</th><th>{t("ideas")}</th><th>{ko ? "문헌 근거" : "Literature evidence"}</th><th>{t("lastUpdated")}</th><th><span className="sr-only">{t("more")}</span></th></tr></thead>
              <tbody>{visible.map((run) => {
                const title = localized(run.title, locale);
                const analyzed = analyzedLiteratureCount(run.literature_stats);
                const mobileMeta = run.literature_scope_enabled === false
                  ? `${statusLabels[run.status]} · ${ko ? "문헌 분석 제외" : "literature excluded"}`
                  : `${statusLabels[run.status]} · ${run.idea_count} ${ko ? "개 아이디어" : "ideas"} · ${analyzed ?? "—"} ${ko ? "개 문헌 분석" : "analyzed"}`;
                return <tr key={run.run_id} data-run-id={run.run_id}>
                  <td><Link href={defaultRunHref(run)}>{title ?? t("noTranslation")}</Link>{localized(run.subtitle, locale) && <small>{localized(run.subtitle, locale)}</small>}<p className="run-mobile-meta">{mobileMeta}</p></td>
                  <td><StatusBadge status={run.status} /></td>
                  <td>{run.idea_count}</td>
                  <td><LiteratureCells run={run} ko={ko} /></td>
                  <td>{formatDate(run.updated_at, locale)}</td>
                  <td><details className="run-actions-menu"><summary aria-label={`${t("more")}: ${title ?? run.slug}`}><MoreHorizontal size={18} /></summary><div><Link href={`/runs/${run.slug}/summary/`}>{t("summary")}</Link><Link href={`/runs/${run.slug}/ideas/`}>{t("ideas")}</Link><Link href={`/runs/${run.slug}/literature/`}>{t("literature")}</Link></div></details></td>
                </tr>;
              })}</tbody>
            </table>
            {visible.length === 0 && <p className="empty-state">{t("noResults")}</p>}
          </div>
        </>
      )}
    </div>
  );
}
