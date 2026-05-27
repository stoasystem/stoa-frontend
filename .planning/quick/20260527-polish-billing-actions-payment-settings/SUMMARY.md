---
status: complete
completed: "2026-05-27"
task: "Polish billing actions and payment settings"
---

# Summary

Cleaned up the billing page action area and replaced the disabled billing-management button with a real payment settings route.

## Changes

- Reworked the billing checkout area into structured action cards.
- Changed `Manage billing` into an active `Payment settings` link.
- Added `/billing/payment-settings` with billing contact, payment method status, subscription, invoice, and support sections.
- Added route metadata and protected route wiring for the new page.

## Verification

- `npm run lint`
- `npm run build`
- Playwright desktop check of `/billing` and `/billing/payment-settings`
- Playwright mobile check of `/billing` and `/billing/payment-settings`
- Confirmed payment settings is clickable and no horizontal overflow occurs
