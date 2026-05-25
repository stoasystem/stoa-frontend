# Research: Pitfalls for v1.9 Phase 10

## Payment Pitfalls

- Treating a frontend success redirect as proof of payment. Real subscription state must come from the backend after provider webhooks.
- Asking for card numbers in the STOA frontend during a demo. Demo checkout must be visibly virtual and test-only.
- Exposing payment secrets in `VITE_*` environment variables. All `VITE_*` values are public browser configuration.
- Coupling plan names to provider price IDs in UI code. Keep frontend plans stable and let the backend map plans to provider prices.
- Building cancellation, invoices, coupons, and accounting before validating willingness to pay.

## Subscription Gating Pitfalls

- Relying on route guards or disabled buttons for real quota enforcement.
- Duplicating server subscription state into long-lived local stores.
- Showing locked states without a clear upgrade or contact path.
- Letting feature flags drift from README and `.env.example`.

## UX Pitfalls

- Optimizing pricing before parent value is clear.
- Adding parent upgrade CTAs without explaining learning progress or teacher support value.
- Making tutor request detail visually busy without answering what the tutor should do next.
- Treating P2/P3 polish as equal to P0/P1 launch blockers.

## Admin and Operations Pitfalls

- Expanding admin into a full CRM during launch preparation.
- Building BI dashboards instead of focused usage, feedback, help request, support, billing interest, and system-status views.
- Failing to show backend-pending states clearly where APIs are not ready.
- Omitting role protection for admin-only routes.

## Launch Pitfalls

- Shipping without a rollback plan and new-registration pause plan.
- Launching without monitoring checkout, login, chat, upload, parent report, teacher help, and runtime errors.
- Treating privacy and terms drafts as legal review substitutes.
- Updating launch docs without adding E2E/manual QA checks for the new pricing/billing/virtual checkout path.
