---
status: complete
created: "2026-05-27"
task: "Polish billing actions and payment settings"
---

# Quick Task: Polish Billing Actions and Payment Settings

## Goal

Fix the confusing billing action area where the checkout, billing management, and support buttons are visually messy, and make payment settings clickable instead of disabled.

## Scope

- Reorganize the billing page header/actions into clear stacked sections.
- Replace disabled `Manage billing` with an active payment settings link.
- Add a `/billing/payment-settings` page for payment method, billing contact, invoice, and support status.
- Keep hosted checkout language clear for demo/review mode.

## Verification

- `npm run lint`
- `npm run build`
- Browser check `/billing` and `/billing/payment-settings` at desktop/mobile widths.

## Result

Complete. Billing actions are now separated into clear checkout and payment-settings cards, `Payment settings` is clickable, and `/billing/payment-settings` provides billing contact, payment method, portal, invoice, and support details.
