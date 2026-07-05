---
quick_id: 260705-lgd
slug: show-password-requirements-on-registrati
status: planned
---

# Quick Task 260705-lgd: Show password requirements on registration when password is noncompliant

## Goal

Make the registration password requirement visible before submission and make validation failures explain the exact password rules.

## Tasks

1. Add a shared frontend password policy helper and localized requirement text.
2. Show the requirement text below the registration password field and use it for account-step validation.
3. Update focused auth e2e coverage so registration uses a compliant password and asserts the visible guidance.

## Verification

- `npm run test:e2e -- auth.spec.ts`
- `npm run lint`
