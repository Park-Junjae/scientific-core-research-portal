# Multi-Idea Portfolio Contract

## Core identity

An idea is a research object, not a PDF. Every generated or reviewed object receives one `ResearchIdeaManifestV1`. PDF and Markdown fields are optional, while the structured scientific summary remains required.

## Run modes

- `DISCOVERY_PORTFOLIO_RUN`: breadth-first generation, family deduplication, multi-axis development, and pairwise comparison when at least six eligible ideas exist.
- `FOCUSED_DECISION_RUN`: a bounded blocked decision with no artificial 12-idea requirement.
- `VERIFICATION_RUN`: evaluation of a frozen claim, edge, assay, or causal chain.
- `MEASUREMENT_DISCOVERY_RUN`: measurement architectures kept separate from biological hypotheses.

## Funnel reconciliation

The publisher recalculates raw records, independent attempts, unique families, developed and reviewed objects, Arena entrants, finalists, parked objects, and dropped/rejected objects from idea manifests. A mismatch fails publication.

Merged records remain in raw provenance, are excluded from independent attempts, and share an existing family. A low-breadth discovery run may stop with `INSUFFICIENT_PORTFOLIO_BREADTH`; it must not invent filler or finalists.

## Scientific decision boundary

Developed ideas carry all eight score axes from 1 to 5. The vector is advisory. A fatal physical contradiction, direct duplication, missing actuator, or non-discriminating test blocks featured/finalist status regardless of scores. `FINALIST` never means experimentally validated.

Pairwise records preserve perspective, winner or tie, rationale, fatal objection, confidence, disagreement, and coverage. Arena standing remains advisory and the run states whether comparison changed selection.
