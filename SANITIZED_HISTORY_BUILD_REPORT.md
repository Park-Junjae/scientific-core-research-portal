# Sanitized History Build Report

The Portal v3 release is reconstructed in a fresh clone from public base `528d5faabde64270463540fed570f3980bab30f1`. The approved product endpoint is transferred as a binary-safe net tree without merging, rebasing, or cherry-picking private development commits.

The resulting branch contains one release commit. Product paths are checked against a private path-and-content manifest. Additional release-security files are checked against an exact allowlist and scanned for private markers, local paths, and scientific-record content.

Validation requires:

- safe-product path, mode, and content equivalence;
- zero unallowlisted release paths;
- zero private records in newly reachable objects;
- deterministic Python dependency preflight before tests;
- public build, static-link, accessibility, overflow, and privacy checks;
- compatibility verification using an externally attached ignored fixture.

The release process does not include merge or deployment.
