---
status: complete
---

# Quick Task Summary: Remove Login Review Shortcuts

**Completed:** 2026-05-27

## Changes

- Removed the saved review account shortcut block from the login form.
- Removed the unused shortcut title from English, German, French, and Italian auth locale files.
- Kept normal email/password sign-in unchanged.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- Browser check on `/login?next=/chat`: saved review account block count is 0, email and password fields are present.
