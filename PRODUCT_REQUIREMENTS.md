# Product Requirements

## Product decision

Scientific Core outputs need a persistent reading surface, not another runtime console. The portal is a static research product: it helps wet-lab scientists find runs, understand the question and decision, inspect reviewed ideas, read background and canonical PDFs, and prepare a new run request.

## Primary users

- PI or external reviewer scanning the scientific decision and evidence boundary.
- Wet-lab scientist comparing ideas before opening a full report.
- Scientific Core operator publishing a sanitized frozen bundle.

## Phase 1 requirements

1. Runs are searchable and filterable without a server.
2. Every run has overview, ideas, knowledge, reports, files, and optional technical details.
3. Every generated or reviewed idea has a manifest and readable scientific summary. Markdown and PDF are optional publication artifacts, not idea identity.
4. New Run produces local request files only and never claims to execute work.
5. Publication is deterministic, allowlist-only, source-preserving, and visibility-gated.
6. Project-site base paths and direct trailing-slash links survive static hosting.
7. Run mode, portfolio funnel, lifecycle, score vectors, pairwise coverage, and report availability remain explicit and reconcilable.

## Non-goals

No backend, login, browser API key, provider call, scientific execution, candidate promotion, database, private-data publication, or live run status polling.

## Acceptance metrics

Static export, content validation, sanitizer, user-flow tests, axe critical count zero, all required deep links, PDF access, bilingual switch, asset size below 900 MB, and source/runtime immutability.
