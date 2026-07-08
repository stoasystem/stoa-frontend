# Quick Task: Increase Home V2 scroll background flow amplitude

Date: 2026-07-08
ID: 260708-g0f

## Goal

Increase the perceived amplitude of the `/home-v2` scroll-responsive background flow while changing the movement from a simple diagonal drift into a restrained stream-like path.

## Scope

- Tune only Home V2 background flow transforms.
- Add subtle horizontal meander to the scroll path so the motion feels more like a small stream than a straight diagonal slide.
- Preserve the engraved watermark texture, color palette, layout, and reduced-motion behavior.
- Keep the motion transform-only and scroll-driven.

## Acceptance Checks

- `npm run lint` passes.
- `npm run build` passes.
- Browser scroll check shows larger pseudo-element transform deltas with multi-step curved motion.
- Browser scroll sampling shows no horizontal overflow.
