---
status: complete
completed: 2026-05-25
type: quick
---

# Fix primary button contrast

## Completed

- Updated the shared `Button` default variant to force light text on the deep navy primary background.
- Verified `/for-parents` `View pricing` and homepage `Start Learning` render with readable text.

## Verification

- `npx tsc -b --pretty false`
- `npm run lint`
- `npm run build` passed with the existing Vite large chunk warning and Node deprecation warning
- Playwright computed style check:
  - `/for-parents` `View pricing`: text `rgb(247, 243, 236)`, background `rgb(21, 34, 55)`
  - `/` `Start Learning`: text `rgb(247, 243, 236)`, background `rgb(21, 34, 55)`
