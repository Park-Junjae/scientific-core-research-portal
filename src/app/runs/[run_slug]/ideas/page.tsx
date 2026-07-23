import { notFound } from "next/navigation";
import { IdeasPortfolio } from "@/components/ideas-portfolio";
import { RunHeader } from "@/components/run-header";
import { RunTabs } from "@/components/run-tabs";
import { getRun, getRuns } from "@/lib/content";
export function generateStaticParams() { return getRuns().map((run) => ({ run_slug: run.slug })); }
export const dynamicParams = false;
export default async function IdeasPage({ params }: { params: Promise<{ run_slug: string }> }) { const { run_slug } = await params; let run; try { run = getRun(run_slug); } catch { notFound(); } return <div className="run-page"><RunHeader run={run} /><RunTabs slug={run.slug} active="Ideas" /><IdeasPortfolio ideas={run.ideas} runSlug={run.slug} runMode={run.run_mode} /></div>; }
