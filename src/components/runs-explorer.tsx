"use client";

import Link from "next/link";
import {
  ArrowDownAZ,
  Grid2X2,
  List,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatDate } from "@/lib/display";
import type { RunStatus, RunWithIdeas } from "@/lib/types";
import { StatusBadge } from "./status-badge";

type Filter = "ALL" | Exclude<RunStatus, "ARCHIVED">;
type Sort = "updated" | "created" | "title" | "ideas";

const filters: Array<{ value: Filter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "RUNNING", label: "Running" },
  { value: "REVIEW_REQUIRED", label: "Review" },
  { value: "DONE", label: "Done" },
  { value: "FAILED", label: "Failed" },
  { value: "BLOCKED", label: "Blocked" },
];

export function filterAndSortRuns(runs: RunWithIdeas[], query: string, filter: Filter, sort: Sort) {
  const normalized = query.trim().toLowerCase();
  return runs
    .filter((run) => filter === "ALL" || run.status === filter)
    .filter((run) => {
      if (!normalized) return true;
      const searchable = [
        run.title,
        run.subtitle,
        run.summary,
        run.research_domain,
        ...run.tags,
        ...run.ideas.flatMap((idea) => [idea.title, idea.abstract]),
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalized);
    })
    .sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "ideas") return b.reviewed_idea_count - a.reviewed_idea_count;
      if (sort === "created") return b.created_at.localeCompare(a.created_at);
      return b.updated_at.localeCompare(a.updated_at);
    });
}

export function RunsExplorer({ runs, heading }: { runs: RunWithIdeas[]; heading: string }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("updated");
  const [view, setView] = useState<"list" | "grid">("list");
  const visible = useMemo(() => filterAndSortRuns(runs, query, filter, sort), [runs, query, filter, sort]);

  return (
    <div className="page-container runs-page">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Research workspace</p>
          <h1>{heading}</h1>
          <p className="page-lede">Read approved reports, compare reviewed ideas, and follow each scientific decision.</p>
        </div>
        <Link href="/new-run/" prefetch={false} className="primary-button">
          Create run request
        </Link>
      </div>

      <div className="search-bar">
        <Search size={21} aria-hidden="true" />
        <label className="sr-only" htmlFor="run-search">Search research runs</label>
        <input
          id="run-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search runs, ideas, domains, or tags"
        />
        <kbd>/</kbd>
      </div>

      <div className="runs-toolbar">
        <div className="filter-chips" aria-label="Filter runs by status">
          {filters.map((item) => (
            <button
              type="button"
              key={item.value}
              className={filter === item.value ? "filter-chip active" : "filter-chip"}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="view-controls">
          <label className="sort-control">
            <ArrowDownAZ size={17} />
            <span className="sr-only">Sort runs</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
              <option value="updated">Last updated</option>
              <option value="created">Created</option>
              <option value="title">Title</option>
              <option value="ideas">Idea count</option>
            </select>
          </label>
          <div className="segmented-control" aria-label="Run display mode">
            <button title="List view" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={18} /></button>
            <button title="Grid view" aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 size={18} /></button>
          </div>
        </div>
      </div>

      <p className="result-count" aria-live="polite">{visible.length} {visible.length === 1 ? "run" : "runs"}</p>
      {visible.length === 0 ? (
        <div className="empty-state">
          <Search size={25} />
          <h2>No matching research runs</h2>
          <p>Clear the search or choose another status.</p>
        </div>
      ) : view === "list" ? (
        <div className="run-table-wrap">
          <table className="run-table">
            <thead><tr><th>Title</th><th>Status</th><th>Reviewed ideas</th><th>Owner</th><th>Last updated</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {visible.map((run) => (
                <tr key={run.run_id}>
                  <td>
                    <Link className="run-title-link" href={`/runs/${run.slug}/`} prefetch={false}>
                      <span>{run.title}</span>
                      <small>{run.subtitle}</small>
                    </Link>
                  </td>
                  <td><StatusBadge status={run.status} /></td>
                  <td>{run.reviewed_idea_count}</td>
                  <td>{run.owner}</td>
                  <td>{formatDate(run.updated_at)}</td>
                  <td><button className="icon-button subtle" title="Run actions" aria-label={`Actions for ${run.title}`}><MoreHorizontal size={19} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="run-grid">
          {visible.map((run) => (
            <article className="run-card" key={run.run_id}>
              <div className="run-card-top"><StatusBadge status={run.status} /><span>{formatDate(run.updated_at)}</span></div>
              <h2><Link href={`/runs/${run.slug}/`} prefetch={false}>{run.title}</Link></h2>
              <p>{run.summary}</p>
              <div className="tag-row">{run.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
              <div className="run-card-meta"><span>{run.reviewed_idea_count} reviewed ideas</span><span>{run.owner}</span></div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
