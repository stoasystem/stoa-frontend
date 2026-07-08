# Quick Task: Add scroll-responsive flowing background to Home V2

Date: 2026-07-08
ID: 260708-fmn

## Goal

Make the `/home-v2` engraved watermark background feel alive during page scroll instead of remaining visually fixed.

## Direction

- Use restrained scroll-driven motion, not a scanning effect.
- Move only fixed background treatment layers through GPU-safe transforms.
- Keep typography, cards, navigation, and content layout unchanged.
- Respect `prefers-reduced-motion`.

## Acceptance Checks

- `npm run lint` passes.
- `npm run build` passes.
- Browser check confirms scroll timeline support and changing pseudo-element transforms after scroll.
- Desktop and mobile preview screenshots remain readable and without layout breakage.
