"use client";

import Link from "next/link";
import { MoreHorizontal, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { formatDate } from "@/lib/display";
import { localized, useLocale } from "@/lib/locale";
import { analyzedLiteratureCount } from "@/lib/literature";
import type { Locale, RunStatus, RunWithIdeas } from "@/lib/types";
import { StatusBadge } from "./status-badge";

type Filter = "ALL" | "DRAFT" | "RUNNING" | "REVIEW_REQUIRED" | "DONE" | "FAILED" | "ARCHIVED";
type Sort = "updated" | "title" | "ideas" | "literature_desc" | "literature_asc";

const filters: Filter[] = ["ALL", "DRAFT", "RUNNING", "REVIEW_REQUIRED", "DONE", "FAILED", "ARCHIVED"];

function allLocalized(value: Partial<Record<Locale, string>>) { return Object.values(value).join(" "); }
function defaultRunHref(run: RunWithIdeas) { return run.run_mode === "DISCOVERY_PORTFOLIO_RUN" ? `/runs/${run.slug}/ideas/` : `/runs/${run.slug}/summary/`; }

export function filterAndSortRuns(runs: RunWithIdeas[], query: string, filter: Filter, sort: Sort, locale: Locale = "en") {
  const normalized = query.trim().toLowerCase();
  return runs.filter((run) => filter === "ALL" || run.status === filter).filter((run) => {
    if (!normalized) return true;
    const searchable = [allLocalized(run.title), allLocalized(run.subtitle), allLocalized(run.research_question), allLocalized(run.summary), allLocalized(run.research_domain), ...run.tags.map(allLocalized), ...run.ideas.flatMap((idea) => [allLocalized(idea.title), allLocalized(idea.abstract), ...idea.tags.map(allLocalized)]), ...run.reports.flatMap((report) => [allLocalized(report.localized_title), allLocalized(report.localized_description)]), ...run.sources.flatMap((source) => [allLocalized(source.localized_title), source.doi ?? "", source.pmid ?? "", source.journal, ...source.authors])].join(" ").toLowerCase();
    return searchable.includes(normalized);
  }).sort((a, b) => {
    if (sort === "title") return (localized(a.title, locale) ?? "").localeCompare(localized(b.title, locale) ?? "", locale);
    if (sort === "ideas") return b.idea_count - a.idea_count;
    if (sort === "literature_desc" || sort === "literature_asc") {
      const aCount = analyzedLiteratureCount(a.literature_stats);
      const bCount = analyzedLiteratureCount(b.literature_stats);
      if (aCount === null || bCount === null) {
        if (aCount === null && bCount === null) return (localized(a.title, locale) ?? "").localeCompare(localized(b.title, locale) ?? "", locale);
        return aCount === null ? 1 : -1;
      }
      const difference = sort === "literature_desc" ? bCount - aCount : aCount - bCount;
      return difference || (localized(a.title, locale) ?? "").localeCompare(localized(b.title, locale) ?? "", locale);
    }
    return b.updated_at.localeCompare(a.updated_at);
  });
}

export function RunsExplorer({ runs, home = false }: { runs: RunWithIdeas[]; home?: boolean }) {
  const { locale, t } = useLocale();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("updated");
  const visible = useMemo(() => filterAndSortRuns(runs, query, filter, sort, locale), [runs, query, filter, sort, locale]);
  const filterLabels: Record<Filter, string> = { ALL: t("all"), DRAFT: t("draft"), RUNNING: t("running"), REVIEW_REQUIRED: t("reviewRequired"), DONE: t("done"), FAILED: t("failed"), ARCHIVED: t("archived") };
  const statusLabels: Record<RunStatus, string> = { DRAFT: t("draft"), RUNNING: t("running"), REVIEW_REQUIRED: t("reviewRequired"), DONE: t("done"), FAILED: t("failed"), BLOCKED: t("blocked"), ARCHIVED: t("archived") };
  const reviewCount = runs.filter((run) => run.status === "REVIEW_REQUIRED").length;
  const ideaTotal = runs.reduce((total, run) => total + run.idea_count, 0);
  return <div className={`page-container runs-page${home ? " home-page" : ""}`}>
    {home ? (
      <header className="research-entry">
        <div className="hero-grid">
          <div className="hero-main">
            <p className="product-context">AI Cho-Scientist</p>
            <h1>{locale === "ko" ? "어떤 연구 질문을 탐구하시겠습니까?" : "What research question would you like to investigate?"}</h1>
            <p className="hero-lede">
              {locale === "ko"
                ? "문헌 탐색, 가설 생성, 기전 검토와 연구 보고서 작성을 하나의 흐름으로 수행합니다."
                : "Move from literature review and hypothesis generation to mechanism review and a readable research report."}
            </p>
            <Link className="research-composer" href="/new-run/" prefetch={false}>
              <span className="composer-hint">{locale === "ko" ? "연구 질문이나 해결하려는 문제를 적어주세요." : "Describe the research question or problem to solve."}</span>
              <span className="composer-cta">{locale === "ko" ? "새 연구 시작" : "Start new research"}</span>
            </Link>
            <p className="research-entry-note">
              {locale === "ko"
                ? "요청서를 준비하는 단계이며, 확인 없이 외부 모델을 실행하거나 비용을 사용하지 않습니다."
                : "This prepares a request only. It does not run an external model or spend provider budget without approval."}
            </p>
          </div>
          <aside className="hero-glance" aria-label={locale === "ko" ? "연구 현황" : "Research overview"}>
            <p className="glance-label">{locale === "ko" ? "현황" : "Overview"}</p>
            <ul className="glance-stats">
              <li><b>{runs.length}</b><span>{locale === "ko" ? "연구" : runs.length === 1 ? "run" : "runs"}</span></li>
              <li><b>{reviewCount}</b><span>{locale === "ko" ? "검토 대기" : "awaiting review"}</span></li>
              <li><b>{ideaTotal}</b><span>{locale === "ko" ? "아이디어" : "ideas"}</span></li>
            </ul>
          </aside>
        </div>
      </header>
    ) : (
      <div className="page-heading-row"><div><h1>{t("researchRuns")}</h1><p className="page-lede">{locale === "ko" ? "연구 질문, 아이디어, 지식 배경과 주요 보고서를 읽습니다." : "Read research questions, ideas, knowledge background, and principal reports."}</p></div><Link href="/new-run/" prefetch={false} className="primary-button">{t("createRequest")}</Link></div>
    )}
    {home && <div className="section-heading"><div><p className="section-label">{locale === "ko" ? "연구 워크스페이스" : "Research workspace"}</p><h2>{locale === "ko" ? "최근 연구" : "Recent research"}</h2></div><Link href="/runs/">{locale === "ko" ? "전체 연구 보기" : "View all runs"}</Link></div>}
    <label className="search-bar"><Search size={20} aria-hidden="true" /><span className="sr-only">{t("search")}</span><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "ko" ? "제목, 질문, 아이디어, 저자, 논문 제목, DOI 검색" : "Search titles, questions, ideas, authors, papers, or DOI"} /></label>
    <div className="runs-toolbar"><div className="text-filters" aria-label={locale === "ko" ? "상태별 필터" : "Filter runs by status"}>{filters.map((item) => <button type="button" key={item} className={filter === item ? "active" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)}>{filterLabels[item]}</button>)}</div><label className="sort-control"><span>{locale === "ko" ? "정렬" : "Sort"}</span><select aria-label={locale === "ko" ? "연구 정렬" : "Sort runs"} value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="updated">{t("lastUpdated")}</option><option value="title">{t("title")}</option><option value="ideas">{t("ideas")}</option><option value="literature_desc">{locale === "ko" ? "분석 문헌: 많은 순" : "Literature analyzed: high to low"}</option><option value="literature_asc">{locale === "ko" ? "분석 문헌: 적은 순" : "Literature analyzed: low to high"}</option></select></label></div>
    <p className="result-count">{locale === "ko" ? `${visible.length}개 연구` : `${visible.length} runs`}</p>
    <div className="run-table-wrap"><table className="run-table"><thead><tr><th>{t("title")}</th><th>{t("status")}</th><th>{t("ideas")}</th><th>{t("literatureAnalyzed")}</th><th>{t("lastUpdated")}</th><th><span className="sr-only">{t("more")}</span></th></tr></thead><tbody>{visible.map((run) => { const title = localized(run.title, locale); const subtitle = localized(run.subtitle, locale); const literature = analyzedLiteratureCount(run.literature_stats); const literatureDisplay = literature ?? "—"; const mobileMeta = locale === "ko" ? `${statusLabels[run.status]} · 아이디어 ${run.idea_count} · 분석 문헌 ${literatureDisplay}` : `${statusLabels[run.status]} · ${run.idea_count} ${run.idea_count === 1 ? "idea" : "ideas"} · ${literatureDisplay} papers analyzed`; return <tr key={run.run_id} data-run-id={run.run_id}><td><Link href={defaultRunHref(run)}>{title ?? t("noTranslation")}</Link>{subtitle && <small>{subtitle}</small>}<p className="run-mobile-meta">{mobileMeta}</p></td><td><StatusBadge status={run.status} /></td><td>{run.idea_count}</td><td>{literatureDisplay}</td><td>{formatDate(run.updated_at, locale)}</td><td><details className="run-actions-menu"><summary aria-label={`${t("more")}: ${title ?? run.slug}`}><MoreHorizontal size={18} /></summary><div><Link href={`/runs/${run.slug}/summary/`}>{t("summary")}</Link><Link href={`/runs/${run.slug}/ideas/`}>{t("ideas")}</Link><Link href={`/runs/${run.slug}/literature/`}>{t("literature")}</Link><Link href={`/runs/${run.slug}/knowledge/`}>{t("knowledge")}</Link><Link href={`/runs/${run.slug}/specification/`}>{t("specification")}</Link></div></details></td></tr>; })}</tbody></table>{visible.length === 0 && <p className="empty-state">{t("noResults")}</p>}</div>
  </div>;
}
