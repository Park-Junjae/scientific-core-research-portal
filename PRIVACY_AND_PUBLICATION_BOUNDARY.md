# Privacy and Publication Boundary

## Allowed in this repository

Frontend source, public or explicitly approved sanitized manifests, approved Markdown/PDF, small thumbnails, deployment metadata, schemas, and tests that contain no secret-like fixtures.

## Never publish by default

Provider outputs, private prompts, raw receipts, laboratory data, candidate/evidence registries, user evaluations, API keys, environment files, scientific databases, PDF QA page renders, contact sheets, temporary worktrees, or absolute machine paths.

## Current decision

`deploy/site_visibility.json` is `PUBLIC_SANITIZED` following explicit user approval. The allowlist contains only `demo_xrrna_prime_assembly_001`, `demo_prame_logic_first_001`, and `demo_taled_historical_001`. These are synthetic demonstration bundles. Actual xrRNA/Prime Assembly, PRAME, and TALED run assets remain outside this repository and are not authorized by this approval.

## Enforcement

The publication CLI requires a valid allowlist, rejects path traversal, scans textual output for secrets/local paths/private artifact signatures, preserves source hashes, and emits an audit. The Pages workflow has an independent visibility gate and skips deployment unless approval is valid.
