export type RunStatus =
  | "DRAFT"
  | "RUNNING"
  | "REVIEW_REQUIRED"
  | "DONE"
  | "FAILED"
  | "BLOCKED"
  | "ARCHIVED";

export type Visibility = "PRIVATE" | "LAB_INTERNAL" | "PUBLIC_SANITIZED";

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
}

export interface ResearchIdeaManifest {
  schema_version: "ResearchIdeaManifestV1";
  idea_id: string;
  slug: string;
  title: string;
  short_title: string;
  abstract: string;
  category: string;
  disposition: string;
  recommendation: string;
  tags: string[];
  origin: string;
  updated_at: string;
  language_variants: Record<string, string>;
  report_pdf: Record<string, string>;
  report_markdown: Record<string, string>;
  knowledge_refs: string[];
  reference_count: number;
  figure_count: number;
  publication_status: "APPROVED" | "DEMO_ONLY" | "WITHHELD";
}

export interface RunWithIdeas extends ResearchRunManifest {
  ideas: ResearchIdeaManifest[];
}
