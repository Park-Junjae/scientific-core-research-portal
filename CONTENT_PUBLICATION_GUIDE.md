# Content Publication Guide

## Prerequisites

1. Freeze the source run and prepare `run.json`, idea manifests, reports, and knowledge files.
2. Create `publication-allowlist.json` conforming to `PublicationAllowlistV1`.
3. Obtain explicit visibility approval. A PDF's existence is not approval.

## Publish

```bash
python -m coscientist.site publish-run \
  --run-root <frozen-sanitized-source> \
  --portal-root <portal-repository> \
  --visibility PUBLIC_SANITIZED
```

The publisher validates paths, copies only allowlisted files through a staging directory, scans text artifacts, mirrors PDFs to static assets, rebuilds the run index, and checks the source tree hash before and after.

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
