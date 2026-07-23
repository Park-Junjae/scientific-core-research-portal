export type Locale = "ko" | "en";

export type LocalizedText = Partial<Record<Locale, string>>;

export type RunStatus =
  | "DRAFT"
  | "RUNNING"
  | "REVIEW_REQUIRED"
  | "DONE"
  | "FAILED"
  | "BLOCKED"
  | "ARCHIVED";

export type Visibility = "PRIVATE" | "LAB_INTERNAL" | "PUBLIC_SANITIZED";

export type RunMode =
  | "DISCOVERY_PORTFOLIO_RUN"
  | "FOCUSED_DECISION_RUN"
  | "VERIFICATION_RUN"
  | "MEASUREMENT_DISCOVERY_RUN";

export type IdeaLifecycleStatus =
  | "GENERATED"
  | "MERGED_INTO_FAMILY"
  | "ADMISSIBILITY_REJECTED"
  | "DEVELOPED"
  | "REVIEWED"
  | "REVISION_REQUIRED"
  | "REVISED"
  | "ARENA_ELIGIBLE"
  | "ARENA_COMPARED"
  | "FINALIST"
  | "CONDITIONAL"
  | "MEASUREMENT_PROGRAM"
  | "PARKED"
  | "DROPPED";

export type ReportRole =
  | "KNOWLEDGE_BACKGROUND"
  | "IDEA_REPORT"
  | "PORTFOLIO_DECISION"
  | "RESEARCH_SUMMARY"
  | "RUN_SPECIFICATION"
  | "MEASUREMENT_REPORT"
  | "TECHNICAL_APPENDIX";

export interface LiteratureStats {
  analyzed_unique_total: number | null;
  discovered?: number;
  title_abstract_screened?: number;
  full_text_reviewed?: number;
  deeply_read?: number;
  load_bearing_sources?: number;
  final_reference_count?: number;
  unique_cited_sources?: number;
  report_reference_count?: number;
}

export type LiteratureAnalysisStage =
  | "SOURCE_ATLAS_CURATED"
  | "BIBLIOGRAPHY_SOURCE_VERIFIED"
  | "DISCOVERED_ONLY"
  | "SEARCH_RESULT_ONLY"
  | "TITLE_ABSTRACT_SCREENED"
  | "FULL_TEXT_TRIAGED"
  | "FULL_TEXT_REVIEWED"
  | "DEEPLY_READ"
  | "LOAD_BEARING"
  | "CITED"
  | "DUPLICATE"
  | "DUPLICATE_RECORD"
  | "REPORT_REFERENCE_ENTRY"
  | "REPEATED_CITATION"
  | "UNSCREENED"
  | "UNSCREENED_SOURCE";

export type SourceAnalysisEventType =
  | "SOURCE_ATLAS_CURATED"
  | "TITLE_ABSTRACT_ANALYZED"
  | "FULL_TEXT_REVIEWED"
  | "MECHANISM_EVIDENCE_MAPPED"
  | "CONTRADICTORY_EVIDENCE_MAPPED"
  | "REPORT_ARGUMENT_USED"
  | "BIBLIOGRAPHY_SOURCE_VERIFIED";

export type SourceCorpusMembership =
  | "SOURCE_ATLAS_ONLY"
  | "SOURCE_ATLAS_AND_FINAL_REPORT"
  | "FINAL_REPORT_ADDITION";

export interface LiteratureRecord {
  title: string;
  authors?: string[];
  doi?: string;
}

export type EvidenceRole =
  | "ANCHOR"
  | "DIRECT_PRECEDENT"
  | "MECHANISM"
  | "METHODS"
  | "CONTRADICTORY"
  | "NEGATIVE"
  | "SAFETY"
  | "CONTEXT"
  | "REVIEW";

export type SourceAccessLevel =
  | "CITATION_ONLY"
  | "ABSTRACT"
  | "MAIN_TEXT"
  | "MAIN_TEXT_AND_METHODS"
  | "FULL_TEXT"
  | "FULL_TEXT_AND_SUPPLEMENT"
  | "SOURCE_DATA";

export interface ResearchSourceManifestV1 {
  schema_version: "ResearchSourceManifestV1";
  source_id: string;
  localized_title: LocalizedText;
  authors: string[];
  journal: string;
  year: number;
  volume: string | null;
  pages_or_article_number: string | null;
  doi: string | null;
  pmid: string | null;
  url: string | null;
  source_type: string;
  evidence_role: EvidenceRole;
  access_level: SourceAccessLevel;
  analysis_stage?: LiteratureAnalysisStage;
  corpus_membership?: SourceCorpusMembership;
  source_atlas_member?: boolean;
  final_report_cited?: boolean;
  first_seen_stage?: SourceAnalysisEventType;
  last_used_stage?: SourceAnalysisEventType;
  analysis_event_count?: number;
  full_text_reviewed: boolean | null;
  deeply_read: boolean | null;
  load_bearing: boolean;
  localized_relevance: LocalizedText;
  localized_shows: LocalizedText;
  localized_does_not_show: LocalizedText;
  related_run_ids: string[];
  related_idea_ids: string[];
  related_report_ids: string[];
  related_report_sections: Array<{ report_id: string; section_ids: string[] }>;
  cited_in_reports: Array<{ report_id: string; citation_numbers: number[] }>;
  publication_status: "APPROVED" | "DEMO_ONLY" | "WITHHELD";
  display_order?: number;
}

export interface ResearchSourceIndexV1 {
  schema_version: "ResearchSourceIndexV1";
  run_id: string;
  sources: ResearchSourceManifestV1[];
}

export interface RunSourceLedgerEntryV1 {
  source_id: string;
  doi: string | null;
  pmid: string | null;
  normalized_title: string;
  year: number;
  source_atlas_member: boolean;
  final_report_cited: boolean;
  load_bearing: boolean;
  corpus_membership: SourceCorpusMembership;
  first_seen_stage: SourceAnalysisEventType;
  last_used_stage: SourceAnalysisEventType;
  analysis_event_count: number;
  analysis_events: Array<{ event_type: SourceAnalysisEventType; stage_id: string }>;
  related_report_ids: string[];
  related_idea_ids: string[];
  access_level: SourceAccessLevel;
}

export interface RunSourceLedgerV1 {
  schema_version: "RunSourceLedgerV1";
  run_id: string;
  deduplication_order: ["DOI", "PMID", "NORMALIZED_TITLE_YEAR"];
  source_count: number;
  sources: RunSourceLedgerEntryV1[];
}

export interface ResearchReportManifestV2 {
  schema_version: "ResearchReportManifestV2";
  report_id: string;
  translation_group_id: string;
  role: ReportRole;
  localized_title: LocalizedText;
  localized_description: LocalizedText;
  language: Locale;
  path: string | null;
  markdown_path: string | null;
  page_count: number | null;
  reference_count: number | null;
  primary_source_count: number | null;
  report_status: "DRAFT" | "APPROVED" | "DEMO_SUMMARY" | "WITHHELD";
  is_primary: boolean;
  display_order: number;
  updated_at: string;
}

export interface PortfolioFunnel {
  raw_generation_count: number;
  independent_generation_count: number;
  natural_family_count: number;
  developed_count: number;
  reviewed_count: number;
  arena_entrant_count: number;
  finalist_count: number;
  parked_count: number;
  dropped_count: number;
}

export interface IdeaScorecard {
  goal_alignment: number;
  evidence_grounding: number;
  causal_novelty: number;
  mechanistic_specificity: number;
  physical_coherence: number;
  decisive_test_quality: number;
  feasibility: number;
  expected_information_value: number;
}

export interface PairwiseComparison {
  comparison_id: string;
  idea_a_id: string;
  idea_b_id: string;
  perspective: "STRUCTURAL" | "EXPERIMENTAL_FALSIFICATION" | "SKEPTICAL";
  winner: "A" | "B" | "TIE";
  rationale: string;
  fatal_objection: string | null;
  confidence: number;
  disagreement: string;
  coverage: number;
}

export interface SourceLineage {
  source_run_id: string;
  generated_count: number;
  natural_family_count: number;
  arena_entrant_count: number;
  match_count: number;
  finalist_count: number;
  terminal_state: string;
}

export interface TimelineEntry {
  date: string;
  label: LocalizedText;
  detail: LocalizedText;
}

export interface ArtifactRef {
  id: string;
  title: LocalizedText;
  kind: "PDF" | "MARKDOWN" | "JSON" | "CSV" | "IMAGE";
  path: string;
  language?: Locale;
  size_bytes?: number;
}

export interface ResearchRunManifest {
  schema_version: "ResearchRunManifestV2";
  run_id: string;
  slug: string;
  title: LocalizedText;
  short_title: LocalizedText;
  subtitle: LocalizedText;
  owner: string;
  created_at: string;
  updated_at: string;
  status: RunStatus;
  terminal_state: string;
  run_mode: RunMode;
  research_domain: LocalizedText;
  research_question: LocalizedText;
  research_goal: LocalizedText;
  current_bottleneck: LocalizedText;
  success_criteria: LocalizedText[];
  experimental_constraints: LocalizedText[];
  non_goals: LocalizedText[];
  requested_outputs: LocalizedText[];
  summary: LocalizedText;
  scientific_decision: LocalizedText;
  reading_order: LocalizedText[];
  tags: LocalizedText[];
  languages: Locale[];
  visibility: Visibility;
  publication_status: "DRAFT" | "APPROVED" | "DEMO_ONLY" | "WITHHELD";
  idea_count: number;
  reviewed_idea_count: number;
  retained_idea_count: number;
  report_count: number;
  knowledge_document_count: number;
  featured: boolean;
  source_type: "SYNTHETIC_DEMO" | "SANITIZED_EXPORT" | "HISTORICAL_SANITIZED" | "APPROVED_LOCAL_REPORT";
  source_commit: string;
  source_bundle_hash: string;
  current_stage: string;
  progress_percent: number;
  timeline: TimelineEntry[];
  idea_refs: string[];
  reports: ResearchReportManifestV2[];
  artifact_refs: ArtifactRef[];
  historical_fixture_paths?: string[];
  primary_report_id: string;
  primary_knowledge_id: string;
  primary_summary_id: string;
  run_specification_id: string;
  literature_stats: LiteratureStats;
  literature_index: LiteratureRecord[];
  portfolio_funnel: PortfolioFunnel;
  pairwise_comparisons: PairwiseComparison[];
  pairwise_selection_impact: LocalizedText;
  source_lineage?: SourceLineage;
}

export interface ResearchIdeaManifest {
  schema_version: "ResearchIdeaManifestV2";
  idea_id: string;
  slug: string;
  title: LocalizedText;
  short_title: LocalizedText;
  abstract: LocalizedText;
  category: LocalizedText;
  idea_type: "PRIMARY" | "ALTERNATIVE" | "CONDITIONAL" | "MEASUREMENT_PROGRAM" | "EXTENSION" | "SUPPORTING";
  lifecycle_status: IdeaLifecycleStatus;
  featured: boolean;
  disposition: LocalizedText;
  recommendation: LocalizedText;
  tags: LocalizedText[];
  origin: string;
  updated_at: string;
  report_id: string | null;
  knowledge_refs: string[];
  reference_count: number;
  figure_count: number;
  publication_status: "APPROVED" | "DEMO_ONLY" | "WITHHELD";
  parent_idea_ids: string[];
  family_id?: string | null;
  merge_reason?: string;
  disposition_reason: LocalizedText;
  nearest_prior_art?: LocalizedText;
  strongest_reason: LocalizedText;
  weakest_causal_edge: LocalizedText;
  has_fatal_flaw: boolean;
  fatal_flaw?: LocalizedText | null;
  scorecard?: IdeaScorecard;
  pairwise_summary?: LocalizedText;
  reviewer_disagreement?: LocalizedText;
  reviewer_critiques: LocalizedText[];
  finalist_reason?: LocalizedText;
  reentry_condition?: LocalizedText;
  scientific_summary: LocalizedText;
  why_this_idea: LocalizedText;
  causal_mechanism: LocalizedText;
  evidence_basis: LocalizedText;
  proposed_comparison: LocalizedText;
  expected_result: LocalizedText;
  next_discriminating_experiment: LocalizedText;
}

export interface RunWithIdeas extends ResearchRunManifest {
  ideas: ResearchIdeaManifest[];
  sources: ResearchSourceManifestV1[];
}

export interface SearchRecord {
  type: "run" | "idea" | "knowledge" | "report" | "source";
  id: string;
  run_slug: string;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  text: string;
  href: string;
}
