import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PreferencesProvider } from "@/lib/preferences";
import type { RunWithIdeas, SearchRecord } from "@/lib/types";
import { testIdea } from "@/test/fixtures";
import { RunsExplorer, filterAndSortRuns } from "./runs-explorer";

const base = {
  schema_version: "ResearchRunManifestV1",
  run_id: "r1", slug: "alpha", title: "Alpha study", short_title: "Alpha", subtitle: "Mechanism", owner: "Core",
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z", status: "DONE", terminal_state: "DONE", run_mode: "FOCUSED_DECISION_RUN",
  research_domain: "Biology", research_goal: "Goal", summary: "Summary", scientific_decision: "Decision", reading_order: [], tags: ["kinetics"], languages: ["en"], visibility: "PUBLIC_SANITIZED", publication_status: "DEMO_ONLY", idea_count: 1, reviewed_idea_count: 1, retained_idea_count: 1, report_count: 0, knowledge_document_count: 1, featured: true, source_type: "SYNTHETIC_DEMO", source_commit: "demo", source_bundle_hash: "demo", current_stage: "done", progress_percent: 100, timeline: [], idea_refs: ["idea"], report_refs: [], knowledge_refs: [], artifact_refs: [], portfolio_funnel: { raw_generation_count: 1, independent_generation_count: 1, natural_family_count: 1, developed_count: 1, reviewed_count: 1, arena_entrant_count: 0, finalist_count: 0, parked_count: 0, dropped_count: 0 }, pairwise_comparisons: [], pairwise_selection_impact: "No pairwise comparison was required.",
  ideas: [{ ...testIdea, idea_id: "i1", slug: "idea", title: "Rotational registry", short_title: "Registry", abstract: "A sufficiently long abstract that contains hidden coordinate language.", tags: ["phase"], updated_at: "2026-02-01T00:00:00Z", language_variants: { en: "English" }, report_pdf: { en: "/a.pdf" }, report_markdown: { en: "a.md" }, family_id: "family-registry" }],
} satisfies RunWithIdeas;

const runs = [base, { ...base, run_id: "r2", slug: "beta", title: "Beta review", status: "REVIEW_REQUIRED", updated_at: "2026-03-01T00:00:00Z", reviewed_idea_count: 4, ideas: [{ ...base.ideas[0], title: "Assembly state" }] } satisfies RunWithIdeas];
const searchRecords: SearchRecord[] = [{ type: "knowledge", id: "k1", run_slug: "alpha", slug: "background", title: "Kinetic background", summary: "Residence time", text: "hidden coordinate", href: "/runs/alpha/knowledge/" }];

describe("RunsExplorer", () => {
  it("searches idea text and sorts by updated time", () => {
    expect(filterAndSortRuns(runs, "rotational", "ALL", "updated").map((run) => run.slug)).toEqual(["alpha"]);
    expect(filterAndSortRuns(runs, "", "ALL", "updated").map((run) => run.slug)).toEqual(["beta", "alpha"]);
  });

  it("filters status and toggles grid", async () => {
    const user = userEvent.setup();
    render(<PreferencesProvider><RunsExplorer runs={runs} searchRecords={searchRecords} heading="Runs" /></PreferencesProvider>);
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByText("Alpha study")).toBeInTheDocument();
    expect(screen.queryByText("Beta review")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Grid view" }));
    expect(document.querySelector(".run-grid")).toBeInTheDocument();
  });

  it("groups static knowledge matches", async () => {
    const user = userEvent.setup();
    render(<PreferencesProvider><RunsExplorer runs={runs} searchRecords={searchRecords} heading="Runs" /></PreferencesProvider>);
    await user.type(screen.getByPlaceholderText("Search runs, ideas, domains, or tags"), "residence");
    expect(screen.getByRole("heading", { name: "Knowledge" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kinetic background/ })).toHaveAttribute("href", "/runs/alpha/knowledge");
  });
});
