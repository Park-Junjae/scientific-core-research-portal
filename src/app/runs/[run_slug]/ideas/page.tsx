import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { IdeasPortfolio } from "@/components/ideas-portfolio";
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
      <div className="section-page-head"><div><p className="eyebrow">Idea portfolio</p><h2>{run.idea_count} research objects across the full lifecycle</h2><p>Idea records remain visible even when they were merged, parked, dropped, or never received a dedicated report.</p></div><div className="compact-search"><Search size={17} /><span>Use global Runs search to find idea text</span></div></div>
      <IdeasPortfolio ideas={run.ideas} runSlug={run.slug} />
    </div>
  );
}
