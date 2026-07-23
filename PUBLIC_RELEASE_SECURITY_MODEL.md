# Public Release Security Model

Portal releases are constructed from a public base and a reviewed publication-safe product tree. Private scientific fixtures, review evidence, local screenshots, receipts, and source-to-report relationships remain outside the public Git object graph.

## Release boundary

- A release branch starts from the current public `main` in a fresh clone.
- Product files are copied as endpoint content; private development commits are never merged or cherry-picked.
- Release-only changes are constrained by an exact path allowlist.
- Every newly reachable path and text blob is scanned using an externally supplied private-marker inventory.
- Generic visibility enums and boundary logic are allowed. Actual internal research records are not.
- Public build output is scanned independently from the tracked tree and Git history.

## Operational rule

Local fixtures may be attached for compatibility testing, but they must remain ignored and must never become reachable Git objects. A passing current checkout is insufficient unless the complete new object graph also passes.
