# Final Font and License Audit

Status: PASS

## Runtime typography

- Pretendard Variable is the primary UI and reading family, vendored into `public/fonts/pretendard/` as a 92-file dynamic subset (SIL OFL 1.1, `licenses/Pretendard-OFL.txt`).
- Noto Sans KR remains bundled as the fallback family.
- Korean and Latin subsets are bundled for weights 400, 500, 600, and 700.
- `font-synthesis: none` prevents synthetic bold or italic rendering.
- Desktop H1 is capped at 42 px; mobile H1 is capped at 32 px.
- General body text is at least 16 px. Long-form reading text is 17 px with 1.76 line height on desktop and 16.5 px with 1.74 line height on mobile.
- `word-break: keep-all`, strict line breaking, balanced headings, and normal letter spacing protect Korean word boundaries and mixed Korean/Latin scientific notation.

## License

- Package: `@fontsource/noto-sans-kr` 5.2.8.
- License: SIL Open Font License 1.1.
- Canonical bundled license copied without modification to `licenses/NotoSansKR-OFL.txt`.
- Source and copied license SHA256: `18aabf190848725e2576eefb5c29ba06aac1029d02132252a7f312eac2e50cf3`.
- Third-party attribution is recorded in `THIRD_PARTY_NOTICES.md`.
- Font assets remain embedded in the application build and are not distributed separately.

Final runtime loading is also checked in Playwright with `document.fonts.check()` and computed family/size assertions.
