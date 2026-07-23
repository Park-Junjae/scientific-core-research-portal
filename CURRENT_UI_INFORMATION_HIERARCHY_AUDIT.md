# Current UI Information Hierarchy Audit

Audit baseline: `528d5faabde64270463540fed570f3980bab30f1`

## Reader task

The primary reader needs to answer four questions in order:

1. What scientific question was investigated?
2. What ideas or decisions resulted?
3. What evidence and literature support them?
4. Where is the complete report?

## Current hierarchy

The current portal puts operational and presentation metadata ahead of those questions:

1. Run status, mode, domain, owner, tags, and generic report actions.
2. Portfolio funnel and PDF-count metrics.
3. Goal and decision fragments.
4. Idea score vectors, reviewer critique, weak edges, and stop conditions.
5. Complete Markdown or PDF report.

This order makes a scientific run read like an internal dashboard. It also makes a report file appear to be the research object itself.

## Verified hierarchy defects

- `RunHeader` selects the first language-matching PDF instead of an explicitly designated report.
- The focused-run landing page is an overview dashboard rather than a scientific summary.
- `RunMetricStrip` elevates PDF count to a primary measure.
- Ideas expose evaluation metadata before the approved scientific account.
- Knowledge is visually separated from its report identity and begins with tools rather than context.
- Reports, files, and technical details compete with scientific sections as equal navigation items.
- Synthetic one-page PDFs are visually indistinguishable from complete scientific reports.
- Language selection affects only isolated components, so a page can mix Korean and English.

## Required hierarchy

Focused, verification, and measurement runs must open on Summary. Discovery runs must open on Ideas. The primary run navigation is limited to Ideas, Knowledge Base, Summary, and Run Specification. Reports are discovered in scientific context and selected by report ID. Files, publication metadata, build data, and audit detail remain available under More.

## Acceptance signal

The first desktop viewport must contain the research question, scientific summary, and principal report links for a focused run. An idea detail must explain the idea before showing evaluation detail. A knowledge page must begin as a readable document, not an audit console.
