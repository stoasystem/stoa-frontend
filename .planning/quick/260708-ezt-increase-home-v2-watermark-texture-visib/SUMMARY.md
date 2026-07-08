# Quick Task Summary: Increase Home V2 watermark texture visibility

Date: 2026-07-08
ID: 260708-ezt

## Outcome

Adjusted the Home V2 fixed watermark layer so the background dark pattern is visible as a restrained material texture instead of disappearing into the light porcelain surface.

## Changes

- Increased the Home V2 texture overlay opacity.
- Strengthened the two diagonal watermark line layers.
- Replaced the faint radial wash with a large-scale diagonal tonal layer.
- Kept the pattern non-grid-like and below content prominence.

## Verification

- `git diff --check`
- `npm run lint`
- `npm run build`
- Local preview screenshots for desktop and mobile at `/home-v2`
- Desktop overflow check: no horizontal overflow
