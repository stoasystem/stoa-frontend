# Unify Student Profile Billing Display Summary

## Status

Complete.

## Changes

- Updated `/profile` so the account billing status and Payment and plan card use the active subscription data for plan/status display.
- Kept parent payer, billing email, payment method, and guardian fields from the student profile context.
- Added a short loading state to avoid flashing stale mock billing values while the subscription request resolves.

## Verification

- `npm run lint`
- `npm run build`
- Browser check on `/profile`; verified Billing status is `Trial`, Plan is `Free trial`, Status is `Trial`, and Next billing date is `Jun 30, 2026`.
