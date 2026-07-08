# Quick Task: Tune Home V2 background contrast and section spacing

Date: 2026-07-08
ID: 260708-mk0

## Goal

Increase Home V2 background guide-line visibility and reduce excessive whitespace between major content sections.

## Scope

- Strengthen the existing SVG background flow treatment without reintroducing rigid repeated striping.
- Tighten vertical rhythm for Learning Thread, Parent Confidence, and Trust sections.
- Preserve Home V2 layout structure, imagery, copy, and scroll-driven background motion.

## Acceptance Checks

- `npm run lint` passes.
- `npm run build` passes.
- Browser CSS sampling confirms stronger overlay opacity, SVG flow layer remains, repeated linear texture remains absent, and scroll transform still changes.
- Browser layout sampling confirms Parent Confidence top padding is reduced and no horizontal overflow appears.
