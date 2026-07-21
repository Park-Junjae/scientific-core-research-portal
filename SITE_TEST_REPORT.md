# Site Test Report

## Release gate result

| Check | Result |
|---|---|
| ESLint | PASS |
| TypeScript | PASS |
| Vitest | PASS: 10 tests in 5 files |
| Publication CLI integration | PASS: 14 tests |
| Content and schema validation | PASS: 3 synthetic runs, 0 errors, 0 warnings |
| Root static export | PASS: 31 HTML pages |
| Project-site `basePath` export | PASS: routes, Next assets, PDF worker, and PDF artifact |
| Static route and local-path scan | PASS: 31 HTML pages |
| Asset budget | PASS: 5,926,946 bytes (5.65 MiB) |
| Playwright | PASS: 7 end-to-end tests |
| axe | PASS: 0 critical violations on primary pages |

## Performance

Lighthouse 13.4.0 mobile simulation on `/runs/` after the initial-client-boundary optimization:

| Metric | Result | Gate |
|---|---:|---:|
| Performance | 92 (two consecutive runs) | >= 90 |
| Accessibility | 96 | >= 95 |
| Best Practices | 96 | >= 90 |
| First Contentful Paint | 1.2 s | Informational |
| Largest Contentful Paint | 3.1 s | Informational |
| Total Blocking Time | 150-160 ms | Informational |
| Cumulative Layout Shift | 0 | No unexpected shift |

The acceptance pass also covered stored preference application, grouped static search, overflow-menu navigation, language-aware report routing, Technical Details deep linking, nonblank PDF pixels, deterministic republishing, stale-output removal, orphan detection, run-ID consistency, traversal rejection, and symlink rejection. Portfolio-specific tests cover lifecycle filters, summary-only ideas, separate idea/report counts, merged provenance versus independent attempts, discovery breadth stops, fatal-flaw finalist rejection, pairwise/funnel reconciliation, and focused-run claim boundaries.

No provider or scientific call was made. Direct scientific provider calls: **0**.
