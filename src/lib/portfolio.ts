import type { IdeaLifecycleStatus, ResearchIdeaManifest, RunMode } from "./types";

export type LifecycleFilter =
  | "ALL"
  | "GENERATED"
  | "DEVELOPED"
  | "REVIEWED"
  | "ARENA"
  | "FINALISTS"
  | "CONDITIONAL"
  | "MEASUREMENT"
  | "PARKED"
  | "DROPPED";

export const lifecycleFilters: Array<{ value: LifecycleFilter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "GENERATED", label: "Generated" },
  { value: "DEVELOPED", label: "Developed" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "ARENA", label: "Arena" },
  { value: "FINALISTS", label: "Finalists" },
  { value: "CONDITIONAL", label: "Conditional" },
  { value: "MEASUREMENT", label: "Measurement" },
  { value: "PARKED", label: "Parked" },
  { value: "DROPPED", label: "Dropped" },
];

const lifecycleGroups: Record<Exclude<LifecycleFilter, "ALL">, IdeaLifecycleStatus[]> = {
  GENERATED: ["GENERATED", "MERGED_INTO_FAMILY", "ADMISSIBILITY_REJECTED"],
  DEVELOPED: ["DEVELOPED", "REVISION_REQUIRED", "REVISED"],
  REVIEWED: ["REVIEWED"],
  ARENA: ["ARENA_ELIGIBLE", "ARENA_COMPARED"],
  FINALISTS: ["FINALIST"],
  CONDITIONAL: ["CONDITIONAL"],
  MEASUREMENT: ["MEASUREMENT_PROGRAM"],
  PARKED: ["PARKED"],
  DROPPED: ["DROPPED", "ADMISSIBILITY_REJECTED"],
};

export function ideaMatchesLifecycle(idea: ResearchIdeaManifest, filter: LifecycleFilter) {
  return filter === "ALL" || lifecycleGroups[filter].includes(idea.lifecycle_status);
}

export const runModeLabels: Record<RunMode, string> = {
  DISCOVERY_PORTFOLIO_RUN: "Discovery portfolio",
  FOCUSED_DECISION_RUN: "Focused decision",
  VERIFICATION_RUN: "Verification",
  MEASUREMENT_DISCOVERY_RUN: "Measurement discovery",
};

export const lifecycleLabels: Record<IdeaLifecycleStatus, string> = {
  GENERATED: "Generated",
  MERGED_INTO_FAMILY: "Merged into family",
  ADMISSIBILITY_REJECTED: "Admissibility rejected",
  DEVELOPED: "Developed",
  REVIEWED: "Reviewed",
  REVISION_REQUIRED: "Revision required",
  REVISED: "Revised",
  ARENA_ELIGIBLE: "Arena eligible",
  ARENA_COMPARED: "Arena compared",
  FINALIST: "Finalist",
  CONDITIONAL: "Conditional",
  MEASUREMENT_PROGRAM: "Measurement program",
  PARKED: "Parked",
  DROPPED: "Dropped",
};

const scoreLabels: Record<string, string> = {
  goal_alignment: "Goal",
  evidence_grounding: "Evidence",
  causal_novelty: "Novelty",
  mechanistic_specificity: "Mechanism",
  physical_coherence: "Physics",
  decisive_test_quality: "Test",
  feasibility: "Feasibility",
  expected_information_value: "Info value",
};

export function scoreVector(idea: ResearchIdeaManifest) {
  if (!idea.scorecard) return [];
  return Object.entries(idea.scorecard).map(([axis, score]) => ({
    axis,
    label: scoreLabels[axis] ?? axis,
    score,
  }));
}

export function reportAvailability(idea: ResearchIdeaManifest) {
  const pdfCount = Object.keys(idea.report_pdf ?? {}).length;
  const markdownCount = Object.keys(idea.report_markdown ?? {}).length;
  if (pdfCount > 0) return `${pdfCount} PDF variant${pdfCount === 1 ? "" : "s"}`;
  if (markdownCount > 0) return "Reader report";
  return "Summary only";
}
