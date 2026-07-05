---
status: complete
completed: 2026-07-05
commit: fcc8bcd
---

# Quick Task 260705-n4u Summary

## Outcome

Fixed the raw `Unauthorized` error in the login-page email verification flow.

Root cause: the shared frontend HTTP client attached a stale `stoa_access_token` to public auth endpoints, including `/auth/email-verification/resend` and `/auth/email-verification/confirm`. A gateway or auth layer could reject those requests before the public FastAPI route handled them, and the login page then displayed the raw 401 message.

## Changes

- Added public auth endpoint detection in `src/services/api/httpClient.ts` and suppresses `Authorization` for those requests.
- Added `isUnauthorizedError` in `src/services/auth/authApi.ts`.
- Updated `src/components/auth/EmailVerificationPanel.tsx` to show recovery copy for 401 verification failures.
- Added localized `verification.unauthorized` copy for EN/DE/FR/IT.
- Updated `tests/e2e/auth.spec.ts` to cover the stale-token login verification flow and assert no `authorization` header is sent.

## Verification

- `npm run lint`
- `npm run test:e2e -- auth.spec.ts`

Both passed.
