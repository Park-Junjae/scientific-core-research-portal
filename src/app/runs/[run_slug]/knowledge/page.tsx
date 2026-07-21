import { notFound } from "next/navigation";
import { KnowledgeReader } from "@/components/knowledge-reader";
import { RunHeader } from "@/components/run-header";
import { RunTabs } from "@/components/run-tabs";
import { getRun, getRuns, readApprovedMarkdown } from "@/lib/content";

export function generateStaticParams() { return getRuns().map((run) => ({ run_slug: run.slug })); }
export const dynamicParams = false;

export default async function KnowledgePage({ params }: { params: Promise<{ run_slug: string }> }) {
  const { run_slug } = await params;
  let run;
  try { run = getRun(run_slug); } catch { notFound(); }
  const source = run.knowledge_refs.find((item) => item.kind === "MARKDOWN");
  const pdf = run.knowledge_refs.find((item) => item.kind === "PDF")?.path;
  if (!source) notFound();
  const markdown = readApprovedMarkdown(run.slug, source.path);
  return <div className="run-page"><RunHeader run={run} /><RunTabs slug={run.slug} active="Knowledge" /><div className="knowledge-intro"><p className="eyebrow">Knowledge background</p><h2>The minimum context needed to evaluate this run</h2><p>Readable synthesis comes first. Detailed evidence sources remain a secondary view.</p></div><KnowledgeReader markdown={markdown} pdf={pdf} /></div>;
}
