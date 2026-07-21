# Site Test Report

## Release gate result

| Check | Result |
|---|---|
| ESLint | PASS |
| TypeScript | PASS |
| Vitest | PASS: 5 tests in 3 files |
| Publication CLI integration | PASS: 4 tests |
| Content and schema validation | PASS: 3 synthetic runs, 0 errors, 0 warnings |
| Root static export | PASS: 29 HTML pages |
| Project-site `basePath` export | PASS: routes, Next assets, PDF worker, and PDF artifact |
| Static route and local-path scan | PASS: 29 HTML pages |
| Asset budget | PASS: 4,724,875 bytes (4.51 MB) |
| Playwright | PASS: 6 end-to-end tests |
| axe | PASS: 0 critical violations on primary pages |

## Performance

Lighthouse 13.4.0 mobile simulation on `/runs/` after the initial-client-boundary optimization:

| Metric | Result | Gate |
|---|---:|---:|
| Performance | 100 | >= 90 |
| Accessibility | 100 | >= 95 |
| Best Practices | 96 | >= 90 |
| First Contentful Paint | 1.0 s | Informational |
| Largest Contentful Paint | 1.4 s | Informational |
| Total Blocking Time | 0 ms | Informational |
| Cumulative Layout Shift | 0 | No unexpected shift |

The Windows Lighthouse launcher reported an `EPERM` error while deleting its temporary profile after writing the complete JSON result. The result file was parsed successfully and contained all categories and audits; the browser run itself completed.

No provider or scientific call was made. Direct scientific provider calls: **0**.
