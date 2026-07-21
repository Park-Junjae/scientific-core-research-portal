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
  label: string;
  detail: string;
}

export interface ArtifactRef {
  id: string;
  title: string;
  kind: "PDF" | "MARKDOWN" | "JSON" | "CSV" | "IMAGE";
  path: string;
  language?: string;
  size_bytes?: number;
}

export interface ResearchRunManifest {
  schema_version: "ResearchRunManifestV1";
  run_id: string;
  slug: string;
  title: string;
  short_title: string;
  subtitle: string;
  owner: string;
  created_at: string;
  updated_at: string;
  status: RunStatus;
  terminal_state: string;
  run_mode: RunMode;
  research_domain: string;
  research_goal: string;
  summary: string;
  scientific_decision: string;
  reading_order: string[];
  tags: string[];
  languages: string[];
  visibility: Visibility;
  publication_status: "DRAFT" | "APPROVED" | "DEMO_ONLY" | "WITHHELD";
  idea_count: number;
  reviewed_idea_count: number;
  retained_idea_count: number;
  report_count: number;
  knowledge_document_count: number;
  featured: boolean;
  source_type: "SYNTHETIC_DEMO" | "SANITIZED_EXPORT" | "HISTORICAL_SANITIZED";
  source_commit: string;
  source_bundle_hash: string;
  current_stage: string;
  progress_percent: number;
  timeline: TimelineEntry[];
  idea_refs: string[];
  report_refs: ArtifactRef[];
  knowledge_refs: ArtifactRef[];
  artifact_refs: ArtifactRef[];
  portfolio_funnel: PortfolioFunnel;
  pairwise_comparisons: PairwiseComparison[];
  pairwise_selection_impact: string;
  source_lineage?: SourceLineage;
}

export interface ResearchIdeaManifest {
  schema_version: "ResearchIdeaManifestV1";
  idea_id: string;
  slug: string;
  title: string;
  short_title: string;
  abstract: string;
  category: string;
  idea_type: "PRIMARY" | "ALTERNATIVE" | "CONDITIONAL" | "MEASUREMENT_PROGRAM" | "EXTENSION" | "SUPPORTING";
  lifecycle_status: IdeaLifecycleStatus;
  featured: boolean;
  disposition: string;
  recommendation: string;
  tags: string[];
  origin: string;
  updated_at: string;
  language_variants: Record<string, string>;
  report_pdf?: Record<string, string>;
  report_markdown?: Record<string, string>;
  knowledge_refs: string[];
  reference_count: number;
  figure_count: number;
  publication_status: "APPROVED" | "DEMO_ONLY" | "WITHHELD";
  parent_idea_ids: string[];
  family_id?: string | null;
  merge_reason?: string;
  disposition_reason: string;
  nearest_prior_art?: string;
  strongest_reason: string;
  weakest_causal_edge: string;
  has_fatal_flaw: boolean;
  fatal_flaw?: string | null;
  scorecard?: IdeaScorecard;
  pairwise_summary?: string;
  reviewer_disagreement?: string;
  reviewer_critiques: string[];
  finalist_reason?: string;
  reentry_condition?: string;
  scientific_summary: string;
  causal_mechanism: string;
  evidence_basis: string;
  next_discriminating_experiment: string;
}

export interface RunWithIdeas extends ResearchRunManifest {
  ideas: ResearchIdeaManifest[];
}

export interface SearchRecord {
  type: "run" | "idea" | "knowledge" | "report";
  id: string;
  run_slug: string;
  slug: string;
  title: string;
  summary: string;
  text: string;
  href: string;
}
