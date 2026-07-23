# Font Loading and Fallback Audit

- Package: `@fontsource/noto-sans-kr` 5.2.8, OFL licensed.
- Loaded subsets: Korean and Latin.
- Loaded weights: 400, 500, 600, 700.
- Build-time Google font access: not required.
- Declared family: `Noto Sans KR, sans-serif` for UI and reading.
- Synthetic bold: disabled with `font-synthesis: none`.

Playwright confirmed `document.fonts.check('16px "Noto Sans KR"', '연구 요약 Scientific Core')` and observed the Korean WOFF2 request. A static contract test verifies all eight subset/weight imports and the root `data-font-family` marker.

Fallback remains a generic sans-serif only for exceptional font-loading failure. Normal local and public static builds carry the required webfont assets.
