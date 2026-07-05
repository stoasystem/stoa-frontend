---
type: quick
status: complete
created: 2026-07-05
completed: 2026-07-05
---

# Summary

Implemented the `/home-v2` Learning Thread animation after `grill-me` clarification.

## Changed

- Added `IntersectionObserver`-driven active beat tracking to `HomeV2LearningThread`.
- Added a vertical thread rail whose lit progress follows the active learning beat.
- Added restrained active/completed node states, warm card glow, and subtle ambient breathing on the active node.
- Preserved a mobile single-column timeline and removed complex scroll-pixel animation.
- Added reduced-motion handling for the new thread transitions and ambient animation.

## Result

The Learning Thread now reads as one learning line being gradually lit by scroll, with warmth and vitality coming from light and shadow rather than decorative or gamified motion.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- Direct Playwright smoke against `/home-v2`: desktop and mobile active/progress states passed.
- `npm run test:e2e -- home-v2.spec.ts`: passed with elevated permission for local server binding.
