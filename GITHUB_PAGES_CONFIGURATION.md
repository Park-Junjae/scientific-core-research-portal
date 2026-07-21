# GitHub Pages Configuration

- Repository: `scientific-core-research-portal` (not yet created).
- Build: Next.js static export to `out/`.
- Project base path: `NEXT_PUBLIC_BASE_PATH=/scientific-core-research-portal`.
- Source: GitHub Actions, not a branch directory.
- Required permissions: `pages: write`, `id-token: write`, `contents: read`.
- Environment: `github-pages`.
- Deployment guard: `deploy/site_visibility.json` must authorize `PUBLIC_SANITIZED` and list at least one approved run ID.

`output: "export"`, `trailingSlash: true`, and unoptimized images produce portable static paths. The site needs no Node process after deployment.
