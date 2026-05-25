---
status: complete
completed: 2026-05-25
type: quick
---

# Fix parent growth visual

## Completed

- Replaced the parent landing hero image with a child learning classroom scene.
- Updated the hero image alt text to describe child learning rather than parent reporting.
- Rewrote the overlay from weekly operational signals to child growth, confidence, and next-step language.

## Verification

- `npx tsc -b --pretty false`
- `npm run lint`
- `npm run build` passed with the existing Vite large chunk warning and Node deprecation warning.
- Playwright check confirmed `/for-parents` renders the new image alt and growth copy, and no longer shows the old `Weekly signal` copy.
