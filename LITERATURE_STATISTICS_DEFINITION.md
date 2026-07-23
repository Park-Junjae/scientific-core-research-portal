# Literature Statistics Definition

These fields are independent and must not be inferred from one another:

| Field | Meaning |
|---|---|
| `analyzed_unique_total` | DOI/PMID/title-year-deduplicated sources with a substantive analysis event; integer or `null` |
| `discovered` | records retrieved before screening |
| `title_abstract_screened` | records screened at title/abstract level |
| `full_text_reviewed` | full texts reviewed |
| `deeply_read` | papers read at the run's deep-reading standard |
| `load_bearing_sources` | sources central to current reasoning |
| `unique_cited_sources` | unique sources cited by reports |
| `report_reference_count` | summed citation-number entries across reports, not deduplicated |

The Runs list uses only `analyzed_unique_total`. A missing value is shown as an em dash. Citation count, load-bearing count, report-reference count, discovered count, and PDF count are never fallback values.

## Substantive analysis

Included stages:

- `TITLE_ABSTRACT_SCREENED`
- `FULL_TEXT_TRIAGED`
- `FULL_TEXT_REVIEWED`
- `DEEPLY_READ`
- `LOAD_BEARING`
- `CITED`

Excluded stages:

- `DISCOVERED_ONLY`
- `SEARCH_RESULT_ONLY`
- `DUPLICATE`
- `UNSCREENED`

Deduplication uses DOI first, PMID second, and normalized title plus publication year last. A source cited in multiple reports or advanced through multiple stages counts once.

## Publication invariant

When `analyzed_unique_total` is an integer, publication validation requires a complete staged source ledger and equality with the derived unique count. Load-bearing and report-reference declarations must also reconcile with source records. When the complete ledger is not verifiable, `analyzed_unique_total` remains `null`; the publisher must not infer it from a partial bibliography.

## Synthetic cardinality fixture

The publication-boundary regression fixture contains 25 Atlas-only records, 12 records shared by the Atlas and final bibliography, and one final-bibliography-only record. Its union is 38, with 13 final-cited records, six load-bearing records, and 22 report-reference entries. These values test independent-count and deduplication behavior only; the fixture contains no real Run source records or source-to-report relationships.
