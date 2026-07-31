import type { Locale } from "./types";

/* The Backend publishes stage names from a fixed allowlist. They are internal
   identifiers, so nothing should ever print one at a reader — but two screens
   need to name the same stage, and two maps would drift, so there is one here.

   An identifier that is not listed returns null. Callers show nothing rather
   than falling back to the raw name: a new stage arriving from the Backend
   should be invisible, not leak an enum into the interface. */
const STAGE_LABELS: Record<string, [ko: string, en: string]> = {
  runner_accepted: ["실행 시작", "Execution started"],
  source_preflight: ["사전 점검", "Preflight"],
  scientific_framing: ["문제 재구성", "Reframing the problem"],
  mechanistic_decomposition: ["기전 분해", "Decomposing the mechanism"],
  blind_multi_lens_ideation: ["다중 렌즈 발상", "Multi-lens ideation"],
  idea_generation: ["아이디어 생성", "Generating ideas"],
  presearch_idea_freeze: ["아이디어 동결", "Idea freeze"],
  literature_retrieval: ["문헌 검색", "Retrieving literature"],
  novelty_and_precedent_audit: ["신규성 대조", "Novelty audit"],
  mechanism_family_grouping: ["기전 계열 분류", "Grouping mechanisms"],
  family_grouping: ["계열 분류", "Grouping"],
  proposal_development: ["제안 구체화", "Developing proposals"],
  scientific_development: ["연구 구체화", "Scientific development"],
  skeptical_review: ["회의적 검토", "Skeptical review"],
  revision: ["제안 개정", "Revising proposals"],
  dual_axis_portfolio: ["이중축 포트폴리오", "Dual-axis portfolio"],
  comparison: ["비교", "Comparison"],
  synthesis: ["종합", "Synthesis"],
  report_generation: ["보고서 작성", "Generating reports"],
  publication_packaging: ["결과 정리", "Packaging results"],
  completed: ["완료", "Completed"],
  failed: ["실패", "Failed"],
  cancelled: ["취소됨", "Cancelled"],
};

export function stageLabel(stage: string, locale: Locale): string | null {
  const label = STAGE_LABELS[stage];
  if (!label) return null;
  return locale === "ko" ? label[0] : label[1];
}

export function isKnownStage(stage: string): boolean {
  return stage in STAGE_LABELS;
}
