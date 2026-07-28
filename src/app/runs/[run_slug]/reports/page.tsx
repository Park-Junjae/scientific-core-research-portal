import { notFound } from "next/navigation";
import { ReportIndex } from "@/components/report-index";
import { RunHeader } from "@/components/run-header";
import { RunTabs } from "@/components/run-tabs";
import { getAllRunParams, getRun } from "@/lib/content";
import { visiblePublicReports } from "@/lib/report-visibility";
export function generateStaticParams() { return getAllRunParams(); }
export const dynamicParams = false;
export default async function ReportsPage({ params }: { params: Promise<{ run_slug: string }> }) { const { run_slug } = await params; let run; try { run = getRun(run_slug); } catch { notFound(); } const reports = visiblePublicReports(run.reports); if (reports.length === 0) notFound(); return <div className="run-page"><RunHeader run={run} /><RunTabs slug={run.slug} active="Reports" showReports /><ReportIndex runSlug={run.slug} reports={reports} /></div>; }
