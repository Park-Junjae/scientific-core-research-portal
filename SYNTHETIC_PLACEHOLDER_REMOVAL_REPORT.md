# Synthetic Placeholder Removal Report

The three historical demonstration runs remain synthetic test fixtures, but they are not present in any production surface and generated one-page PDFs are not presented as primary scientific reports.

- Migrated idea records use `report_id: null` unless a complete approved report exists.
- Summary-only ideas render an approved scientific summary and explicitly state that no dedicated report is available.
- `tests/fixtures/tools/generate_demo_pdfs.py` is a historical fixture utility and is absent from the production build path.
- Historical fixture paths remain manifest-declared for validation and provenance, not as main reader outputs.

The preferred representation of a missing report is `null`, not a pseudo-report.
