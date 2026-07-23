import type { EvidenceRole, LiteratureStats, Locale, ResearchSourceManifestV1 } from "./types";

export const evidenceRoleLabels: Record<Locale, Record<EvidenceRole, string>> = {
  en: { ANCHOR: "Anchor", DIRECT_PRECEDENT: "Direct precedent", MECHANISM: "Mechanism", METHODS: "Methods", CONTRADICTORY: "Contradictory", NEGATIVE: "Negative", SAFETY: "Safety", CONTEXT: "Context", REVIEW: "Review" },
  ko: { ANCHOR: "핵심 논문", DIRECT_PRECEDENT: "직접 선행 근거", MECHANISM: "기전", METHODS: "방법", CONTRADICTORY: "상충 근거", NEGATIVE: "부정 결과", SAFETY: "안전성", CONTEXT: "배경", REVIEW: "리뷰" },
};

const analyzedStages = new Set([
  "SOURCE_ATLAS_CURATED",
  "BIBLIOGRAPHY_SOURCE_VERIFIED",
  "TITLE_ABSTRACT_SCREENED",
  "FULL_TEXT_TRIAGED",
  "FULL_TEXT_REVIEWED",
  "DEEPLY_READ",
  "LOAD_BEARING",
  "CITED",
]);

export function isAnalyzedSource(source: ResearchSourceManifestV1) {
  return source.analysis_stage ? analyzedStages.has(source.analysis_stage) : false;
}

export function analyzedLiteratureCount(stats: LiteratureStats): number | null {
  return Number.isInteger(stats.analyzed_unique_total) && stats.analyzed_unique_total! >= 0
    ? stats.analyzed_unique_total
    : null;
}

export function sourceCitation(source: ResearchSourceManifestV1) {
  const authors = source.authors.join(", ");
  const venue = [source.journal, source.year, source.volume, source.pages_or_article_number].filter(Boolean).join("; ");
  return `${authors}. ${venue}.`;
}

export function orderedSources(sources: ResearchSourceManifestV1[]) {
  return [...sources].sort(
    (a, b) => (a.display_order ?? Number.MAX_SAFE_INTEGER) - (b.display_order ?? Number.MAX_SAFE_INTEGER) || b.year - a.year,
  );
}

export function keySources(sources: ResearchSourceManifestV1[], limit = 5) {
  return orderedSources(sources.filter((source) => source.load_bearing)).slice(0, limit);
}
