---
status: complete
completed: 2026-06-01
---

# Quick Task 260601-0mk Summary

Replaced the compact marketing-header language selector's native browser dropdown with a custom Radix dropdown menu.

## Files Changed

- `src/components/common/LanguageSwitcher.tsx`

## Verification

- `npm run lint`
- `npm run build`
- Browser check on `/login` confirmed the trigger remains 56x32 px and the open menu uses the custom rounded/shadowed styling.
