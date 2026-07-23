# Synthetic Placeholder Removal Report

The three public demonstration runs remain synthetic and preserve their historical files, but generated one-page PDFs are no longer presented as primary scientific reports.

- Migrated idea records use `report_id: null` unless a complete approved report exists.
- Summary-only ideas render an approved scientific summary and explicitly state that no dedicated report is available.
- `scripts/generate_demo_pdfs.py` is marked as a historical fixture utility and is absent from the build path.
- Historical fixture paths remain manifest-declared for validation and provenance, not as main reader outputs.

The preferred representation of a missing report is `null`, not a pseudo-report.
