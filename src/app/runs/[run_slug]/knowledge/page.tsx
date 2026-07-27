import { notFound } from "next/navigation";
import { KnowledgeReader } from "@/components/knowledge-reader";
import { RunHeader } from "@/components/run-header";
import { RunTabs } from "@/components/run-tabs";
import { getAllRunParams, getRun, markdownForReports } from "@/lib/content";
import { visiblePublicReports } from "@/lib/report-visibility";
export function generateStaticParams() { return getAllRunParams(); }
export const dynamicParams = false;
export default async function KnowledgePage({ params }: { params: Promise<{ run_slug: string }> }) { const { run_slug } = await params; let run; try { run = getRun(run_slug); } catch { notFound(); } return <div className="run-page"><RunHeader run={run} /><RunTabs slug={run.slug} active="Knowledge" showReports={visiblePublicReports(run.reports).length > 0} /><KnowledgeReader run={run} markdownByReport={markdownForReports(run)} /></div>; }
