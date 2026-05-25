# Research: Pitfalls for v1.10 Phase 11

## Scope Creep Pitfalls

- Turning Phase 11 into a real backend milestone. This milestone is frontend-only; backend work must remain API contracts, mock/demo adapters, or local test support.
- Expanding FastAPI/SQLite into billing, support, analytics, referral, or scheduling production infrastructure.
- Adding Stripe SDKs, card forms, webhook handlers, invoice systems, CRM tools, BI embeds, or calendar platforms before product validation.
- Treating frontend feature gates as real access control. They are advisory UI only.

## Mock and Demo Pitfalls

- Writing mock data directly inside page components, which makes later real API integration harder.
- Keeping multiple mock mechanisms for the same contract. Prefer a single mock/demo API strategy.
- Letting mock checkout routes be reachable in production-like environments unless explicitly enabled.
- Persisting demo state in a way that makes tests order-dependent.

## Growth and Attribution Pitfalls

- Capturing arbitrary query params instead of a strict UTM/referral allowlist.
- Losing UTM/referral state between landing, register, pricing, and checkout.
- Storing sensitive tokens, passwords, payment data, chat content, support bodies, or file contents in analytics.
- Adding ad pixels or growth SDKs before privacy and consent policy are ready.

## UI and Operations Pitfalls

- Building parent acquisition pages as generic marketing pages instead of clear product flows with one CTA.
- Adding support-ticket UI without status, list/detail, and admin triage states.
- Building admin analytics from raw events in the browser instead of aggregated backend-shaped contracts.
- Implementing tutor scheduling logic in the frontend instead of showing availability and letting backend future logic enforce matching/capacity.

## Verification Pitfalls

- E2E tests depending on real backend endpoints for frontend-only features.
- Missing tests for referral code capture, UTM persistence, mock checkout, support ticket creation, tutor availability save, and admin analytics rendering.
- Documentation claiming production backend or database capabilities that do not exist.
