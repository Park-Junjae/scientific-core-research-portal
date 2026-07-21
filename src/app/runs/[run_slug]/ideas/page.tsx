import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { RunHeader } from "@/components/run-header";
import { RunTabs } from "@/components/run-tabs";
import { getRun, getRuns } from "@/lib/content";

export function generateStaticParams() { return getRuns().map((run) => ({ run_slug: run.slug })); }
export const dynamicParams = false;

export default async function IdeasPage({ params }: { params: Promise<{ run_slug: string }> }) {
  const { run_slug } = await params;
  let run;
  try { run = getRun(run_slug); } catch { notFound(); }
  return (
    <div className="run-page">
      <RunHeader run={run} /><RunTabs slug={run.slug} active="Ideas" />
      <div className="section-page-head"><div><p className="eyebrow">Reviewed ideas</p><h2>{run.reviewed_idea_count} concepts, organized for a fast first read</h2><p>Each summary explains the mechanism and decision status before you open the full report.</p></div><div className="compact-search"><Search size={17} /><span>Use global Runs search to find idea text</span></div></div>
      <div className="idea-list">
        {run.ideas.map((idea, index) => (
          <article key={idea.idea_id} className="idea-row">
            <div className="idea-index">{String(index + 1).padStart(2, "0")}</div>
            <div className="idea-row-body">
              <div className="idea-row-labels"><span>{idea.category}</span><strong>{idea.recommendation}</strong></div>
              <h3><Link href={`/runs/${run.slug}/ideas/${idea.slug}/`}>{idea.title}</Link></h3>
              <p>{idea.abstract}</p>
              <div className="idea-row-footer"><div className="tag-row">{idea.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><Link href={`/runs/${run.slug}/ideas/${idea.slug}/`}>View details <ArrowRight size={16} /></Link></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
