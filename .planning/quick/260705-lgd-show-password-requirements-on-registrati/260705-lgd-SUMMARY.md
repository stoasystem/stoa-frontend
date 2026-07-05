---
status: complete
quick_id: 260705-lgd
slug: show-password-requirements-on-registrati
commit: 914a6f7
---

# Quick Task 260705-lgd Summary

## Status

Complete.

## Completed

- Added a shared `isCompliantPassword` helper for the registration password policy.
- Added visible password requirement text under the registration password field.
- Changed account-step validation to show the full password requirements instead of only checking length.
- Mapped the backend `Password does not meet requirements` registration error to the same concrete guidance.
- Added localized password requirement copy for EN, DE, FR, and IT.
- Updated auth e2e coverage to assert the visible guidance and use a compliant registration password.

## Verification

```bash
npm run test:e2e -- auth.spec.ts
```

Result:

- `5 passed`

```bash
npm run lint
```

Result:

- `eslint .` passed.

## Code Commit

- `914a6f7 fix(auth): explain registration password requirements`
