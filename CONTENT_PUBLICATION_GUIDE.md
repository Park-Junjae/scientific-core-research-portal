# Content Publication Guide

## Prerequisites

1. Freeze the source run and prepare `run.json`, one manifest per generated/reviewed idea, optional reports, and knowledge files.
2. Publish the complete literature accounting set: `complete_source_ledger`, `literature_funnel`, `report_citation_map`, and `load_bearing_source_set`. The source ledger must include substantively analyzed sources omitted from the final bibliography.
3. Create `publication-allowlist.json` conforming to `PublicationAllowlistV1`.
4. Obtain explicit visibility approval. A PDF's existence is not approval.

## Publish

```bash
python -m coscientist.site publish-run \
  --run-root <frozen-sanitized-source> \
  --portal-root <portal-repository> \
  --visibility PUBLIC_SANITIZED
```

The publisher validates paths, copies only allowlisted files through a staging directory, scans text and PDFs, mirrors approved PDFs to static assets, rebuilds the run index, and checks the source tree hash before and after. It independently reconciles idea, report, lifecycle, family, funnel, pairwise, lineage, analyzed-source, load-bearing-source, and report-citation counts.

The importer copies the complete source ledger, not only the final bibliography. If the staged source ledger is partial or identity reconciliation fails, keep `analyzed_unique_total` null rather than substituting a citation or load-bearing count.

An idea needs neither `report_pdf` nor `report_markdown` to publish. Its structured scientific summary remains the canonical reader page until an approved report exists.

## Generated audit artifacts

- `PUBLICATION_RECEIPT.json`
- `PUBLICATION_DIFF.md`
- `PUBLICATION_CONTENT_HASHES.json`
- `SANITIZATION_AUDIT.json`

## Validate and preview

```bash
python -m coscientist.site validate-content --portal-root .
python -m coscientist.site rebuild-index --portal-root .
pnpm build
python -m coscientist.site preview-site --portal-root .
```

For a public build, use `--public-build`; every run must be `PUBLIC_SANITIZED` and explicitly listed in the visibility approval.
