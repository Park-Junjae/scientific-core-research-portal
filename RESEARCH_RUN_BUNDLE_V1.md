# ResearchRunBundleV1

Each run is independently publishable under `content/runs/<run_slug>/`.

```text
run.json
ideas/<idea_slug>.json
reports/report-manifest.json
reports/*.pdf
reports/*.md
knowledge/knowledge-manifest.json
knowledge/*.pdf|*.md
artifacts/artifact-manifest.json
thumbnails/*.webp
```

The global `content/runs/index.json` contains only published bundle slugs. JSON contracts are strict Draft 2020-12 schemas in `schemas/` with `additionalProperties: false`.

## Run and idea identity

- `run_mode` distinguishes discovery portfolio, focused decision, verification, and measurement-discovery workflows.
- Every generated or reviewed idea has one `ResearchIdeaManifestV1`, including merged, rejected, parked, and dropped provenance records.
- `report_pdf` and `report_markdown` are optional. Idea count is derived from idea manifests; report count is derived independently from PDF report references.
- `portfolio_funnel` is recalculated from lifecycle records during validation.
- A developed idea keeps the complete eight-axis score vector. No scalar total can override a fatal flaw.
- Pairwise comparison records remain advisory and state whether they changed selection.
- Run-specific `source_lineage` prevents historical child-run counts from being aggregated across lineages.

## Boundaries

- `visibility` controls publication eligibility; it does not express scientific confidence.
- `publication_status` controls editorial readiness.
- `status` is rendered as natural reader language.
- Terminal state, source commit, and bundle hash appear only under Technical Details.
- Report and idea labels must not imply experimental verification unless such validation exists.
- `FINALIST` is a workflow disposition, not experimental validation.
- Public JSON may not contain absolute local paths or internal registry IDs.

## Static artifact mapping

Canonical PDFs live in each run bundle. Approved PDFs are copied to `public/artifacts/<run_slug>/` for static hosting. Manifest URLs use `/artifacts/...` and the UI applies the configured project-site base path.
