# Homepage-first product review

Status: implementation complete on draft PR #15; visual owner approval is still required before review readiness, merge, or deployment.

All screenshots below were generated with explicit Playwright fixtures. No provider-backed research was started.

## Product requirement matrix

| Requirement | Status | Visible or automated evidence |
| --- | --- | --- |
| Homepage is the operational research workspace | PASS | Product header, real composer, connected state, My Research, and product principles render in that order on `/`. |
| Direct research question and optional scope | PASS | Large question field plus objectives, experimental constraints, literature/source-ledger toggle, report language, and advanced settings are on the homepage. |
| Standard and Breakthrough are first-class | PASS | Both options are visible without expanding advanced settings; the selected-state summary shows mode, budget profile, and runtime binding. |
| Standard production payload | PASS | Browser contract test proves `AUTO` + `standard` and omission of all Breakthrough creativity fields. |
| Breakthrough production payload | PASS | Browser contract test proves discovery portfolio mode, reviewed `BREAKTHROUGH_DISCOVERY`, raw spark target 60, and approved budget profile. The immutable runtime is displayed before submission and is server-bound in the compiled contract rather than accepted from client input. |
| Real Access connection states | PASS | Connect and Check actions plus distinct Access challenge, network/CORS, Backend identity, allowlist, unavailable, and invalid-response handling. |
| Zero-provider preflight | PASS | In-progress state shows `0 calls · 0 tokens · USD 0`; completed state shows the compiled contract before approval. |
| Complete plan inspection | PASS | Submitted question, objectives, constraints, selected mode/profile, literature scope, language, runtime, generation targets, stage order, material inferences, and expected/hard-cap calls, tokens, cost, and time are visible. |
| Creator self-approval | PASS | Explicit confirmation checkbox gates “Approve my execution”; no owner/admin role exists. |
| Execution tracking and cancellation | PASS | Current stage, progress, idea/family/proposal counts, literature, cost, elapsed time, refresh, re-entry, and cancellation are covered by fixture-only browser tests. |
| Artifact-first private results | PASS | Canonical PDF inline open plus PDF, Markdown, ZIP, source-ledger, and artifact-manifest downloads are creator-private. |
| Creator-scoped My Research | PASS | Disconnected, empty, active, completed, failed, cancelled, and queue-expired labels are implemented; list test renders only the authenticated creator projection. |
| Historical demos absent from production | PASS | Production audit reports 0 runs, 0 search records, 0 artifacts, and 0 historical routes. Historical records and tools remain only under explicit test fixtures. |
| Current visual system preserved | PASS | Existing branding, blue palette, workspace navigation, Pretendard typography, responsive layout, and accessibility contracts remain in place. |
| Desktop and mobile quality | PASS | 1440×900 and 390×844 captures completed; 390 px overflow and accessibility checks pass. |

## Required screenshot inventory

Desktop 1440×900:

1. [Disconnected homepage](UPDATED_SCREENSHOTS/homepage-first/desktop-01-disconnected-homepage.png)
2. [Connected empty homepage](UPDATED_SCREENSHOTS/homepage-first/desktop-02-connected-empty.png)
3. [Standard request filled](UPDATED_SCREENSHOTS/homepage-first/desktop-03-standard-filled.png)
4. [Breakthrough request filled](UPDATED_SCREENSHOTS/homepage-first/desktop-04-breakthrough-filled.png)
5. [Preflight result](UPDATED_SCREENSHOTS/homepage-first/desktop-05-preflight-result.png)
6. [Awaiting approval](UPDATED_SCREENSHOTS/homepage-first/desktop-06-awaiting-approval.png)
7. [Running](UPDATED_SCREENSHOTS/homepage-first/desktop-07-running.png)
8. [Completed result](UPDATED_SCREENSHOTS/homepage-first/desktop-08-completed.png)

Mobile 390×844:

1. [Disconnected homepage](UPDATED_SCREENSHOTS/homepage-first/mobile-01-disconnected-homepage.png)
2. [Breakthrough selector](UPDATED_SCREENSHOTS/homepage-first/mobile-02-breakthrough-selector.png)
3. [Approval state](UPDATED_SCREENSHOTS/homepage-first/mobile-03-approval.png)
4. [My Research list](UPDATED_SCREENSHOTS/homepage-first/mobile-04-my-research.png)
5. [Completed result](UPDATED_SCREENSHOTS/homepage-first/mobile-05-completed.png)

## Validation snapshot

- Vitest: 50 passed.
- Python publisher/content tests: 29 passed.
- Playwright: 50 passed.
- Production content validation: 0 runs.
- Production search index: 0 records.
- Production demo audit: 0 runs / 0 search records / 0 artifacts / 0 historical routes.
- Root custom-domain export: PASS.
- Project-site base-path export: PASS.
- Privacy audit: PASS.
- Tracked-boundary audit: PASS.
- Provider usage: 0 calls / 0 tokens / USD 0.

## Approval boundary

Do not mark PR #15 ready, merge, or deploy until the owner approves the homepage screenshots.
