# Deployment Runbook

## Current terminal

Deployment-ready local product only. `LOCAL_ONLY` prevents GitHub Pages publication.

## Review gate

1. Review `FIRST_RUN_MIGRATION_REPORT.md` and choose artifact-level candidates.
2. Sanitize each source into `ResearchRunBundleV1` through the publication CLI.
3. Review each publication receipt, content hash list, and sanitization audit.
4. Update `deploy/site_visibility.json` with `PUBLIC_SANITIZED`, approver, timestamp, exact approved run IDs, and `public_release_approved: true`.
5. Run `python -m coscientist.site validate-content --portal-root . --public-build`.

## Repository and Pages

```bash
gh repo create scientific-core-research-portal --private --source . --remote origin
git push -u origin feature/static-research-portal-v1
```

After review, merge to `main`, set repository visibility as explicitly approved, enable GitHub Pages with **GitHub Actions** as source, and dispatch `Deploy GitHub Pages`.

## Verification after deployment

- Open `/scientific-core-research-portal/runs/` directly in a clean browser.
- Open a run, idea, knowledge page, and PDF deep link.
- Confirm no private run names or files in the Pages artifact.
- Record URL, workflow run ID, commit, site hash, and approval reference in `DEPLOYMENT_RECEIPT.json`.

Never force push or infer public approval from repository creation.
