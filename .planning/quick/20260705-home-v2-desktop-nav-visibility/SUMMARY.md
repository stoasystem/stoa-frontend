---
type: quick
status: complete
created: 2026-07-05
completed: 2026-07-05
---

# Summary

Improved the `/home-v2` desktop navigation link visibility.

## Changed

- Converted the middle desktop nav into a subtle segmented pill cluster.
- Increased nav links to 16px / 600 weight with a 48px hit area.
- Raised link contrast from muted gray to stronger ink.
- Added restrained hover and focus-visible surface treatment.

## Result

The Parents, Teachers, and Pricing links now read as visible navigation buttons instead of small gray text, while remaining secondary to the Login CTA.

## Verification

- Playwright desktop header smoke confirmed nav links render at 16px, 600 weight, 48px height, and stronger ink color.
- Screenshot check confirmed clearer button presence.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:e2e -- home-v2.spec.ts`: passed.
