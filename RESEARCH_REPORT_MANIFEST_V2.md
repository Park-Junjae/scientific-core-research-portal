# Research Report Manifest V2

`ResearchReportManifestV2` is the reader-facing document contract.

Required identity and placement fields are `report_id`, `role`, `language`, `is_primary`, and `display_order`. Reader copy is carried in `localized_title` and `localized_description`. `path` and `markdown_path` are nullable because an online-only document or a summary-only idea is valid. Page, reference, and primary-source counts are optional and displayed only when declared.

Allowed roles are Knowledge Background, Idea Report, Portfolio Decision, Research Summary, Run Specification, Measurement Report, and Technical Appendix. Role controls placement; filename and array order do not.
