# Quick Task Summary: Add scroll-responsive flowing background to Home V2

Date: 2026-07-08
ID: 260708-fmn

## Outcome

Added scroll-responsive motion to the Home V2 background treatment. The engraved watermark and light field now drift at different rates while the user scrolls, creating a subtle flowing material effect.

## Changes

- Expanded the fixed background pseudo-elements beyond the viewport to allow transform motion without edge gaps.
- Added CSS scroll-timeline animations for the watermark layer and light field layer.
- Used transform-only movement for performance.
- Added reduced-motion handling for the new background animations.

## Verification

- `git diff --check`
- `npm run lint`
- `npm run build`
- Playwright scroll check: `animation-timeline` supported and `::before` / `::after` transforms changed after scroll
- Desktop and mobile screenshots reviewed
