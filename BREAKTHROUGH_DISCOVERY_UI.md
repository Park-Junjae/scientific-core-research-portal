# Breakthrough Discovery UI extension

This branch is additive to AI Cho-Scientist UI v4.

- New Research includes an optional creativity selector.
- Standard selection does not add a creativity field to the exported request.
- Breakthrough selection adds an explicit reviewed `BREAKTHROUGH_DISCOVERY` field.
- Published runs may expose pre-search ideas, mechanism families, novelty audit,
  developed proposals, a high-risk lane, and a dual-axis portfolio.
- The UI does not expose prompts, provider metadata, credentials, internal paths, or
  non-public runtime records.
- Novelty and breakthrough success are never guaranteed.

This branch depends on the unmerged UI v4 branch and must not be merged ahead of it.
