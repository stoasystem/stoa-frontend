---
status: complete
completed: 2026-06-01
---

# Quick Task 260601-0ht Summary

Removed the selected `Safe checkout preview` badge from the `/pricing` page header.

## Files Changed

- `src/pages/pricing/PricingPage.tsx`

## Verification

- `npm run lint`
- `npm run build`
- Browser check on `/pricing` confirmed the header no longer contains `Safe checkout preview`.
