import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RunWithIdeas } from "@/lib/types";
import { testIdea } from "@/test/fixtures";
import { RunMetricStrip } from "./run-metric-strip";
import { RunPortfolioSummary } from "./run-portfolio-summary";

const run = {
  schema_version: "ResearchRunManifestV1", run_id: "r", slug: "r", title: "Focused run", short_title: "Focused", subtitle: "Decision",
  owner: "Core", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-02T00:00:00Z", status: "DONE", terminal_state: "DONE",
  run_mode: "FOCUSED_DECISION_RUN", research_domain: "Biology", research_goal: "Goal", summary: "Summary", scientific_decision: "Decision",
  reading_order: [], tags: [], languages: ["en"], visibility: "PUBLIC_SANITIZED", publication_status: "DEMO_ONLY", idea_count: 20,
  reviewed_idea_count: 8, retained_idea_count: 3, report_count: 2, knowledge_document_count: 0, featured: true, source_type: "SYNTHETIC_DEMO",
  source_commit: "demo", source_bundle_hash: "demo", current_stage: "done", progress_percent: 100, timeline: [], idea_refs: [], report_refs: [],
  knowledge_refs: [], artifact_refs: [], portfolio_funnel: { raw_generation_count: 20, independent_generation_count: 15, natural_family_count: 12, developed_count: 8, reviewed_count: 8, arena_entrant_count: 0, finalist_count: 0, parked_count: 6, dropped_count: 6 },
  pairwise_comparisons: [], pairwise_selection_impact: "No pairwise comparison was required.", ideas: [{ ...testIdea, featured: true }],
} satisfies RunWithIdeas;

describe("portfolio summaries", () => {
  it("keeps idea and PDF report counts independent", () => {
    render(<RunMetricStrip run={run} />);
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("Idea records")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("PDF reports")).toBeInTheDocument();
  });

  it("does not present a focused run as a tournament", () => {
    render(<RunPortfolioSummary run={run} />);
    expect(screen.getByText("Focused decision")).toBeInTheDocument();
    expect(screen.queryByText(/tournament/i)).not.toBeInTheDocument();
  });
});
