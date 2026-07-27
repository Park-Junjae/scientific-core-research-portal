# Third-Party Notices

## Pretendard

The portal bundles Pretendard Variable version 1.3.9 as the primary interface and reading typeface for Korean and Latin text. The font is vendored directly into `public/fonts/pretendard/` as a dynamic subset (92 `woff2` files, each scoped by `unicode-range`) rather than installed as a package, because CI installs with `--frozen-lockfile` and the lockfile could not be regenerated in the authoring environment. The accompanying `@font-face` rules live in `src/app/pretendard.css`.

Copyright holder: Kil Hyung-jin, with Reserved Font Name Pretendard.

License: SIL Open Font License 1.1. The complete license text is included at `licenses/Pretendard-OFL.txt`.

The font files are distributed only as application assets. They are not offered as a separate font download.

## Noto Sans KR

Noto Sans KR remains bundled through `@fontsource/noto-sans-kr` version 5.2.8 as the fallback behind Pretendard, at weights 400, 500, 600, and 700.

Copyright holder: Google Inc.

License: SIL Open Font License 1.1. The complete license text is included at `licenses/NotoSansKR-OFL.txt`.

The font files are distributed only as application assets. They are not offered as a separate font download.
