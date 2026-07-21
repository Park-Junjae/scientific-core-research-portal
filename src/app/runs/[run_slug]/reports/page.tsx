import { notFound } from "next/navigation";
import { Download, ExternalLink, FileText } from "lucide-react";
import { RunHeader } from "@/components/run-header";
import { RunTabs } from "@/components/run-tabs";
import { getRun, getRuns } from "@/lib/content";
import { withBasePath } from "@/lib/paths";

export function generateStaticParams() { return getRuns().map((run) => ({ run_slug: run.slug })); }
export const dynamicParams = false;

export default async function ReportsPage({ params }: { params: Promise<{ run_slug: string }> }) {
  const { run_slug } = await params;
  let run;
  try { run = getRun(run_slug); } catch { notFound(); }
  return <div className="run-page"><RunHeader run={run} /><RunTabs slug={run.slug} active="Reports" /><div className="section-page-head"><div><p className="eyebrow">Canonical artifacts</p><h2>Reports</h2><p>PDF is the canonical reading artifact. Language variants are listed together.</p></div></div><div className="artifact-list">{run.report_refs.map((report) => <article key={report.id}><FileText size={23} /><div><h3>{report.title}</h3><p>{report.kind} · {report.language?.toUpperCase() ?? "Language neutral"}</p></div><div className="artifact-actions"><a className="icon-button" title={`Open ${report.title}`} aria-label={`Open ${report.title}`} href={withBasePath(report.path)} target="_blank" rel="noreferrer"><ExternalLink size={17} /></a><a className="icon-button" title={`Download ${report.title}`} aria-label={`Download ${report.title}`} href={withBasePath(report.path)} download><Download size={17} /></a></div></article>)}</div></div>;
}
