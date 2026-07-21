import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { RunWithIdeas } from "@/lib/types";
import { RunsExplorer, filterAndSortRuns } from "./runs-explorer";

const base = {
  schema_version: "ResearchRunManifestV1",
  run_id: "r1", slug: "alpha", title: "Alpha study", short_title: "Alpha", subtitle: "Mechanism", owner: "Core",
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z", status: "DONE", terminal_state: "DONE",
  research_domain: "Biology", research_goal: "Goal", summary: "Summary", scientific_decision: "Decision", reading_order: [], tags: ["kinetics"], languages: ["en"], visibility: "PUBLIC_SANITIZED", publication_status: "DEMO_ONLY", idea_count: 1, reviewed_idea_count: 1, retained_idea_count: 1, report_count: 1, knowledge_document_count: 1, featured: true, source_type: "SYNTHETIC_DEMO", source_commit: "demo", source_bundle_hash: "demo", current_stage: "done", progress_percent: 100, timeline: [], idea_refs: ["idea"], report_refs: [], knowledge_refs: [], artifact_refs: [],
  ideas: [{ schema_version: "ResearchIdeaManifestV1", idea_id: "i1", slug: "idea", title: "Rotational registry", short_title: "Registry", abstract: "A sufficiently long abstract that contains hidden coordinate language.", category: "Mechanism", disposition: "Retained", recommendation: "Recommended for focused testing", tags: ["phase"], origin: "demo", updated_at: "2026-02-01T00:00:00Z", language_variants: { en: "English" }, report_pdf: { en: "/a.pdf" }, report_markdown: { en: "a.md" }, knowledge_refs: [], reference_count: 1, figure_count: 0, publication_status: "DEMO_ONLY" }],
} satisfies RunWithIdeas;

const runs = [base, { ...base, run_id: "r2", slug: "beta", title: "Beta review", status: "REVIEW_REQUIRED", updated_at: "2026-03-01T00:00:00Z", reviewed_idea_count: 4, ideas: [{ ...base.ideas[0], title: "Assembly state" }] } satisfies RunWithIdeas];

describe("RunsExplorer", () => {
  it("searches idea text and sorts by updated time", () => {
    expect(filterAndSortRuns(runs, "rotational", "ALL", "updated").map((run) => run.slug)).toEqual(["alpha"]);
    expect(filterAndSortRuns(runs, "", "ALL", "updated").map((run) => run.slug)).toEqual(["beta", "alpha"]);
  });

  it("filters status and toggles grid", async () => {
    const user = userEvent.setup();
    render(<RunsExplorer runs={runs} heading="Runs" />);
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByText("Alpha study")).toBeInTheDocument();
    expect(screen.queryByText("Beta review")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Grid view" }));
    expect(document.querySelector(".run-grid")).toBeInTheDocument();
  });
});
