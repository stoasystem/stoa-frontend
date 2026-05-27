---
status: complete
completed: 2026-05-27
---

# Quick Task Summary: Practice Continue Button Readability

## Completed

- Updated the shared default `Button` variant to force high-contrast `primary-foreground` text on primary buttons.
- This fixes the `/practice` `Continue practice` CTA when rendered as an `asChild` link.

## Verification

- `npm run build`: passed.
- Browser computed color check for `/practice` `Continue practice`: text `rgb(248, 246, 241)` on burgundy background `rgb(142, 37, 51)`.
