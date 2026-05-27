---
status: complete
created: "2026-05-27"
task: "Add student Referrals navigation"
---

# Quick Task: Add Student Referrals Navigation

## Goal

Expose the existing referrals page to student accounts from the student dashboard navigation, matching the parent account access pattern.

## Scope

- Add `Referrals` as a student secondary nav item.
- Allow student login redirects to `/referrals`.
- Verify student dashboard navigation and direct referral route access.

## Verification

- `npm run lint`
- `npm run build`
- Browser check student dashboard sidebar contains `Referrals` and opens `/referrals`.

## Result

Complete. Student accounts now show `Referrals` in the dashboard sidebar More section, can open `/referrals`, and can use `/login?next=/referrals`.
