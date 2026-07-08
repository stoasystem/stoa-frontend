# Quick Task Summary: Increase Home V2 scroll background flow amplitude

Date: 2026-07-08
ID: 260708-g0f

## Outcome

Increased the Home V2 background flow amplitude and changed the motion from a straight diagonal drift into a subtle stream-like path. The watermark layer now meanders horizontally while moving with scroll, and the light field follows with a slower counter-motion.

## Changes

- Enlarged the watermark layer scroll transform range.
- Added multi-step horizontal meander and slight rotation to make the path feel more organic.
- Enlarged the supporting light field transform range with slower counter-motion.
- Kept movement GPU-safe through transform-only animation.
- Left texture, layout, and reduced-motion handling unchanged.

## Verification

- `git diff --check`
- `npm run lint`
- `npm run build`
- Playwright scroll check confirmed larger transform deltas and no horizontal overflow
