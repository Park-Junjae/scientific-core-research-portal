import type { IdeaLifecycleStatus, Locale, ResearchIdeaManifest, RunMode } from "./types";

export type LifecycleFilter = "ALL" | "GENERATED" | "DEVELOPED" | "REVIEWED" | "ARENA" | "FINALISTS" | "CONDITIONAL" | "MEASUREMENT" | "PARKED" | "DROPPED";

export const lifecycleFilters: LifecycleFilter[] = ["ALL", "GENERATED", "DEVELOPED", "REVIEWED", "ARENA", "FINALISTS", "CONDITIONAL", "MEASUREMENT", "PARKED", "DROPPED"];

const lifecycleGroups: Record<Exclude<LifecycleFilter, "ALL">, IdeaLifecycleStatus[]> = {
  GENERATED: ["GENERATED", "MERGED_INTO_FAMILY", "ADMISSIBILITY_REJECTED"], DEVELOPED: ["DEVELOPED", "REVISION_REQUIRED", "REVISED"], REVIEWED: ["REVIEWED"], ARENA: ["ARENA_ELIGIBLE", "ARENA_COMPARED"], FINALISTS: ["FINALIST"], CONDITIONAL: ["CONDITIONAL"], MEASUREMENT: ["MEASUREMENT_PROGRAM"], PARKED: ["PARKED"], DROPPED: ["DROPPED", "ADMISSIBILITY_REJECTED"],
};

export function ideaMatchesLifecycle(idea: ResearchIdeaManifest, filter: LifecycleFilter) { return filter === "ALL" || lifecycleGroups[filter].includes(idea.lifecycle_status); }

export const runModeLabels: Record<Locale, Record<RunMode, string>> = {
  en: { DISCOVERY_PORTFOLIO_RUN: "Discovery portfolio", FOCUSED_DECISION_RUN: "Focused decision", VERIFICATION_RUN: "Verification", MEASUREMENT_DISCOVERY_RUN: "Measurement discovery" },
  ko: { DISCOVERY_PORTFOLIO_RUN: "탐색 포트폴리오", FOCUSED_DECISION_RUN: "집중 의사결정", VERIFICATION_RUN: "검증", MEASUREMENT_DISCOVERY_RUN: "측정 탐색" },
};

export const lifecycleLabels: Record<Locale, Record<IdeaLifecycleStatus, string>> = {
  en: { GENERATED: "Generated", MERGED_INTO_FAMILY: "Merged into family", ADMISSIBILITY_REJECTED: "Admissibility rejected", DEVELOPED: "Developed", REVIEWED: "Reviewed", REVISION_REQUIRED: "Revision required", REVISED: "Revised", ARENA_ELIGIBLE: "Comparison eligible", ARENA_COMPARED: "Compared", FINALIST: "Finalist", CONDITIONAL: "Conditional", MEASUREMENT_PROGRAM: "Measurement program", PARKED: "Parked", DROPPED: "Dropped" },
  ko: { GENERATED: "생성", MERGED_INTO_FAMILY: "계열로 통합", ADMISSIBILITY_REJECTED: "검토 제외", DEVELOPED: "발전", REVIEWED: "검토 완료", REVISION_REQUIRED: "수정 필요", REVISED: "수정 완료", ARENA_ELIGIBLE: "비교 가능", ARENA_COMPARED: "비교 완료", FINALIST: "최종 후보", CONDITIONAL: "조건부", MEASUREMENT_PROGRAM: "측정 프로그램", PARKED: "보류", DROPPED: "중단" },
};

export const lifecycleFilterLabels: Record<Locale, Record<LifecycleFilter, string>> = {
  en: { ALL: "All", GENERATED: "Generated", DEVELOPED: "Developed", REVIEWED: "Reviewed", ARENA: "Compared", FINALISTS: "Finalists", CONDITIONAL: "Conditional", MEASUREMENT: "Measurement", PARKED: "Parked", DROPPED: "Dropped" },
  ko: { ALL: "전체", GENERATED: "생성", DEVELOPED: "발전", REVIEWED: "검토", ARENA: "비교", FINALISTS: "최종 후보", CONDITIONAL: "조건부", MEASUREMENT: "측정", PARKED: "보류", DROPPED: "중단" },
};

const scoreLabels: Record<Locale, Record<string, string>> = {
  en: { goal_alignment: "Goal", evidence_grounding: "Evidence", causal_novelty: "Novelty", mechanistic_specificity: "Mechanism", physical_coherence: "Physics", decisive_test_quality: "Test", feasibility: "Feasibility", expected_information_value: "Information value" },
  ko: { goal_alignment: "목표", evidence_grounding: "근거", causal_novelty: "새로움", mechanistic_specificity: "기전", physical_coherence: "물리적 타당성", decisive_test_quality: "판별 실험", feasibility: "실행 가능성", expected_information_value: "정보 가치" },
};

export function scoreVector(idea: ResearchIdeaManifest, locale: Locale = "en") {
  if (!idea.scorecard) return [];
  return Object.entries(idea.scorecard).map(([axis, score]) => ({ axis, label: scoreLabels[locale][axis] ?? axis, score }));
}
