# Repository Publication Boundary

The Git repository contains implementation code, generic schemas and contracts, synthetic tests, and explicitly sanitized demonstration content. Actual lab-internal source ledgers, source-to-report relationships, review builds, screenshots, receipts, and acceptance tests remain local and ignored.

`scripts/build-private-boundary-markers.mjs` derives private identifiers from an ignored local preview. `scripts/audit-tracked-publication-boundary.mjs` then checks the tracked tree and public build without embedding those identifiers in source control.

The cardinality regression is synthetic. It preserves the independent accounting behavior for 38 analyzed records, 13 cited records, six load-bearing records, 25 uncited records, and 22 report-reference entries without reproducing any real source identity or relationship.

Local scientific material must not be re-added with a forced Git add. Publication requires both the existing public-build boundary check and the tracked-tree boundary audit to pass.
