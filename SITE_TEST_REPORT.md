# Site Test Report

## Release gate result

| Check | Result |
|---|---|
| ESLint | PASS |
| TypeScript | PASS |
| Vitest | PASS: 6 tests in 3 files |
| Publication CLI integration | PASS: 9 tests |
| Content and schema validation | PASS: 3 synthetic runs, 0 errors, 0 warnings |
| Root static export | PASS: 29 HTML pages |
| Project-site `basePath` export | PASS: routes, Next assets, PDF worker, and PDF artifact |
| Static route and local-path scan | PASS: 29 HTML pages |
| Asset budget | PASS: 5,137,806 bytes (4.90 MiB) |
| Playwright | PASS: 7 end-to-end tests |
| axe | PASS: 0 critical violations on primary pages |

## Performance

Lighthouse 13.4.0 mobile simulation on `/runs/` after the initial-client-boundary optimization:

| Metric | Result | Gate |
|---|---:|---:|
| Performance | 90 | >= 90 |
| Accessibility | 96 | >= 95 |
| Best Practices | 96 | >= 90 |
| First Contentful Paint | 1.2 s | Informational |
| Largest Contentful Paint | 3.6 s | Informational |
| Total Blocking Time | 80 ms | Informational |
| Cumulative Layout Shift | 0 | No unexpected shift |

The acceptance pass also covered stored preference application, grouped static search, overflow-menu navigation, language-aware report routing, Technical Details deep linking, nonblank PDF pixels, deterministic republishing, stale-output removal, orphan detection, missing idea-PDF rejection, run-ID consistency, traversal rejection, and symlink rejection.

No provider or scientific call was made. Direct scientific provider calls: **0**.
