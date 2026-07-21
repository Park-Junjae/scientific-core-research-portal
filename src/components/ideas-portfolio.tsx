"use client";

import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ideaMatchesLifecycle,
  lifecycleFilters,
  lifecycleLabels,
  reportAvailability,
  scoreVector,
  type LifecycleFilter,
} from "@/lib/portfolio";
import type { ResearchIdeaManifest } from "@/lib/types";

export function IdeasPortfolio({ ideas, runSlug }: { ideas: ResearchIdeaManifest[]; runSlug: string }) {
  const [filter, setFilter] = useState<LifecycleFilter>("ALL");
  const visible = useMemo(() => ideas.filter((idea) => ideaMatchesLifecycle(idea, filter)), [filter, ideas]);

  return (
    <>
      <div className="lifecycle-filters" role="group" aria-label="Filter ideas by lifecycle">
        {lifecycleFilters.map((item) => (
          <button key={item.value} type="button" className={filter === item.value ? "active" : ""} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>
        ))}
      </div>
      <div className="idea-list" aria-live="polite">
        {visible.map((idea, index) => (
          <article key={idea.idea_id} className="idea-row">
            <div className="idea-index">{String(index + 1).padStart(2, "0")}</div>
            <div className="idea-row-body">
              <div className="idea-row-labels">
                <span>{idea.idea_type.replaceAll("_", " ")}</span>
                <strong>{lifecycleLabels[idea.lifecycle_status]}</strong>
                <span>{idea.recommendation}</span>
              </div>
              <h3><Link href={`/runs/${runSlug}/ideas/${idea.slug}/`}>{idea.title}</Link></h3>
              <p>{idea.abstract}</p>
              <dl className="idea-reason-grid">
                <div><dt>Strongest reason</dt><dd>{idea.strongest_reason}</dd></div>
                <div><dt>Weakest edge</dt><dd>{idea.weakest_causal_edge}</dd></div>
              </dl>
              {idea.scorecard && <div className="score-vector" aria-label="Score vector">{scoreVector(idea).map((item) => <span key={item.axis}>{item.label} <b>{item.score}</b></span>)}</div>}
              <div className="idea-row-footer">
                <div className="report-availability"><FileText size={15} />{reportAvailability(idea)}</div>
                <Link href={`/runs/${runSlug}/ideas/${idea.slug}/`}>View details <ArrowRight size={16} /></Link>
              </div>
            </div>
          </article>
        ))}
        {visible.length === 0 && <div className="empty-portfolio"><h3>No ideas in this lifecycle</h3><p>The run retains no public idea record in the selected state.</p></div>}
      </div>
    </>
  );
}
