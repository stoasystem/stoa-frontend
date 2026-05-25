# Subscription access UI

Phase 11 implements advisory frontend states only.

## Contract endpoints

- `GET /billing/plans`
- `GET /billing/subscription`
- `GET /billing/usage`
- `GET /billing/feature-access`
- `POST /billing/checkout-session`

## Frontend responsibilities

- Show current plan and subscription status.
- Show usage quota.
- Show locked states and upgrade prompts.
- Route plan CTAs to hosted or mock checkout.

## Backend responsibilities

- Enforce message, upload, teacher-help, and parent-report access.
- Own payment secrets, checkout sessions, webhooks, and final subscription state.
