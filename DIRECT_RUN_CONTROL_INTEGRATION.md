# Direct Run Control Integration

This branch adds the browser side of authenticated Scientific Core execution.
It does not contain or accept an OpenAI key, GitHub token, shell command,
runtime ref, executable path, output path, or arbitrary environment.

## Build Configuration

Set one non-secret environment variable:

```text
NEXT_PUBLIC_RUN_CONTROL_API_BASE=https://<approved-control-host>
```

The backend must allow the exact Portal origin and provide GitHub OAuth,
server sessions, CSRF, private request storage, safe status, approval,
cancellation, and re-dispatch endpoints.

## User Flow

1. `Prepare research run` authenticates the user and creates a private request.
2. The browser navigates to `/run-control/?run_id=<opaque-id>`.
3. The page polls safe status and event history.
4. Preflight displays material inferences and hard ceilings.
5. `Approve and run` remains disabled until the user confirms review.
6. Cancellation and expired-queue re-dispatch are explicit actions.

The branch is based on `release/portal-v3-sanitized` and must remain unmerged
while the sanitized release pull request is active.
