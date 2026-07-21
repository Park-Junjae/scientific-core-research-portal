import type { ResearchRunManifest } from "@/lib/types";

export function RunMetricStrip({ run }: { run: ResearchRunManifest }) {
  return <div className="metric-strip"><div><strong>{run.idea_count}</strong><span>Idea records</span></div><div><strong>{run.retained_idea_count}</strong><span>Retained</span></div><div><strong>{run.report_count}</strong><span>PDF reports</span></div></div>;
}
