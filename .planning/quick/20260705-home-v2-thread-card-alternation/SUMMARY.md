---
type: quick
status: complete
created: 2026-07-05
completed: 2026-07-05
---

# Summary

Moved the fourth `/home-v2` Learning Thread card to the right side on desktop/tablet grid layouts.

## Changed

- Added an explicit layout helper for Learning Thread beat placement.
- Set beat 04 to `md:col-start-3 md:col-span-4`.
- Preserved mobile single-column behavior.

## Result

The Learning Thread now ends with 04 on the right, creating a clearer alternating path instead of dropping the final card back to the left.

## Verification

- Playwright layout smoke confirmed beat 04 moved to the right-side grid position.
- Screenshot check confirmed 04 appears right-aligned below 02/03.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:e2e -- home-v2.spec.ts`: passed.
