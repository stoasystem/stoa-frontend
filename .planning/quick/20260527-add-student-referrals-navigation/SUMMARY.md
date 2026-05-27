---
status: complete
completed: "2026-05-27"
task: "Add student Referrals navigation"
---

# Summary

Added the existing shared referrals page to student navigation.

## Changes

- Added `Referrals` as a student secondary nav item.
- Allowed student login redirects to `/referrals`.

## Verification

- `npm run lint`
- `npm run build`
- Playwright student login to `/dashboard`, verified `Referrals` appears in sidebar and opens `/referrals`
- Playwright student login with `/login?next=/referrals`, verified redirect reaches `/referrals`
