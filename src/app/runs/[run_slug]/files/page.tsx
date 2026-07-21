import { notFound } from "next/navigation";
import { File, LockKeyhole } from "lucide-react";
import { RunHeader } from "@/components/run-header";
import { RunTabs } from "@/components/run-tabs";
import { getRun, getRuns } from "@/lib/content";

export function generateStaticParams() { return getRuns().map((run) => ({ run_slug: run.slug })); }
export const dynamicParams = false;

export default async function FilesPage({ params }: { params: Promise<{ run_slug: string }> }) {
  const { run_slug } = await params;
  let run;
  try { run = getRun(run_slug); } catch { notFound(); }
  const files = [...run.report_refs, ...run.knowledge_refs, ...run.artifact_refs];
  return <div className="run-page"><RunHeader run={run} /><RunTabs slug={run.slug} active="Files" /><div className="section-page-head"><div><p className="eyebrow">Approved artifacts only</p><h2>Files</h2><p>This list excludes provider traces, private prompts, registries, receipts, and internal review data.</p></div></div><div className="file-table"><div className="file-table-head"><span>Name</span><span>Type</span><span>Language</span></div>{files.map((file) => <div className="file-table-row" key={file.id}><span><File size={17} />{file.title}</span><span>{file.kind}</span><span>{file.language?.toUpperCase() ?? "—"}</span></div>)}</div><div className="privacy-note"><LockKeyhole size={20} /><div><strong>Publication boundary enforced</strong><p>Only allowlisted artifacts can enter a public bundle.</p></div></div></div>;
}
