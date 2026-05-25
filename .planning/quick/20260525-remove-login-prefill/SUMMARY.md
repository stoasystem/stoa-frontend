---
status: complete
completed: 2026-05-25
type: quick
---

# Remove login test account prefill

## Completed

- Cleared the default login email and password state.
- Kept the existing demo shortcut filler behind the environment flag for internal demo use.

## Verification

- `npx tsc -b --pretty false`
- `npm run lint`
- `npm run build` passed with the existing Vite large chunk warning and Node deprecation warning.
- Playwright login check confirmed `emailEmpty: true` and `passwordEmpty: true` for `/login?next=/chat`.
