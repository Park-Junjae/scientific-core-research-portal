# Single Analyzed-Literature Count Change

## Scope

The Runs list now presents one canonical literature statistic: `literature_stats.analyzed_unique_total`. Desktop shows an integer-only cell under `분석 문헌` or `Literature analyzed`. Mobile combines status, idea count, and analyzed literature into one readable metadata line.

## Contract

- Count unique records substantively analyzed at `TITLE_ABSTRACT_SCREENED` or beyond.
- Deduplicate by DOI, then PMID, then normalized title and publication year.
- Display `—` when the value lacks preserved evidence.
- Never substitute unique cited sources, report references, load-bearing sources, discovered records, Markdown links, or PDF counts.
- Keep all existing funnel statistics on the detailed Literature page.

## Implementation

- `ResearchRunManifestV2` requires `analyzed_unique_total` as integer >= 0 or null.
- `ResearchSourceManifestV1` may record an explicit `analysis_stage`.
- The publication adapter derives a missing run value only when stage-qualified source records exist.
- Runs sorting supports high-to-low and low-to-high analyzed counts, always placing null after known values and using title as the stable tie-break.
- Numeric counts are not added to full-text search content.

No scientific report text, candidate, detailed literature funnel, publication boundary, merge state, or deployment state changed.
