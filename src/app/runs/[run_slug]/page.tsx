import { notFound } from "next/navigation";
import { IdeasPortfolio } from "@/components/ideas-portfolio";
import { BreakthroughDiscoveryView } from "@/components/breakthrough-discovery-view";
import { RunHeader } from "@/components/run-header";
import { RunSummary } from "@/components/run-summary";
import { RunTabs } from "@/components/run-tabs";
import { getAllRunParams, getRun } from "@/lib/content";
import { visiblePublicReports } from "@/lib/report-visibility";

export function generateStaticParams() { return getAllRunParams(); }
export const dynamicParams = false;

export default async function RunDefaultPage({ params }: { params: Promise<{ run_slug: string }> }) {
  const { run_slug } = await params;
  let run; try { run = getRun(run_slug); } catch { notFound(); }
  const discovery = run.run_mode === "DISCOVERY_PORTFOLIO_RUN";
  const reports = visiblePublicReports(run.reports);
  return <div className="run-page"><RunHeader run={run} /><RunTabs slug={run.slug} active={discovery ? "Ideas" : "Summary"} showReports={reports.length > 0} />{discovery ? <>{run.creativity_profile === "BREAKTHROUGH_DISCOVERY" && run.breakthrough_discovery && <BreakthroughDiscoveryView data={run.breakthrough_discovery} />}<IdeasPortfolio ideas={run.ideas} runSlug={run.slug} runMode={run.run_mode} visibleReportIds={reports.map((report) => report.report_id)} /></> : <RunSummary run={run} />}<details className="technical-details" id="technical-details"><summary>Technical details</summary><dl><div><dt>Source type</dt><dd>{run.source_type}</dd></div><div><dt>Publication status</dt><dd>{run.publication_status}</dd></div><div><dt>Terminal state</dt><dd>{run.terminal_state}</dd></div><div><dt>Source bundle</dt><dd>{run.source_bundle_hash}</dd></div></dl></details></div>;
}
