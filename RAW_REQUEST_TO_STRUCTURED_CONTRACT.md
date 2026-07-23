# Raw Request to Structured Contract

## RunRequestV2

A simple request exports:

```json
{
  "raw_research_request": "...",
  "reference_material_or_constraints": "...",
  "structured_fields": null,
  "requires_director_compilation": true
}
```

The full file also carries inferred defaults: a title derived from the first meaningful sentence, `AUTO` run type, current portal locale, `PRIVATE` visibility, and the standard complete research bundle.

Advanced overrides populate `structured_fields`; they do not remove the raw request. `normalizeImportedRequest` accepts both `RunRequestV2` and legacy flat structured request files. Unknown imported enum values are reset to safe defaults rather than shown to readers.

## Director boundary

Before provider-backed work, the Scientific Director must:

1. Compile the raw request into the complete Scientific Core contract.
2. Identify missing or ambiguous assumptions.
3. Present the compiled specification to the user.
4. Stop for explicit confirmation.
5. Start provider-backed scientific work only after confirmation.

The downloaded request is input material, not execution authorization.
