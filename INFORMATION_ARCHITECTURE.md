# Information Architecture

## Global shell

Persistent sidebar: Scientific Core, New Run, Runs, Recent Runs, About, Settings. Mobile uses a modal navigation drawer.

## Route map

| Route | Purpose |
|---|---|
| `/` and `/runs/` | Search, filter, sort, list/grid research runs |
| `/runs/<slug>/` | Goal, decision, run mode, reconciled portfolio funnel, highlights, timeline |
| `/runs/<slug>/ideas/` | Full idea lifecycle with generated/developed/reviewed/Arena/finalist/conditional/measurement/parked/dropped filters |
| `/runs/<slug>/ideas/<idea>/` | Scientific summary, mechanism, evidence, prior art, scorecard, critiques, pairwise context, optional report files |
| `/runs/<slug>/knowledge/` | Background reader, outline, in-report search |
| `/runs/<slug>/reports/` | Canonical report variants |
| `/runs/<slug>/files/` | Approved artifact inventory |
| `/new-run/` | Static run-request builder |
| `/settings/` | Browser-only preferences |
| `/about/` | Product and publication boundary |

## Reader hierarchy

Question and decision precede technical state. Portfolio accounting precedes highlights. An idea summary remains readable when no PDF exists; report controls appear only when artifacts are available. Evidence atlases and machine metadata remain secondary.
