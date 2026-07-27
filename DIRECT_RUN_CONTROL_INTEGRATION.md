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
events, approval, cancellation, re-dispatch, and owner-authorized private
artifact endpoints.

## User Flow

1. `Prepare research run` authenticates the user and creates a private request.
2. The browser navigates to `/run-control/?run_id=<opaque-id>`.
3. The page polls safe status and event history.
4. Preflight displays material inferences and hard ceilings.
5. `Approve and run` remains disabled until the user confirms review.
6. Cancellation and expired-queue re-dispatch are explicit actions.
7. A completed run opens its private Summary, Ideas, Literature, Knowledge
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
