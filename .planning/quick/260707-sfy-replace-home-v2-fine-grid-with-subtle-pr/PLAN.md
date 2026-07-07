# Quick Task Plan: Replace Home V2 Fine Grid With Subtle Texture

## Task

Replace the current small grid overlay on `/home-v2` with a more refined, barely visible premium watermark texture.

## Direction

- Remove the obvious 3px technical grid.
- Use an understated paper/fabric watermark: faint fiber, diagonal weave, and soft vertical grain.
- Keep texture fixed and pointer-events-none for performance.
- Avoid decorative orbs, high-contrast patterning, obvious wallpaper, or anything that competes with text/images.

## Verification

- Build and lint pass.
- Preview desktop/mobile screenshots show no horizontal overflow.
- Texture is visible only as subtle material depth.
