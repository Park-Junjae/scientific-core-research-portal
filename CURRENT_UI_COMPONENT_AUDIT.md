# Current UI Component Audit

Audit baseline: `528d5faabde64270463540fed570f3980bab30f1`

| Component | Current behavior | Reader impact | Required correction |
| --- | --- | --- | --- |
| `run-header.tsx` | Finds the first PDF for the locally selected language and exposes Open/Download | File order silently defines importance | Remove report actions; use global locale and explicit primary IDs |
| `run-metric-strip.tsx` | Shows idea, retained, and PDF counts in a bordered strip | File production looks like scientific progress | Remove PDF metric; use declared literature statistics as plain text |
| `status-badge.tsx` | Filled rounded badge | Operational state dominates headings | Render a 6px status dot and localized plain text |
| `run-tabs.tsx` | Overview, Ideas, Knowledge, Reports, Files, Technical Details | Technical and file views compete with science | Ideas, Knowledge Base, Summary, Run Specification; move the rest under More |
| `runs-explorer.tsx` | List/grid toggle, filter chips, owner, reviewed ideas | Dashboard controls and internal terms obscure research | List only; editorial status tabs; Ideas and Papers reviewed columns |
| `ideas-portfolio.tsx` | Lifecycle labels, score vectors, weak-edge summaries | Evaluation precedes comprehension | Editorial rows: role, rationale, decision, report |
| `idea-reader.tsx` | Evidence profile, scorecard, reviewer critique, then report | The report is below several screens of audit material | Scientific explanation and report first; evaluation collapsed |
| `knowledge-reader.tsx` | Independent language state, tools-first header | Mixed locale and utility-first reading | Global locale, report header, 700-760px body, sticky TOC |
| `new-run-builder.tsx` | Amber warning box and boxed live preview | Intake resembles an error state and dashboard card | Plain sentence; form and document preview separated by a rule |
| `pdf-viewer.tsx` | Path-bound viewer with English-only controls | Report identity is external to the viewer | Bind selected report ID and localize controls; page 1 default |
| `run-portfolio-summary.tsx` | Funnel strip and process counts | Internal process is mistaken for scientific result | Continuous summary prose and a plain portfolio table |
| `globals.css` | Repeated cards, pills, fills, and rounded surfaces | Low information density and weak reading rhythm | Editorial typography, whitespace, thin rules, restrained green |

## Content-contract defects

- `ResearchRunManifestV1` has plain English strings and no explicit primary artifact references.
- Idea PDF/Markdown paths are duplicated independently of report identity.
- Literature depth is not represented, so the UI cannot distinguish discovery from close reading.
- Missing translations fall back to whichever object is first.
- Report placement depends on array position or file type rather than scientific role.

The redesign introduces localized content objects, `ResearchReportManifestV2`, explicit primary IDs, and declared literature statistics while retaining compatibility with publication-boundary tooling.
