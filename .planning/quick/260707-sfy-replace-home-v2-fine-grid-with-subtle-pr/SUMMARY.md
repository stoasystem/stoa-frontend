---
status: complete
completed: 2026-07-07
---

# Quick Task Summary: Replace Home V2 Fine Grid With Subtle Texture

## Completed

- Replaced the visible 3px Home V2 grid overlay with a subtle fixed watermark texture.
- New texture uses low-opacity diagonal fiber, soft counter-weave, vertical paper grain, and a masked fade so it reads as material depth rather than a technical grid.
- Kept the texture GPU-safe and non-interactive through a fixed pseudo-element with `pointer-events: none`.

## Verification

- `git diff --check`: passed.
- `npm run lint`: passed.
- `npm run build`: passed with existing Vite chunk-size warning.
- Preview screenshots captured outside the repo:
  - `/private/tmp/stoa-home-v2-watermark-final-desktop.png`
  - `/private/tmp/stoa-home-v2-watermark-final-mobile.png`
- Playwright check confirmed no desktop/mobile horizontal overflow.
