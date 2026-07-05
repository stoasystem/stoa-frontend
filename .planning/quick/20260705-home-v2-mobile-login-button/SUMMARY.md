---
type: quick
status: complete
created: 2026-07-05
completed: 2026-07-05
---

# Summary

Fixed the blank mobile navigation login button on `/home-v2`.

## Changed

- Confirmed the mobile menu login link had text in the DOM but inherited the paper text color from the dark overlay.
- Added a scoped `home-v2-mobile-login` class with explicit ink text color and button shadow.
- Added center alignment to the mobile login CTA.

## Result

The mobile menu login pill now visibly renders `Login` on the paper-colored button.

## Verification

- Direct Playwright mobile menu smoke: `Login` text computed as dark ink on paper background.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:e2e -- home-v2.spec.ts`: passed.
