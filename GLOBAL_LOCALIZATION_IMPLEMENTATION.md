# Global Localization Implementation

`LocaleProvider` is mounted once in `AppShell`. Locale is read from `?lang=ko|en`, persisted to `localStorage`, and reflected in `document.documentElement.lang`.

One selection changes navigation, run titles, statuses, tabs, summaries, idea content, report metadata, dates, empty states, and form copy. Manifest content uses `{ "ko": ..., "en": ... }` objects.

There is no silent language fallback. If the requested variant is absent, the UI states that the requested language is unavailable. Report variants are resolved through `translation_group_id`, never by taking a title from a differently tagged file.

Current routing deliberately uses a query parameter rather than locale-prefixed paths so the existing static deployment structure remains unchanged.
