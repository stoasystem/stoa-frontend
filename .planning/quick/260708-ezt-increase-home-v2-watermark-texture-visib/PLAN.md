# Quick Task: Increase Home V2 watermark texture visibility

Date: 2026-07-08
ID: 260708-ezt

## Goal

Make the `/home-v2` background watermark texture visibly present in the hero area while keeping the surface premium, quiet, and non-grid-like.

## Scope

- Tune only the Home V2 premium background texture layer.
- Preserve the current cool porcelain palette.
- Keep text, image, and button readability intact.
- Verify desktop and mobile preview rendering.

## Acceptance Checks

- `npm run lint` passes.
- `npm run build` passes.
- Preview at `/home-v2` shows a perceptible but restrained background texture.
- No horizontal overflow appears in desktop preview.
