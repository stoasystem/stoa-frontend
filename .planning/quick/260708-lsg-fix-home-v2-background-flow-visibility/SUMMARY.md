# Quick Task Summary: Fix Home V2 background flow visibility

Date: 2026-07-08
ID: 260708-lsg

## Outcome

Removed the repeated linear texture layers that made the background read as static vertical lines. The Home V2 background now relies on the SVG guide-line layer plus a soft light field, so the scroll-driven transform is no longer visually dominated by rigid striping.

## Changes

- Removed both repeated linear background layers from `.home-v2-premium::before`.
- Increased the remaining overlay opacity to keep the guide-line flow visible.
- Preserved scroll-driven transform animation and reduced-motion behavior.

## Verification

- `git diff --check`
- `npm run lint`
- `npm run build`
- Browser CSS sampling: no `repeating-linear-gradient` in the background overlay
- Browser CSS sampling: SVG flow layer remains and transform changes on scroll
- Browser overflow check: false
