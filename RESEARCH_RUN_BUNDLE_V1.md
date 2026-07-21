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

## Boundaries

- `visibility` controls publication eligibility; it does not express scientific confidence.
- `publication_status` controls editorial readiness.
- `status` is rendered as natural reader language.
- Terminal state, source commit, and bundle hash appear only under Technical Details.
- Report and idea labels must not imply experimental verification unless such validation exists.
- Public JSON may not contain absolute local paths or internal registry IDs.

## Static artifact mapping

Canonical PDFs live in each run bundle. Approved PDFs are copied to `public/artifacts/<run_slug>/` for static hosting. Manifest URLs use `/artifacts/...` and the UI applies the configured project-site base path.
