---
status: complete
completed: 2026-05-27
---

# Quick Task Summary: Student Login Dashboard Redirect

## Completed

- Removed `/chat` from the student login next-path allowlist.
- Student login now defaults to `/dashboard` when login was triggered from an unauthenticated chat route.
- Explicit `next=/practice` still lands on `/practice`.

## Verification

- `npm run build`: passed.
- Browser check: unauthenticated `/chat` -> login -> student lands on `/dashboard`.
- Browser check: `/login?next=/practice` -> student lands on `/practice`.
