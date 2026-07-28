import { notFound } from "next/navigation";
import { IdeasPortfolio } from "@/components/ideas-portfolio";
import { BreakthroughDiscoveryView } from "@/components/breakthrough-discovery-view";
import { RunHeader } from "@/components/run-header";
import { RunTabs } from "@/components/run-tabs";
import { getAllRunParams, getRun } from "@/lib/content";
import { visiblePublicReports } from "@/lib/report-visibility";
export function generateStaticParams() { return getAllRunParams(); }
export const dynamicParams = false;
export default async function IdeasPage({ params }: { params: Promise<{ run_slug: string }> }) { const { run_slug } = await params; let run; try { run = getRun(run_slug); } catch { notFound(); } const reports = visiblePublicReports(run.reports); return <div className="run-page"><RunHeader run={run} /><RunTabs slug={run.slug} active="Ideas" showReports={reports.length > 0} />{run.creativity_profile === "BREAKTHROUGH_DISCOVERY" && run.breakthrough_discovery && <BreakthroughDiscoveryView data={run.breakthrough_discovery} />}<IdeasPortfolio ideas={run.ideas} runSlug={run.slug} runMode={run.run_mode} visibleReportIds={reports.map((report) => report.report_id)} /></div>; }
