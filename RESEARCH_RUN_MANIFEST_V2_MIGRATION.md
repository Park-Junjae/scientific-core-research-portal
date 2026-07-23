# Research Run Manifest V2 Migration

Public synthetic manifests were deterministically migrated with `scripts/migrate-content-v2.mjs`.

V2 adds localized scientific fields, `literature_stats`, `literature_index`, an embedded report registry, and explicit primary artifact IDs. Existing visibility, status, run mode, scientific decisions, idea lineage, allowlists, receipts, hashes, and historical fixture files are preserved.

Validation selects the V1 or V2 schema from `schema_version`. V2 rejects any primary ID that does not exist in `reports`.

`literature_stats.analyzed_unique_total` is required in V2 and accepts an integer greater than or equal to zero or `null`. It counts DOI/PMID/title-year-deduplicated records at `TITLE_ABSTRACT_SCREENED` or a later substantive analysis stage. A publication adapter may preserve an evidenced frozen run-level value or derive it from explicit source `analysis_stage` values. It must not infer the value from citations, report reference lists, load-bearing status, discovered records, Markdown links, or PDF counts. Historical runs without the required provenance migrate to `null`.

Rollback is the feature branch boundary: main and the deployed Pages site were not changed.
