# Research: Stack Additions for v1.9 Phase 10

## Scope

Phase 10 adds pilot iteration, pricing validation, billing/subscription preparation, virtual checkout demos, parent conversion, tutor/admin operations, and launch readiness to the existing React + TypeScript + Vite frontend.

## Recommended Stack Choices

### Billing and Checkout

- Use a STOA backend endpoint as the only real payment boundary: `POST /billing/checkout-session`.
- Prefer Stripe Checkout for real subscription collection once the backend is ready.
- Keep the frontend response shape simple: `{ checkoutUrl: string }`.
- Redirect the browser to the returned hosted checkout URL for real payment flows.
- Do not add Stripe secret keys, card fields, or direct Payment Element handling to the frontend in Phase 10.

Source notes:
- Stripe Checkout Sessions support `mode=subscription` for recurring plans.
- Stripe-hosted Checkout returns a URL that customers use to complete payment.
- Stripe test cards support fake successful and failed payment scenarios for real integration testing once the backend is connected.

Primary references:
- https://docs.stripe.com/api/checkout/sessions/create
- https://docs.stripe.com/payments/checkout/how-checkout-works
- https://docs.stripe.com/testing

### Virtual Payment Demo

Because the real payment backend is not connected yet, add an explicit frontend demo mode:

- `VITE_ENABLE_PAYMENT=false`: payment disabled, show interest/contact paths.
- `VITE_ENABLE_PAYMENT=true` and `VITE_ENABLE_MOCK_CHECKOUT=true`: run a virtual checkout flow inside STOA for demos and E2E tests.
- `VITE_ENABLE_PAYMENT=true` and `VITE_ENABLE_MOCK_CHECKOUT=false`: call `POST /billing/checkout-session` and redirect to `checkoutUrl`.

Suggested routes:

- `/billing`
- `/billing/checkout/demo`
- `/billing/checkout/success`
- `/billing/checkout/cancel`

The virtual checkout route must clearly indicate that it is a demo/test checkout and must never ask for real card numbers.

### Feature Flags

Extend the existing environment pattern in `src/lib/env.ts`:

- `VITE_ENABLE_PAYMENT`
- `VITE_ENABLE_MOCK_CHECKOUT`
- `VITE_ENABLE_PUBLIC_REGISTER`
- `VITE_ENABLE_TEACHER_HELP`
- `VITE_ENABLE_PARENT_REPORT`

### API Services and Hooks

Continue the existing service/hook architecture:

- `src/services/billing/billingApi.ts`
- `src/hooks/billing/useSubscriptionQuery.ts`
- `src/hooks/billing/useCreateCheckoutSessionMutation.ts`
- `src/services/admin/*`
- `src/hooks/admin/*`
- `src/services/tutor/*`
- `src/hooks/tutor/*`

Use TanStack Query for server state and mutations. Use Zustand only for lightweight UI/session state when query state is not appropriate.

## Stack Additions To Avoid

- Do not add a frontend payment SDK unless it is needed for a real backend-integrated Stripe flow.
- Do not add a full CRM/helpdesk package.
- Do not add a data warehouse or A/B testing platform.
- Do not add a direct browser-to-payment-provider secret integration.
- Do not add complex accounting, invoice, coupon, or payroll libraries in Phase 10.
