import { notFound } from "next/navigation";
import { File, LockKeyhole } from "lucide-react";
import { RunHeader } from "@/components/run-header";
import { RunTabs } from "@/components/run-tabs";
import { getRun, getRuns } from "@/lib/content";

export function generateStaticParams() { return getRuns().map((run) => ({ run_slug: run.slug })); }
export const dynamicParams = false;

export default async function FilesPage({ params }: { params: Promise<{ run_slug: string }> }) {
  const { run_slug } = await params;
  let run; try { run = getRun(run_slug); } catch { notFound(); }
  const reportFiles = run.reports.flatMap((report) => [report.path ? { id: `${report.report_id}-pdf`, title: report.localized_title.en ?? report.localized_title.ko ?? report.report_id, kind: "PDF", language: report.language } : null, report.markdown_path ? { id: `${report.report_id}-md`, title: report.localized_title.en ?? report.localized_title.ko ?? report.report_id, kind: "MARKDOWN", language: report.language } : null]).filter((item) => item !== null);
  const files = [...reportFiles, ...run.artifact_refs.map((artifact) => ({ id: artifact.id, title: artifact.title.en ?? artifact.title.ko ?? artifact.id, kind: artifact.kind, language: artifact.language ?? "—" }))];
  return <div className="run-page"><RunHeader run={run} /><RunTabs slug={run.slug} active="Files" /><div className="secondary-document-page"><h1>Files</h1><p>This secondary list contains only approved artifacts. Provider traces, private prompts, registries, receipts, and internal review data are excluded.</p><div className="file-table"><div className="file-table-head"><span>Name</span><span>Type</span><span>Language</span></div>{files.map((file) => <div className="file-table-row" key={file.id}><span><File size={17} />{file.title}</span><span>{file.kind}</span><span>{file.language.toUpperCase()}</span></div>)}</div><details className="technical-details"><summary><LockKeyhole size={17} /> Publication boundary</summary><p>Only allowlisted artifacts can enter a public bundle.</p></details></div></div>;
}
