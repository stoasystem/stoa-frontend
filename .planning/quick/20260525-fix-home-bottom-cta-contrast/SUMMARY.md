---
status: complete
completed: 2026-05-25
type: quick
---

# Fix home bottom CTA contrast

## Completed

- Changed the homepage bottom CTA button from the default primary variant to the secondary/light variant.
- Kept the ivory button background and premium hover behavior.

## Verification

- `npx tsc -b --pretty false`
- `npm run lint`
- `npm run build` passed with the existing Vite large chunk warning and Node deprecation warning.
- Playwright computed-style check confirmed the bottom homepage `Start Learning` uses dark text `rgb(21, 34, 56)` on ivory `rgb(247, 243, 236)`.
- Playwright computed-style check confirmed header and hero `Start Learning` buttons still use light text on navy.
