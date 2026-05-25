# Checkout flow contract

The frontend never handles card data directly.

1. User selects a plan on `/pricing` or `/billing`.
2. Frontend calls `POST /billing/checkout-session` with `{ "plan": "family" }` and optional whitelisted UTM metadata.
3. Backend returns `{ "checkoutUrl": "https://..." }`.
4. Frontend redirects to `checkoutUrl`.
5. Hosted checkout handles payment.
6. Future backend webhook updates subscription state.
7. Frontend reads subscription via `GET /billing/subscription`.

Phase 11 can use `/billing/checkout/demo` to simulate success and cancellation states.
