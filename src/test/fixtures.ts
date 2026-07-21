import type { ResearchIdeaManifest } from "@/lib/types";

export const testIdea: ResearchIdeaManifest = {
  schema_version: "ResearchIdeaManifestV1", idea_id: "i", slug: "i", title: "Test idea", short_title: "Test",
  abstract: "A long enough abstract for the reader component to explain a mechanism.", category: "Mechanism", idea_type: "PRIMARY",
  lifecycle_status: "REVIEWED", featured: true, disposition: "Retained", recommendation: "Recommended for focused testing",
  tags: [], origin: "demo", updated_at: "2026-01-01T00:00:00Z", language_variants: { en: "English", ko: "Korean" },
  report_pdf: { en: "/en.pdf", ko: "/ko.pdf" }, report_markdown: { en: "en.md", ko: "ko.md" }, knowledge_refs: [],
  reference_count: 1, figure_count: 0, publication_status: "DEMO_ONLY", parent_idea_ids: [], family_id: "family-i",
  disposition_reason: "The mechanism has a discriminating test.", nearest_prior_art: "A related component-level precedent.",
  strongest_reason: "The readout separates two explanations.", weakest_causal_edge: "The actuator remains uncertain.", has_fatal_flaw: false,
  fatal_flaw: null, scorecard: { goal_alignment: 5, evidence_grounding: 3, causal_novelty: 4, mechanistic_specificity: 4, physical_coherence: 4, decisive_test_quality: 5, feasibility: 3, expected_information_value: 5 },
  pairwise_summary: "Not compared.", reviewer_disagreement: "Feasibility differs.", reviewer_critiques: ["Keep the readout discriminating."],
  scientific_summary: "The test idea changes a causal state.", causal_mechanism: "The actuator changes residence time.", evidence_basis: "Synthetic support.",
  next_discriminating_experiment: "Compare matched controls."
};
