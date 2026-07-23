# Redesigned Information Architecture

## Reader path

The portal now begins with scientific objects and complete reports rather than runtime receipts.

1. **Runs** is a list of research questions with status, idea count, reviewed-paper depth, and update date.
2. A focused, verification, or measurement run opens at **Summary**. A discovery run opens at **Ideas**.
3. The four primary run sections are **Ideas**, **Knowledge Base**, **Summary**, and **Run Specification**.
4. Reports, files, publication information, and technical provenance remain under **More**.
5. A report is selected by `report_id`; array order has no UI meaning.

## Page hierarchy

| Page | Primary content | Deferred content |
| --- | --- | --- |
| Runs | title, status, ideas, papers reviewed, updated | row actions |
| Summary | question, scientific summary, main reports, literature, decision, reading order | technical state |
| Ideas | idea, portfolio role, rationale, decision, report | reviewer evaluation |
| Idea | abstract, rationale, evidence, comparison, expected result, report | scores, critiques, stop conditions |
| Knowledge Base | approved long-form Markdown, TOC, PDF | source-audit identifiers |
| Run Specification | question, goal, bottleneck, criteria, constraints, non-goals, outputs | raw JSON |

The previous dashboard-card hierarchy is retired from the reader surface.
