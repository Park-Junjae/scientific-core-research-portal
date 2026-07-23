import { notFound } from "next/navigation";
import { ReportReader } from "@/components/report-reader";
import { getAllReportParams, getRun, markdownForReports } from "@/lib/content";
export function generateStaticParams() { return getAllReportParams(); }
export const dynamicParams = false;
export default async function ReportPage({ params }: { params: Promise<{ run_slug: string; report_id: string }> }) { const { run_slug, report_id } = await params; let run; try { run = getRun(run_slug); if (!run.reports.some((report) => report.report_id === report_id)) throw new Error("missing"); } catch { notFound(); } return <div className="report-reading-page"><ReportReader runSlug={run.slug} selectedId={report_id} reports={run.reports} sources={run.sources} markdownByReport={markdownForReports(run)} /></div>; }
