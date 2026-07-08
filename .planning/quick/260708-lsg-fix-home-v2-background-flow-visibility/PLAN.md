# Quick Task: Fix Home V2 background flow visibility

Date: 2026-07-08
ID: 260708-lsg

## Goal

Fix the Home V2 background treatment so the perceived motion reads as flowing guide lines, not static vertical texture.

## Scope

- Remove the repeated linear texture layers that visually read as dead vertical lines.
- Keep the SVG guide-line layer and scroll-driven transform motion.
- Preserve the Home V2 palette, layout, and reduced-motion behavior.

## Acceptance Checks

- `npm run lint` passes.
- `npm run build` passes.
- Browser CSS sampling confirms no `repeating-linear-gradient` remains in the Home V2 background overlay.
- Browser CSS sampling confirms the SVG flow layer remains and its transform changes on scroll.
- Browser overflow check remains false.
