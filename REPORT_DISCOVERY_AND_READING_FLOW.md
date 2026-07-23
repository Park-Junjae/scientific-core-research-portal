# Report Discovery and Reading Flow

1. `primary_report_id`, `primary_knowledge_id`, `primary_summary_id`, and `run_specification_id` are validated when a run is loaded.
2. Summary lists principal scientific reports by role and `display_order`.
3. `Read online` opens `/runs/<slug>/reports/<report_id>/`.
4. The reader resolves the matching locale within the same `translation_group_id`.
5. Markdown is the primary reading surface. PDF open/download actions are adjacent to the report title.
6. The optional page viewer starts at page 1 and is bound to the same report ID.

No code path infers the main report from the first PDF in an array.
