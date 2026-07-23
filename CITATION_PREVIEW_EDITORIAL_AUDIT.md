# Citation Preview Editorial Audit

Status: PASS

The citation preview is intentionally a short orientation layer rather than a second source reader.

- Citation identity is resolved from `report_id + citation_number`.
- Each of relevance, direct support, and principal limitation is truncated to 32 words, keeping the complete preview below 120 words for the approved source records.
- No internal source ID, claim ID, or audit metadata is rendered.
- The preview provides a source-detail link and DOI link when available.
- The desktop preview has no internal scrolling.
- At mobile width it is presented as a full-width bottom sheet without an internal scroll container.
- Escape closes the preview and restores keyboard focus to the citation trigger.
- The close icon has a localized accessible name.

The full source page remains the authoritative location for the complete citation, evidence boundary, related research objects, report sections, and access links.
