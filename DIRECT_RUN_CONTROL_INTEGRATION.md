# Direct Run Control Integration

This branch reconstructs the public-safe browser side of authenticated
Scientific Core execution on top of the sanitized Portal main branch. It does
not contain private development ancestry and does not contain or accept an
provider key, Access assertion, GitHub App credential, shell command, runtime ref, executable path, output
path, or arbitrary environment.

## Build Configuration

Set one non-secret environment variable:

```text
NEXT_PUBLIC_RUN_CONTROL_API_BASE=https://api.aichoscientist.com
```

The backend must allow the exact Portal origin and use Cloudflare Access JWT
identity with an explicit email allowlist. It provides CSRF, private request storage, V2 replay-protected status
events, creator-submission approval, cancellation, and creator-authorized private
artifact endpoints.

## User Flow

1. `Start research` creates a private request and records the authenticated
   creator's submission as execution approval. Standard submits `AUTO` for
   server-side policy resolution; Breakthrough Discovery submits
   `DISCOVERY_PORTFOLIO_RUN`.
2. The browser navigates to `/run-control/?run_id=<opaque-id>`.
3. A persistent local Backend worker validates the launch before execution.
4. The page polls the direct lifecycle automatically at 2 seconds for
   `STARTING`, 3 seconds for `QUEUED`, and 5 seconds for `RUNNING` or
   `GENERATING_REPORTS`. Focus and visibility restoration refresh
   immediately; event history is fetched only when its sequence advances.
5. `EXECUTION_DISABLED` honestly stops polling when the validated contract is
   ready but the provider execution gate is intentionally off. It has no
   spinner, queue waiting language, or queue expiry.
6. Technical diagnostics remain collapsed and there is no second approval or
   normal manual refresh step.
7. Cancellation remains explicit.
8. A completed run opens its private Summary, Ideas, Literature, Knowledge
   Background, Run Specification, and PDF without public publication.

## Deployment Gate

The frontend is deployable with the single public backend base URL above.
Production acceptance still requires an independently deployed HTTPS backend,
Cloudflare Access configuration and GitHub App machine credentials entered
directly in the hosting platform, an approved-user allowlist, reviewed
cross-site credential behavior,
persistent database storage, and private encrypted object storage. None of
those secrets belongs in this repository or in a browser bundle.

This integration is reconstructed from production `main`; the historical
direct-run and Breakthrough UI PRs are superseded only after this replacement
passes release verification.
