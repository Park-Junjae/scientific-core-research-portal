# Direct Run Control Integration

This branch reconstructs the public-safe browser side of authenticated
Scientific Core execution on top of the sanitized Portal main branch. It does
not contain private development ancestry and does not contain or accept an
OpenAI key, GitHub token, shell command, runtime ref, executable path, output
path, or arbitrary environment.

## Build Configuration

Set one non-secret environment variable:

```text
NEXT_PUBLIC_RUN_CONTROL_API_BASE=https://<approved-control-host>
```

The backend must allow the exact Portal origin and provide GitHub OAuth,
server-side sessions, CSRF, private request storage, V2 replay-protected status
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
GitHub OAuth/App credentials entered directly in the hosting platform, an
approved-user allowlist, same-site or reviewed cross-site session behavior,
persistent database storage, and private encrypted object storage. None of
those secrets belongs in this repository or in a browser bundle.

This branch is based on sanitized merge commit
`e1a367365e0c80db41c613167e1c5735f87e42bb`. The superseded draft PR must be
closed rather than merged.
