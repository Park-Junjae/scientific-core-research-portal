# AI Cho-Scientist Public Research Portal

A static, read-only research workspace for approved AI Cho-Scientist runs. It publishes a validated `ResearchRunBundleV1` into a readable Next.js site that remains available without the scientific VM.

Public synthetic demonstration: [AI Cho-Scientist](https://app.aichoscientist.com/)

## Current mode

`PUBLIC_SANITIZED`. Explicit approval covers only the three bundled synthetic demonstrations. No private scientific report, raw provider output, prompt, registry, or laboratory data is included.

## Local use

```bash
pnpm install --frozen-lockfile
python -m pip install -e .
python scripts/generate_demo_pdfs.py
python -m coscientist.site validate-content --portal-root .
pnpm build
python -m coscientist.site preview-site --portal-root . --port 4173
```

Open `http://127.0.0.1:4173/runs/`.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
python tests/run_all.py
pnpm test:content
pnpm build
pnpm test:links
pnpm test:budget
pnpm test:e2e
```

## Publication

```bash
python -m coscientist.site publish-run \
  --run-root /path/to/sanitized-run-bundle \
  --portal-root . \
  --visibility PUBLIC_SANITIZED
```

Publication is allowlist-only, rejects unsafe paths and secret patterns, generates receipts and content hashes, and verifies that the source run tree is unchanged. See [CONTENT_PUBLICATION_GUIDE.md](CONTENT_PUBLICATION_GUIDE.md).

## Architecture

- Next.js App Router + TypeScript
- static export with trailing-slash routes
- client-side search, filters, preferences, and intake downloads
- run-mode-aware portfolio funnels, idea lifecycle filters, score vectors, and summary-only idea pages
- PDF.js browser renderer with native open/download fallback
- deterministic Python publication CLI
- GitHub Pages workflow gated by explicit visibility approval

The scientific runtime is outside this repository and remains unchanged. Source-run locations are supplied to the publication CLI at execution time and are never serialized into published content.

The current deployment receipt is recorded in [`DEPLOYMENT_RECEIPT.json`](DEPLOYMENT_RECEIPT.json).
