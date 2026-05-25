# Research Summary: v1.9 Phase 10

## Stack Additions

- Continue existing React, TypeScript, Vite, TanStack Query, Axios/httpClient, and role-route architecture.
- Add billing services/hooks and subscription UI without adding direct card handling.
- Prefer Stripe Checkout for real payment provider direction because it supports hosted subscription checkout and keeps payment details outside the STOA frontend.
- Add explicit virtual checkout mode so the frontend can demo and test pricing-to-billing flows before the real backend payment integration exists.

## Feature Table Stakes

- Pilot feedback review and P0/P1 launch blocker tracking.
- Student, Parent, and Tutor UX iteration based on pilot evidence.
- Pricing page with clear tiers and conversion CTAs.
- Billing page with subscription summary, status badge, upgrade path, and support path.
- Billing API contract for checkout session and subscription status.
- Feature flags for payment, mock checkout, registration, teacher help, and parent reports.
- Parent conversion funnel and analytics events.
- Admin usage, feedback, help requests, support, billing interest, users, and system route shells.
- Tutor operations metrics and required resolution notes.
- Launch-ready privacy/terms, release process, rollback plan, post-launch monitoring, launch checklist, README, E2E, and manual QA.

## Key Architectural Decision

Real payment flow:

Frontend selects plan -> backend creates checkout session -> frontend redirects to hosted checkout -> backend receives webhook -> frontend reads subscription status.

Demo payment flow:

Frontend selects plan -> virtual checkout route -> demo success/cancel route -> subscription/status UI can be verified without real backend payment infrastructure.

## Watch Out For

- Never treat frontend success redirects as authoritative subscription proof.
- Never collect real card details in the frontend.
- Keep real access enforcement in backend APIs.
- Keep payment feature flags and docs synchronized.
- Preserve launch scope: no full CRM, accounting, coupon system, payroll, school multi-tenant platform, or growth campaign platform in Phase 10.

## Source Notes

- Stripe Checkout Sessions support subscription mode for recurring billing: https://docs.stripe.com/api/checkout/sessions/create
- Stripe Checkout uses hosted payment pages reached through a checkout session URL: https://docs.stripe.com/payments/checkout/how-checkout-works
- Stripe test cards support fake successful and failed card scenarios for integration testing: https://docs.stripe.com/testing
