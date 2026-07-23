import { notFound } from "next/navigation";
import { IdeaReader } from "@/components/idea-reader";
import { getAllIdeaParams, getIdea, getRun } from "@/lib/content";
export function generateStaticParams() { return getAllIdeaParams(); }
export const dynamicParams = false;
export default async function IdeaDetailPage({ params }: { params: Promise<{ run_slug: string; idea_slug: string }> }) { const { run_slug, idea_slug } = await params; let run; let idea; try { run = getRun(run_slug); idea = getIdea(run_slug, idea_slug); } catch { notFound(); } return <IdeaReader idea={idea} runSlug={run.slug} reports={run.reports} sources={run.sources} />; }
