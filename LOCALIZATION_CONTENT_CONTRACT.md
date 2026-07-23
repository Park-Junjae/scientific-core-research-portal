# Localization Content Contract

- Supported locales: `ko`, `en`.
- Scientific copy is a `LocalizedText` object; absence is represented by a missing key.
- UI copy is selected through the global locale context.
- Reports have one declared `language` and may share a `translation_group_id`.
- A request for a missing variant yields an unavailable message, never another language's body.
- Search indexes all declared language variants.
- Dates use locale-aware formatting.
- Adding translated text is a content change; relabeling an untranslated file is prohibited.
