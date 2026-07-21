import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { IdeaReader } from "@/components/idea-reader";
import { getAllIdeaParams, getIdea, getRun, readApprovedMarkdown } from "@/lib/content";
import { formatDate } from "@/lib/display";
import { lifecycleLabels } from "@/lib/portfolio";

export function generateStaticParams() { return getAllIdeaParams(); }
export const dynamicParams = false;

export default async function IdeaDetailPage({ params }: { params: Promise<{ run_slug: string; idea_slug: string }> }) {
  const { run_slug, idea_slug } = await params;
  let run; let idea;
  try { run = getRun(run_slug); idea = getIdea(run_slug, idea_slug); } catch { notFound(); }
  const markdownByLanguage = Object.fromEntries(Object.entries(idea.report_markdown ?? {}).map(([language, file]) => [language, readApprovedMarkdown(run.slug, file)]));
  return (
    <div className="idea-page">
      <Link className="back-link" href={`/runs/${run.slug}/ideas/`}><ArrowLeft size={17} />Back to ideas</Link>
      <header className="idea-header">
        <div className="idea-row-labels"><span>{idea.idea_type.replaceAll("_", " ")}</span><strong>{lifecycleLabels[idea.lifecycle_status]}</strong><span>{idea.recommendation}</span></div>
        <h1>{idea.title}</h1>
        <p>{idea.abstract}</p>
        <div className="idea-meta"><span>{idea.disposition}</span><span>Updated {formatDate(idea.updated_at)}</span><span>{idea.reference_count} references</span><span>{idea.report_pdf ? `${Object.keys(idea.report_pdf).length} PDF variants` : "Summary only"}</span></div>
      </header>
      <IdeaReader idea={idea} markdownByLanguage={markdownByLanguage} />
    </div>
  );
}
