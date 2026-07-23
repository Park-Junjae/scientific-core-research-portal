# Test Report

Date: 2026-07-23

## Repository boundary correction

The public repository now contains generic source-ledger implementation, schemas, synthetic cardinality tests, and public-sanitized demo content only. Lab-internal ledgers, source relationships, screenshots, review receipts, and acceptance tests are retained locally under explicit ignore rules.

| Check | Result |
|---|---|
| ESLint | PASS |
| TypeScript | PASS |
| Vitest | 31/31 PASS |
| Tracked Python suite | 25 PASS, 1 Windows symlink privilege skip (26 total) |
| Public content validation | PASS, 3 runs, zero findings |
| Public static build | PASS, 56 pages |
| Static links | PASS, 56 pages |
| Asset budget | PASS, 14.07 MB |
| Public/private build boundary | PASS |
| Tracked-tree publication boundary | PASS |
| Public Playwright | 18/18 PASS |
| Local internal acceptance Playwright | 30/30 PASS |
| Serious or critical accessibility findings | 0 |
| Mobile horizontal overflow findings | 0 |

## Synthetic accounting contract

The tracked regression fixture preserves the independent accounting behavior for 38 analyzed records, 13 cited records, six load-bearing records, 25 analyzed-but-uncited records, and 22 report-reference entries. It contains synthetic identities only and reproduces no lab-internal source record or source-to-report relationship.

## UI boundary

The simplified New Run experience is unchanged. The only responsive correction makes an existing portfolio table own its horizontal scrolling on narrow screens so the page itself does not overflow.
