# Research Summary: v1.10 Phase 11

## Stack Additions

- Keep React, TypeScript, Vite, React Router, TanStack Query, Axios `httpClient`, Tailwind, local UI primitives, Zod, React Hook Form, Zustand for limited UI/session state, and Playwright.
- Recommended optional additions:
  - `msw` for frontend-only mock/demo API support.
  - `recharts` for lightweight admin operational analytics charts.
  - `date-fns` only if tutor availability date math becomes non-trivial.
- Avoid Stripe frontend SDKs, CRM/helpdesk widgets, BI embeds, FullCalendar, GraphQL/tRPC, backend/data packages, growth SDKs, and A/B testing platforms.

## Feature Table Stakes

- Billing plans, subscription status, usage quota, feature access, checkout session, and manage-billing placeholder contracts.
- Usage quota UI, locked feature cards, upgrade prompts, and advisory feature gates.
- Parent acquisition pages: parents, how it works, AI homework help, teacher support, schools, and tutoring centers.
- Referral/invitation page, referral code capture, invite link copy, and register/checkout attribution.
- Tutor availability and subject editor.
- User support ticket list/detail/create and admin support triage.
- Admin operational analytics dashboard for usage, conversion, billing, support, tutor capacity, and retention placeholders.
- UTM capture utility and paid launch analytics taxonomy.
- Demo/mock API strategy and explicit cleanup/isolation of previous demo backend/database complexity.

## Architecture Guidance

Use the existing shape:

```text
Route/Page -> Feature Components -> Hooks -> Services -> httpClient or demo/mock adapter
```

- TanStack Query owns server/demo state.
- Services define typed API contracts.
- Pages compose components and avoid direct API/mocking logic.
- `src/lib/env.ts` owns public feature flags.
- `src/lib/utm.ts` or attribution utilities own UTM/referral persistence.
- Mock/demo behavior should live behind services or MSW handlers, not inside product components.

## Backend Boundary

Phase 11 must keep backend-like work explicitly demo/test-only:

- No formal backend implementation.
- No production database design.
- No real payment webhook.
- No real subscription enforcement.
- No production analytics backend.
- No complex support/admin backend.
- Any existing FastAPI/SQLite code remains local demo/test infrastructure.

## Suggested Phase Slices

1. Demo API boundary, UTM, analytics taxonomy, and backend cleanup docs.
2. Billing plans, usage quotas, feature gates, and mock checkout contract.
3. Parent acquisition and referral/invitation flow.
4. Tutor availability and support ticket UI.
5. Admin operational analytics and support operations UI.
6. Docs, demo QA, E2E, and final verification.

## Watch Outs

- Do not imply production payment, analytics, support, subscription, or database capabilities.
- Do not record sensitive learning, file, payment, or support content in analytics.
- Do not duplicate mock logic between components, services, backend, and tests.
- Keep all routes and CTA flows demoable without formal backend readiness.
