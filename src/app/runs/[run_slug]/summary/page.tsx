import { notFound } from "next/navigation";
import { RunHeader } from "@/components/run-header";
import { RunSummary } from "@/components/run-summary";
import { RunTabs } from "@/components/run-tabs";
import { getAllRunParams, getRun } from "@/lib/content";
import { visiblePublicReports } from "@/lib/report-visibility";
export function generateStaticParams() { return getAllRunParams(); }
export const dynamicParams = false;
export default async function SummaryPage({ params }: { params: Promise<{ run_slug: string }> }) { const { run_slug } = await params; let run; try { run = getRun(run_slug); } catch { notFound(); } return <div className="run-page"><RunHeader run={run} /><RunTabs slug={run.slug} active="Summary" showReports={visiblePublicReports(run.reports).length > 0} /><RunSummary run={run} /></div>; }
