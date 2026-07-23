import { notFound } from "next/navigation";
import { SourceDetail } from "@/components/source-detail";
import { getAllSourceParams, getRun, getSource } from "@/lib/content";

export function generateStaticParams() { return getAllSourceParams(); }

export default async function LiteratureSourcePage({ params }: { params: Promise<{ run_slug: string; source_id: string }> }) {
  const { run_slug, source_id } = await params;
  let run;
  let source;
  try {
    run = getRun(run_slug);
    source = getSource(run_slug, source_id);
  } catch { notFound(); }
  return <div className="source-reading-page"><SourceDetail run={run} source={source} /></div>;
}
