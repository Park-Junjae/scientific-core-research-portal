# Handoff to Scientific Architect

## 1. Mission Navigation

The static Scientific Core Research Portal is complete for deployment review. It productizes approved `ResearchRunBundleV1` packages as a persistent reader workspace and needs no Node.js server after export.

Terminal state: `SCIENTIFIC_CORE_STATIC_RESEARCH_PORTAL_READY_FOR_DEPLOYMENT_REVIEW`.

## 2. Architecture Decision

Phase 1 is a completely static, read-only Next.js App Router application using TypeScript, Tailwind CSS, Lucide icons, PDF.js, static JSON search, and `output: "export"`. It has no API routes, server actions, database, browser credential, provider call, or false run-execution control. A deterministic Python CLI performs publication and sanitization before build.

## 3. Repository and Deployment Mode

The portal is a standalone repository, separate from the scientific runtime. Current visibility is `LOCAL_ONLY`. The GitHub CLI is authenticated, but remote repository creation and Pages publication were intentionally not performed because no artifact-level public approval exists.

## 4. Implemented Routes

`/`, `/runs/`, `/runs/<run>/`, `/runs/<run>/ideas/`, `/runs/<run>/ideas/<idea>/`, `/runs/<run>/knowledge/`, `/runs/<run>/reports/`, `/runs/<run>/files/`, `/new-run/`, `/settings/`, `/about/`, and a static custom 404 are generated. Root and project-site `basePath` builds both pass.

## 5. ResearchRunBundle Contract

Strict JSON Schemas cover run, idea, artifact, and publication-allowlist manifests with `additionalProperties: false`, controlled enums, date/path formats, and public visibility rules. Each run contains independent ideas, reports, knowledge, artifacts, and optional thumbnails. The global index is deterministic.

The publisher validates an allowlist, normalizes and contains paths, rejects traversal, symlinks, run-ID mismatch, orphaned files, and private-to-public promotion, scans text and PDFs, verifies manifest membership and Markdown/PDF presence, creates PDF thumbnails when requested, replaces output transactionally, removes stale public files, rebuilds the index, records hashes/receipt/diff/audit, and proves the source tree did not change.

## 6. Imported Run Inventory

No actual scientific file was copied. Three synthetic fixtures demonstrate the target states:

| Demo | Reader status | Source migration class |
|---|---|---|
| xrRNA / Prime Assembly | Done | Actual package: `REQUIRES_REDACTION` |
| PRAME Logic-First | Review required | Actual package: `REQUIRES_REDACTION` |
| TALED historical case | Archived | Actual package: `HISTORICAL_ONLY` |

The TALED demo is explicitly historical and not an active recommendation. Benchmark, canary, provider, registry, raw-output, and audit packages default to `DO_NOT_PUBLISH`.

## 7. Publication and Privacy Decisions

Only `PUBLIC_SANITIZED` bundles may enter a public build, and Pages deployment additionally requires `deploy/site_visibility.json` to contain explicit approval plus exact approved run IDs. Current synthetic content passes sanitization, but the deployment workflow skips while mode is `LOCAL_ONLY`. No private laboratory data, private evaluation, provider trace, prompt, registry, or absolute path is emitted.

## 8. Visual Comparison Result

PASS. The product matches the reference interaction density and spacing while using an original Scientific Core identity. Runs are scannable in list/grid views with grouped static search and a functional overflow menu. Language, theme, density, PDF behavior, and recent-run preferences are applied in the browser. Run, idea, knowledge, report, and PDF pages use continuous readable layouts. Nine reviewed screenshots cover desktop, reference, and mobile viewports.

## 9. Accessibility and Test Results

Lint, TypeScript, 6 Vitest tests, 9 publisher integration tests, schema/content validation, 29-page export, route scan, project-site export, asset budget, and 7 Playwright tests pass. axe found 0 critical violations. Lighthouse: Performance 90, Accessibility 96, Best Practices 96, FCP 1.2 s, LCP 3.6 s, TBT 80 ms, CLS 0.

## 10. Static-Site Size

The final local export is 5,137,806 bytes (4.90 MiB), well below the 750 MB warning and 900 MB block thresholds. No PDF exceeds 25 MB.

## 11. GitHub Actions Status

Prepared workflows cover CI, content validation, and Pages deployment. CI tests the root export with Playwright, then separately rebuilds and validates the project-site `basePath`. Deployment is visibility-gated and uses GitHub Pages artifacts with no frontend secrets. Workflows are prepared locally and have not run on GitHub because no remote was authorized.

## 12. Exact Remaining Deployment Step

The PI must select and sanitize exact artifacts, review their publication receipts, and approve `deploy/site_visibility.json` with `mode: PUBLIC_SANITIZED`, approver, timestamp, exact run IDs, and `public_release_approved: true`. Only then create the `scientific-core-research-portal` remote, push the feature branch, review/merge to `main`, enable Pages via GitHub Actions, and record `DEPLOYMENT_RECEIPT.json`.

## 13. Screenshots

The reviewed PNG files are in `test-results/screenshots/`: Runs list at three desktop sizes, Runs grid, Run Overview, Idea Report, PDF View, New Run, and Mobile Runs.

## 14. Generated-File Index

- Product/docs: `README.md`, requirements, information architecture, design system, bundle contract, privacy/publication guides, deployment guides, migration report, test/accessibility/visual/hygiene reports.
- Frontend: `src/app/`, `src/components/`, `src/lib/`, `public/`.
- Content: `content/runs/` with three synthetic bilingual demonstrations.
- Contracts: `schemas/` and `PUBLICATION_ALLOWLIST_SCHEMA.json`.
- Publisher: `coscientist/site/` and `scripts/`.
- Verification: `tests/`, Playwright config, Vitest config, and screenshot evidence.
- Automation: `.github/workflows/ci.yml`, `content-validation.yml`, and `deploy-pages.yml`.

## 15. State Integrity and Limits

The scientific runtime remains at `de4d15ea3eac9547839a214cb6eadd0cbf10b312`; its pre-existing untracked `runs/` entry was not touched. Provider/scientific calls: 0. Candidate/evidence registries: unchanged. No scientific run, candidate generation, promotion, Stage 9, Arena, Elo, backend, or live-run execution was started.

This handoff authorizes review of a local deployment candidate only. It does not itself approve public release.
