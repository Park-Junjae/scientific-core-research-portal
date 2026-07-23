import type { ResearchIdeaManifest, ResearchReportManifestV2, ResearchSourceManifestV1, RunWithIdeas } from "@/lib/types";

const tx = (en: string, ko: string) => ({ en, ko });

export const testReports: ResearchReportManifestV2[] = [
  { schema_version: "ResearchReportManifestV2", report_id: "idea-en", translation_group_id: "idea", role: "IDEA_REPORT", localized_title: tx("Complete idea report", "전체 아이디어 보고서"), localized_description: tx("Approved report", "승인된 보고서"), language: "en", path: "/en.pdf", markdown_path: "en.md", page_count: 13, reference_count: 9, primary_source_count: 5, report_status: "APPROVED", is_primary: true, display_order: 1, updated_at: "2026-07-21T00:00:00Z" },
  { schema_version: "ResearchReportManifestV2", report_id: "idea-ko", translation_group_id: "idea", role: "IDEA_REPORT", localized_title: tx("Complete idea report", "전체 아이디어 보고서"), localized_description: tx("Approved report", "승인된 보고서"), language: "ko", path: "/ko.pdf", markdown_path: "ko.md", page_count: 13, reference_count: 9, primary_source_count: 5, report_status: "APPROVED", is_primary: true, display_order: 1, updated_at: "2026-07-21T00:00:00Z" },
  { schema_version: "ResearchReportManifestV2", report_id: "summary-en", translation_group_id: "summary", role: "RESEARCH_SUMMARY", localized_title: tx("Research summary", "연구 요약"), localized_description: tx("Summary", "요약"), language: "en", path: null, markdown_path: "summary.md", page_count: null, reference_count: null, primary_source_count: null, report_status: "DEMO_SUMMARY", is_primary: false, display_order: 2, updated_at: "2026-07-21T00:00:00Z" },
  { schema_version: "ResearchReportManifestV2", report_id: "knowledge-en", translation_group_id: "knowledge", role: "KNOWLEDGE_BACKGROUND", localized_title: tx("Knowledge background", "지식 배경"), localized_description: tx("Background", "배경"), language: "en", path: null, markdown_path: "knowledge.md", page_count: 21, reference_count: 14, primary_source_count: 8, report_status: "APPROVED", is_primary: false, display_order: 0, updated_at: "2026-07-21T00:00:00Z" },
  { schema_version: "ResearchReportManifestV2", report_id: "spec-en", translation_group_id: "spec", role: "RUN_SPECIFICATION", localized_title: tx("Run specification", "연구 명세"), localized_description: tx("Specification", "명세"), language: "en", path: null, markdown_path: "spec.md", page_count: null, reference_count: null, primary_source_count: null, report_status: "APPROVED", is_primary: false, display_order: 3, updated_at: "2026-07-21T00:00:00Z" },
];

export const testIdea: ResearchIdeaManifest = {
  schema_version: "ResearchIdeaManifestV2", idea_id: "i", slug: "i", title: tx("Test idea", "시험 아이디어"), short_title: tx("Test", "시험"), abstract: tx("A mechanism-level abstract for the reader.", "독자를 위한 기전 수준의 초록입니다."), category: tx("Mechanism", "기전"), idea_type: "PRIMARY", lifecycle_status: "REVIEWED", featured: true, disposition: tx("Retained", "유지"), recommendation: tx("Focused testing", "집중 검토"), tags: [tx("kinetics", "동역학")], origin: "demo", updated_at: "2026-01-01T00:00:00Z", report_id: "idea-en", knowledge_refs: [], reference_count: 1, figure_count: 0, publication_status: "DEMO_ONLY", parent_idea_ids: [], family_id: "family-i", disposition_reason: tx("The mechanism has a discriminating test.", "기전을 판별할 실험이 있습니다."), nearest_prior_art: tx("A related component precedent.", "관련 성분 수준 선행 사례입니다."), strongest_reason: tx("The readout separates explanations.", "측정값이 대안 설명을 구분합니다."), weakest_causal_edge: tx("The actuator remains uncertain.", "작동 인자가 아직 불확실합니다."), has_fatal_flaw: false, fatal_flaw: null, scorecard: { goal_alignment: 5, evidence_grounding: 3, causal_novelty: 4, mechanistic_specificity: 4, physical_coherence: 4, decisive_test_quality: 5, feasibility: 3, expected_information_value: 5 }, pairwise_summary: tx("Not compared.", "비교하지 않았습니다."), reviewer_disagreement: tx("Feasibility differs.", "실행 가능성에 이견이 있습니다."), reviewer_critiques: [tx("Keep the readout discriminating.", "판별 가능한 측정을 유지해야 합니다.")], scientific_summary: tx("The test idea changes a causal state.", "시험 아이디어는 인과 상태를 바꿉니다."), why_this_idea: tx("It isolates a hidden state.", "숨은 상태를 분리합니다."), causal_mechanism: tx("The actuator changes residence time.", "작동 인자가 체류 시간을 바꿉니다."), evidence_basis: tx("Component-level support.", "성분 수준 근거입니다."), proposed_comparison: tx("Compare matched controls.", "대응 대조군과 비교합니다."), expected_result: tx("Product changes without bulk abundance change.", "전체 양 변화 없이 산물이 변합니다."), next_discriminating_experiment: tx("Compare matched controls.", "대응 대조군을 비교합니다."),
};

export const testSources: ResearchSourceManifestV1[] = [{
  schema_version: "ResearchSourceManifestV1",
  source_id: "source-1",
  display_order: 1,
  localized_title: tx("A cited paper", "인용 논문"),
  authors: ["A Researcher"],
  journal: "Test Journal",
  year: 2025,
  volume: "1",
  pages_or_article_number: "1-10",
  doi: "10.0000/test",
  pmid: null,
  url: "https://doi.org/10.0000/test",
  source_type: "PRIMARY_RESEARCH",
  evidence_role: "MECHANISM",
  access_level: "MAIN_TEXT",
  full_text_reviewed: true,
  deeply_read: false,
  load_bearing: true,
  localized_relevance: tx("Supports the causal edge.", "인과 연결을 뒷받침합니다."),
  localized_shows: tx("A component-level mechanism.", "성분 수준 기전을 보여줍니다."),
  localized_does_not_show: tx("It does not validate the full idea.", "전체 아이디어를 검증하지는 않습니다."),
  related_run_ids: ["r"],
  related_idea_ids: ["i"],
  related_report_ids: ["idea-en", "idea-ko"],
  related_report_sections: [{ report_id: "idea-en", section_ids: ["evidence"] }],
  cited_in_reports: [{ report_id: "idea-en", citation_numbers: [1] }, { report_id: "idea-ko", citation_numbers: [1] }],
  publication_status: "DEMO_ONLY",
}];

export const testRun: RunWithIdeas = {
  schema_version: "ResearchRunManifestV2", run_id: "r", slug: "r", title: tx("Focused run", "집중 연구"), short_title: tx("Focused", "집중"), subtitle: tx("Decision subtitle", "의사결정 부제"), owner: "Core", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-02T00:00:00Z", status: "DONE", terminal_state: "DONE", run_mode: "FOCUSED_DECISION_RUN", research_domain: tx("Biology", "생물학"), research_question: tx("What state controls product formation?", "어떤 상태가 산물 형성을 조절하는가?"), research_goal: tx("Resolve a decision.", "의사결정을 해결합니다."), current_bottleneck: tx("The state is not measured.", "해당 상태를 측정하지 못했습니다."), success_criteria: [tx("Discriminate mechanisms.", "기전을 구분합니다.")], experimental_constraints: [tx("Matched controls.", "대응 대조군")], non_goals: [tx("No validation claim.", "검증 주장 없음")], requested_outputs: [tx("Summary", "요약")], summary: tx("A concise scientific summary.", "간결한 연구 요약입니다."), scientific_decision: tx("Test the primary idea first.", "주요 아이디어를 먼저 시험합니다."), reading_order: [tx("Summary", "요약"), tx("Idea report", "아이디어 보고서")], tags: [tx("kinetics", "동역학")], languages: ["en", "ko"], visibility: "PUBLIC_SANITIZED", publication_status: "DEMO_ONLY", idea_count: 1, reviewed_idea_count: 1, retained_idea_count: 1, report_count: 1, knowledge_document_count: 1, featured: true, source_type: "SYNTHETIC_DEMO", source_commit: "demo", source_bundle_hash: "demo", current_stage: "done", progress_percent: 100, timeline: [], idea_refs: ["i"], reports: testReports, artifact_refs: [], primary_report_id: "idea-en", primary_knowledge_id: "knowledge-en", primary_summary_id: "summary-en", run_specification_id: "spec-en", literature_stats: { analyzed_unique_total: 200, discovered: 30, full_text_reviewed: 8, deeply_read: 5, load_bearing_sources: 3, unique_cited_sources: 1, report_reference_count: 4, final_reference_count: 4 }, literature_index: [{ title: "A cited paper", authors: ["A Researcher"], doi: "10.0000/test" }], portfolio_funnel: { raw_generation_count: 1, independent_generation_count: 1, natural_family_count: 1, developed_count: 1, reviewed_count: 1, arena_entrant_count: 0, finalist_count: 0, parked_count: 0, dropped_count: 0 }, pairwise_comparisons: [], pairwise_selection_impact: tx("No comparison required.", "비교가 필요하지 않았습니다."), ideas: [testIdea], sources: testSources,
};
