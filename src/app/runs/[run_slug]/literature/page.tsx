import { notFound } from "next/navigation";
import { LiteratureExplorer } from "@/components/literature-explorer";
import { RunHeader } from "@/components/run-header";
import { RunTabs } from "@/components/run-tabs";
import { getRun, getRuns } from "@/lib/content";

export function generateStaticParams() { return getRuns().map((run) => ({ run_slug: run.slug })); }

export default async function LiteraturePage({ params }: { params: Promise<{ run_slug: string }> }) {
  const { run_slug } = await params;
  let run;
  try { run = getRun(run_slug); } catch { notFound(); }
  return <div className="run-page"><RunHeader run={run} /><RunTabs slug={run.slug} active="Literature" /><LiteratureExplorer run={run} /></div>;
}
