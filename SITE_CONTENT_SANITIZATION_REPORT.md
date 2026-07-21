# Site Content Sanitization Report

## Result

`PASS` for the current local build. Content validation found no absolute machine paths, API-key patterns, private artifact signatures, or non-public run manifests in the synthetic demo bundles.

## Included

- Three `SYNTHETIC_DEMO` run manifests.
- Six synthetic idea manifests and approved Markdown variants.
- Twelve small, generated demonstration PDFs.
- Schemas, publication code, test fixtures, and static site source.

## Excluded

The actual xrRNA/Prime Assembly, PRAME, and TALED files on the VM; provider traces; requests; raw outputs; scientific registries; user evaluations; audit contact sheets; source literature PDFs; environment files and credentials.

## Controls

Strict JSON Schema, relative-path normalization, traversal rejection, allowlist-only copy, text scanning, public visibility validation, source tree hashing, artifact existence checks, and independent Pages visibility gating.

## Residual review

Synthetic labels and disclosures must remain until a PI approves artifact-level public release. A future approved migration requires a new sanitization receipt; this report does not authorize it.
