# Research: Architecture Integration for v1.9 Phase 10

## Existing Architecture Fit

Phase 10 should extend existing patterns:

- Routes live under `src/pages/**` and are wired through `src/app/router/AppRouter.tsx`.
- Server API calls live under `src/services/**`.
- Query and mutation wrappers live under `src/hooks/**`.
- Shared UI cards and controls live under `src/components/**`.
- Environment flags are centralized in `src/lib/env.ts`.
- Role protection uses existing protected/role route components.

## Billing Data Flow

Real payment path:

1. User selects a plan from `/pricing` or `/billing`.
2. Frontend calls `POST /billing/checkout-session` with `{ plan }`.
3. Backend creates a hosted checkout session.
4. Frontend redirects to `checkoutUrl`.
5. Payment provider handles card/payment details.
6. Backend receives payment webhooks and stores subscription status.
7. Frontend reads subscription through `GET /billing/subscription`.

Virtual demo path:

1. User selects a plan while mock checkout is enabled.
2. Frontend navigates to `/billing/checkout/demo?plan=...`.
3. Demo checkout displays plan, trial/payment copy, and test-only controls.
4. User completes or cancels the demo.
5. Success/cancel pages show expected post-checkout UI.
6. E2E tests assert the complete frontend flow without a payment backend.

## Subscription Gating

Frontend responsibilities:

- Show current plan and status.
- Show locked states and upgrade prompts.
- Hide or disable unavailable actions when feature flags say so.
- Track conversion events.

Backend responsibilities:

- Enforce message quotas.
- Enforce upload quotas.
- Enforce teacher-help quotas.
- Enforce parent-report access.
- Persist subscription status.

## Admin Architecture

Minimum Phase 10 admin routes:

- `/admin/usage`
- `/admin/feedback`
- `/admin/help-requests`

Additional shells:

- `/admin/users`
- `/admin/support`
- `/admin/billing-interest`
- `/admin/system`

Each route should use typed service contracts and clear backend-pending placeholders where the backend is not ready.

## Tutor Architecture

Tutor operations should extend existing tutor services and pages:

- Help request list with priority/status clarity.
- Request detail with conversation context and student question emphasis.
- Required resolution note validation.
- Tutor stats query for pending/resolved/average response time.

## Documentation Architecture

Add or update:

- `docs/pilot/pilot-review.md`
- `docs/pricing/pricing-validation.md`
- `docs/pricing/subscription-model.md`
- `docs/launch/launch-checklist.md`
- `docs/launch/release-process.md`
- `docs/launch/rollback-plan.md`
- `docs/launch/post-launch-monitoring.md`

Keep production database, payment webhooks, and true subscription enforcement documented as backend-owned boundaries.
