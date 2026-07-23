# RunSourceLedgerV1 Contract
`RunSourceLedgerV1` is the append-only source-accounting record for one Scientific Core Run.

## Invariants

1. Every source has a stable Run-scoped identity, deduplicated in order by DOI, PMID, then normalized title plus year.
2. A source counts as analyzed only when at least one documented scientific curation event exists.
3. Child prompts and later stages append events; they do not replace the prior ledger.
4. A final report may mark a subset as cited, but that subset never replaces the complete analyzed corpus.
5. Bibliographic correction may append a previously absent source.
6. Access level and analysis event are independent. No full-text access is inferred from citation or bibliography presence.
7. `analyzed_unique_total` is derived from the entire Run ledger when the ledger is available.
8. Load-bearing, cited-source, and report-reference counts retain independent meanings.
9. Upstream source funnels remain lineage metadata unless individual memberships are explicitly transferred into a combined Run.

## Required Entry Fields

Each entry carries identity, membership, citation/load-bearing flags, first and last stages, event count and event list, related reports and ideas, and the recorded access level. The JSON contract is `schemas/run-source-ledger-v1.schema.json`.

## Publication Adapter

When `literature/run-source-ledger.json` exists, publication validation checks its schema, Run identity, declared count, event-qualified unique count, and exact source-ID agreement with `literature/index.json`. The adapter derives a missing analyzed count from this ledger before using the legacy per-source `analysis_stage` fallback.

## Future Runs

The accepted simple New Run intake remains unchanged. Its Director contract must initialize and retain a complete `RunSourceLedgerV1` throughout the Run lifecycle.
