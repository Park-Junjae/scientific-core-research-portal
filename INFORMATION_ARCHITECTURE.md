# Information Architecture

## Global shell

Persistent sidebar: Scientific Core, New Run, Runs, Recent Runs, About, Settings. Mobile uses a modal navigation drawer.

## Route map

| Route | Purpose |
|---|---|
| `/` and `/runs/` | Search, filter, sort, list/grid research runs |
| `/runs/<slug>/` | Goal, decision, reviewed ideas, timeline, reading order |
| `/runs/<slug>/ideas/` | Scannable idea summaries |
| `/runs/<slug>/ideas/<idea>/` | Read/PDF/references/files |
| `/runs/<slug>/knowledge/` | Background reader, outline, in-report search |
| `/runs/<slug>/reports/` | Canonical report variants |
| `/runs/<slug>/files/` | Approved artifact inventory |
| `/new-run/` | Static run-request builder |
| `/settings/` | Browser-only preferences |
| `/about/` | Product and publication boundary |

## Reader hierarchy

Question and decision precede technical state. Idea summaries precede details. Read mode precedes PDF controls. Evidence atlases and machine metadata remain secondary. One-click PDF access is available from the run header and idea header.
