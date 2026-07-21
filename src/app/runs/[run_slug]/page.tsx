import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, FileText, Lightbulb, Target } from "lucide-react";
import { RunHeader } from "@/components/run-header";
import { RunPortfolioSummary } from "@/components/run-portfolio-summary";
import { RunMetricStrip } from "@/components/run-metric-strip";
import { RunTabs } from "@/components/run-tabs";
import { getRun, getRuns } from "@/lib/content";

export function generateStaticParams() { return getRuns().map((run) => ({ run_slug: run.slug })); }
export const dynamicParams = false;

export default async function RunOverviewPage({ params }: { params: Promise<{ run_slug: string }> }) {
  const { run_slug } = await params;
  let run;
  try { run = getRun(run_slug); } catch { notFound(); }
  return (
    <div className="run-page">
      <RunHeader run={run} />
      <RunTabs slug={run.slug} active="Overview" />
      <RunPortfolioSummary run={run} />
      <div className="run-content-grid">
        <div className="run-main-column">
          <section className="content-section">
            <div className="section-heading"><Target size={20} /><h2>Research goal</h2></div>
            <p className="lead-copy">{run.research_goal}</p>
          </section>
          <section className="content-section">
            <div className="section-heading"><CheckCircle2 size={20} /><h2>Current scientific decision</h2></div>
            <p>{run.scientific_decision}</p>
          </section>
          <section className="content-section">
            <div className="section-heading"><Lightbulb size={20} /><h2>Portfolio highlights</h2></div>
            <div className="overview-ideas">
              {run.ideas.filter((idea) => idea.featured || ["FINALIST", "CONDITIONAL", "MEASUREMENT_PROGRAM"].includes(idea.lifecycle_status)).map((idea) => (
                <article key={idea.idea_id}>
                  <div><span className="recommendation-label">{idea.recommendation}</span><h3>{idea.title}</h3><p>{idea.abstract}</p></div>
                  <Link href={`/runs/${run.slug}/ideas/${idea.slug}/`}>Read idea <span aria-hidden="true">→</span></Link>
                </article>
              ))}
            </div>
          </section>
          <details className="technical-details" id="technical-details">
            <summary>Technical Details</summary>
            <dl><div><dt>Source type</dt><dd>{run.source_type}</dd></div><div><dt>Run mode</dt><dd>{run.run_mode}</dd></div><div><dt>Publication status</dt><dd>{run.publication_status}</dd></div><div><dt>Terminal state</dt><dd>{run.terminal_state}</dd></div><div><dt>Source bundle</dt><dd>{run.source_bundle_hash}</dd></div>{run.source_lineage && <><div><dt>Source run</dt><dd>{run.source_lineage.source_run_id}</dd></div><div><dt>Generated / families</dt><dd>{run.source_lineage.generated_count} / {run.source_lineage.natural_family_count}</dd></div><div><dt>Arena entrants / matches / finalists</dt><dd>{run.source_lineage.arena_entrant_count} / {run.source_lineage.match_count} / {run.source_lineage.finalist_count}</dd></div></>}</dl>
          </details>
        </div>
        <aside className="run-side-column">
          <RunMetricStrip run={run} />
          <section className="side-section"><h2><FileText size={18} /> Recommended reading</h2><ol>{run.reading_order.map((item) => <li key={item}>{item}</li>)}</ol></section>
          <section className="side-section"><h2>Run timeline</h2><ol className="timeline">{run.timeline.map((entry) => <li key={`${entry.date}-${entry.label}`}><time>{entry.date}</time><strong>{entry.label}</strong><p>{entry.detail}</p></li>)}</ol></section>
        </aside>
      </div>
    </div>
  );
}
