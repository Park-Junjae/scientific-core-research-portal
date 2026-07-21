# Privacy and Publication Boundary

## Allowed in this repository

Frontend source, public or explicitly approved sanitized manifests, approved Markdown/PDF, small thumbnails, deployment metadata, schemas, and tests that contain no secret-like fixtures.

## Never publish by default

Provider outputs, private prompts, raw receipts, laboratory data, candidate/evidence registries, user evaluations, API keys, environment files, scientific databases, PDF QA page renders, contact sheets, temporary worktrees, or absolute machine paths.

## Current decision

`deploy/site_visibility.json` is `LOCAL_ONLY`, with no approved run IDs and `public_release_approved: false`. Therefore the build contains synthetic demonstration content only. The actual xrRNA/Prime Assembly, PRAME, and TALED run assets remain outside this repository pending explicit artifact-level visibility review.

## Enforcement

The publication CLI requires a valid allowlist, rejects path traversal, scans textual output for secrets/local paths/private artifact signatures, preserves source hashes, and emits an audit. The Pages workflow has an independent visibility gate and skips deployment unless approval is valid.
