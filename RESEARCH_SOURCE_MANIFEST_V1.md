# ResearchSourceManifestV1

Each run may publish `literature/index.json` with one deduplicated record per source.

Required groups:

- Identity: `source_id`, localized title, authors, journal, year, volume, pages, DOI, PMID, URL.
- Evidence boundary: source type, evidence role, access level, review-state fields, load-bearing flag.
- Interpretation: localized relevance, what the source shows, and what it does not show.
- Relationships: run, idea, report, report section, and citation-number mappings.
- Publication: status and optional display order.

Evidence roles are Anchor, Direct precedent, Mechanism, Methods, Contradictory, Negative, Safety, Context, and Review. Access ranges from citation-only to source data.

Analysis stages distinguish discovered-only records from substantive title/abstract screening, full-text triage, full-text review, deep reading, load-bearing use, and citation. A source omitted from the final report remains in the complete source ledger when it received substantive analysis.

Validation rejects duplicate source IDs, duplicate normalized DOIs, unknown related objects, schema violations, unresolved numbered report citations, and a declared analyzed total that cannot be reproduced from the complete staged ledger.
