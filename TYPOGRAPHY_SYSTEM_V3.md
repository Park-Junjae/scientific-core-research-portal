# Typography System V3

## Decision

The portal uses one locally bundled Noto Sans KR family for Korean and Latin UI and scientific reading. The supported weights are 400, 500, 600, and limited 700 emphasis. Synthetic bold is disabled.

## Scale

| Token | Size | Use |
|---|---:|---|
| `--text-xs` | 12 px | source roles, minor metadata |
| `--text-sm` | 14 px | navigation and metadata |
| `--text-base` | 16 px | UI body |
| `--text-reading` | 17 px | scientific reports |
| `--text-lg` | 19 px | list titles |
| `--text-h3` | 21 px | compact section headings |
| `--text-h2` | 28 px | page sections |
| `--text-h1` | 42 px | principal desktop titles |

Mobile H1 is 32 px and reading text is 16.5 px. No reader-facing heading exceeds 48 px. Scientific columns are capped at 760 px.

Korean text uses `word-break: keep-all`, `overflow-wrap: break-word`, and `line-break: strict`. Major headings use balanced wrapping.
