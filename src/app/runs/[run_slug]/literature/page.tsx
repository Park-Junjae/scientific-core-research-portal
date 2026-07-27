import { notFound } from "next/navigation";
import { LiteratureExplorer } from "@/components/literature-explorer";
import { RunHeader } from "@/components/run-header";
import { RunTabs } from "@/components/run-tabs";
import { getAllRunParams, getRun } from "@/lib/content";
import { visiblePublicReports } from "@/lib/report-visibility";

export function generateStaticParams() { return getAllRunParams(); }

export default async function LiteraturePage({ params }: { params: Promise<{ run_slug: string }> }) {
  const { run_slug } = await params;
  let run;
  try { run = getRun(run_slug); } catch { notFound(); }
  return <div className="run-page"><RunHeader run={run} /><RunTabs slug={run.slug} active="Literature" showReports={visiblePublicReports(run.reports).length > 0} /><LiteratureExplorer run={run} /></div>;
}
