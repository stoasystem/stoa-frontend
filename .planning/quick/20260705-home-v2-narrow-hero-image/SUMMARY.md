---
type: quick
status: complete
created: 2026-07-05
completed: 2026-07-05
---

# Summary

Fixed the oversized `/home-v2` Hero image on narrow screens.

## Changed

- Capped the Hero image panel to `max-w-[44rem]` below desktop.
- Changed the narrow-screen image ratio from tall portrait to a shorter editorial landscape panel.
- Reduced the small-screen minimum image height while preserving the tall desktop Hero composition.

## Result

On narrow screens the Hero image no longer fills the screen as a huge photo; it sits as a controlled centered visual panel below the headline and CTAs.

## Verification

- Playwright narrow-screen smoke confirmed image panel height is controlled around 430px at 900px viewport width.
- Desktop smoke confirmed the tall editorial Hero panel remains intact.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:e2e -- home-v2.spec.ts`: passed.
