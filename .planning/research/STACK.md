# Technology Stack Research: STOA Frontend v1.10 Phase 11

**Project:** STOA Frontend  
**Phase focus:** Frontend-only paid launch, growth funnel, mock/demo API support, support tickets, referrals, tutor availability, admin analytics UI, and backend cleanup boundaries  
**Researched:** 2026-05-25  
**Overall confidence:** HIGH for current frontend stack and payment boundary; MEDIUM for optional chart/date additions because implementation depth depends on Phase 11 scope.

## Recommendation

Keep Phase 11 inside the existing React + TypeScript + Vite SPA architecture. Add only two generally justified frontend dependencies: `msw` as a dev/demo mock API layer and `recharts` for lightweight admin analytics charts. Treat `date-fns` as optional, only if tutor availability needs real browser-side date arithmetic beyond simple ISO display.

Do not add a payment SDK, growth SDK, CRM/helpdesk widget, BI embed, calendar scheduling framework, or backend/data-access package. Phase 11 should tighten the STOA frontend contract surface, not turn the SPA into an operations platform.

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React / React DOM | Current repo: `^19.0.0` | UI runtime | Already established. No need to switch to Next.js or Remix for paid-launch UI because STOA is a protected SPA with backend-owned data, auth, billing, and fulfillment. |
| TypeScript | Current repo: `^5.5.0` | Type safety | Required for expanding API contracts across billing, referrals, support, tutor availability, and admin analytics without relying on implicit object shapes. |
| Vite | Current repo: `^6.0.0` | Dev server and production build | Keep fast SPA build. Vite's `VITE_*` rule is important for Phase 11 because frontend env vars are public and must not contain payment, provider, database, or admin secrets. |
| React Router DOM | Current repo: `^7.0.0` | Client routing | Existing declarative `BrowserRouter`, protected routes, and role routes match React Router's current declarative routing model. Do not adopt framework/data-router mode during this phase. |
| Tailwind CSS | Current repo: `^4.3.0` | Styling | Keep current theme/UI foundation. Phase 11 needs dense operational screens, not a new design system. |
| Radix UI + shadcn-style local primitives | Current repo dependencies | Accessible UI primitives | Continue adding local STOA components around existing `src/components/ui/*`. Avoid opaque component suites that fight the current design system. |
| lucide-react | Current repo: `^1.16.0` | Icons | Already used and sufficient for funnel/admin/support/tutor controls. |

### Data, Forms, and State

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TanStack React Query | Current repo: `^5.40.0` | Server state, cache, mutations | Continue one hook per backend resource. Query keys must include variables such as status filters, date ranges, referral code, child ID, tutor ID, and analytics period. |
| Axios through `httpClient` | Current repo: `^1.7.0` | Authenticated API requests | Keep the central interceptor behavior for normal STOA APIs. Use `fetch` only for existing streaming/analytics fire-and-forget cases where Axios is a poor fit. |
| React Hook Form | Current repo: `^7.76.1` | Form state | Use for support tickets, referral capture, tutor availability forms, and admin filters. |
| Zod + `@hookform/resolvers` | Current repo: Zod `^4.4.3`, resolvers `^5.4.0` | Validation | Keep frontend validation schema close to form components and shared request payload types. Backend remains authoritative. |
| Zustand | Current repo: `^5.0.0` | Lightweight client UI/session state | Use only for durable UI state such as selected mock scenario, attribution snapshot, dismissed prompts, or layout preferences. Do not store server-owned support, analytics, billing, referral, or tutor availability data here. |
| Sonner | Current repo: `^2.0.7` | Toast feedback | Keep for support submission, checkout redirect, referral copy, and tutor availability save results. |

### Phase 11 Additions

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| MSW | Latest checked: `2.14.6` | Mock/demo API support | Best fit for frontend-only paid launch demos because it intercepts real network calls instead of branching inside product components. Reuse handlers in local demos and Playwright flows. Install as a dev dependency. |
| Recharts | Latest checked: `3.8.1` | Admin analytics charts | Matches shadcn's chart guidance, supports React 19 peer range, and is enough for line/bar charts over aggregated backend metrics. Use it for trend cards and small operational charts, not deep BI. |
| date-fns | Latest checked: `4.3.0` | Optional date arithmetic | Add only if tutor availability needs browser-side interval/date helpers. For simple display, prefer `Intl.DateTimeFormat` and backend-provided ISO timestamps. |

### Testing and QA

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Playwright | Current repo: `^1.60.0` | E2E smoke and launch regression | Keep as the only browser E2E runner. Phase 11 flows should cover pricing-to-billing, mock checkout, referral attribution, support ticket creation, tutor availability edit, and admin analytics load. |
| ESLint + typescript-eslint | Current repo | Static checks | Existing lint/build gates are sufficient. Add rules only when repeated Phase 11 mistakes appear. |

## Domain Patterns

### Mock/Demo API

Use MSW as the one mock API layer:

- Add `src/mocks/browser.ts`, `src/mocks/handlers.ts`, and scenario fixtures under `src/mocks/scenarios/`.
- Gate startup with `VITE_ENABLE_MOCK_API=true`.
- Optionally select deterministic scenarios with `VITE_MOCK_SCENARIO=paid-launch-happy-path | support-backlog | tutor-capacity-full | admin-empty`.
- Keep product services unaware of whether data is real or mocked. `src/services/*` should call the same `/api` paths in demo and integrated modes.
- Mock backend gaps for paid launch, referrals, support tickets, tutor availability, and admin analytics before backend endpoints exist.
- Do not continue expanding ad hoc `src/data/mock*.ts` files for API-shaped features. Existing static mock data can stay for legacy UI examples, but new Phase 11 API contracts should use MSW handlers.

### Paid Launch and Billing

Keep the Phase 10 billing boundary:

- Real checkout: frontend calls STOA backend `POST /billing/checkout-session`, receives `{ checkoutUrl }`, then redirects.
- Demo checkout: frontend uses explicit virtual checkout routes when `VITE_ENABLE_MOCK_CHECKOUT=true`.
- Subscription UI: read backend-owned subscription status through `GET /billing/subscription`.
- Frontend gating remains advisory. Backend APIs must enforce paid access, quotas, and role permissions.

Do not add `@stripe/stripe-js`, Stripe Elements, card fields, Stripe secret keys, customer portal SDKs, invoice rendering libraries, or direct browser calls to Stripe. Hosted Checkout is intentionally backend-created.

### Growth Funnel and Referrals

Use native browser/router capabilities plus existing analytics:

- Capture `utm_source`, `utm_medium`, `utm_campaign`, `ref`, `plan`, and `source` from `useSearchParams`/`URLSearchParams`.
- Store only a small attribution snapshot in `sessionStorage` or `localStorage` with a timestamp. Avoid long-lived hidden tracking profiles.
- Send attribution with registration, pricing CTA, referral claim, support, and checkout-interest requests through typed STOA API services.
- Add `src/services/growth/growthApi.ts`, `src/services/referrals/referralApi.ts`, `src/hooks/growth/*`, and `src/hooks/referrals/*` only when UI routes need them.
- Continue using `trackEvent()` for low-risk funnel telemetry. Extend the event union with names such as `growth_landing_viewed`, `referral_code_applied`, `referral_invite_copied`, and `paid_launch_cta_clicked`.

Do not add Segment, RudderStack, PostHog, Amplitude, LaunchDarkly, GrowthBook, ad pixels, or A/B testing frameworks in Phase 11. The current stage needs instrumentation discipline, not vendor lock-in.

### Support Tickets

Extend the existing support contract instead of installing helpdesk software:

- Keep `POST /support/requests` for user-created tickets.
- Add typed list/detail/status services only for admin/tutor operations, for example `GET /admin/support-requests`, `GET /admin/support-requests/:id`, and `PATCH /admin/support-requests/:id`.
- Use React Hook Form + Zod for user and admin ticket forms.
- Use TanStack Query invalidation after ticket status changes.
- Keep support payloads privacy-filtered: no passwords, tokens, full chat transcripts, file contents, or payment details.

Do not add Intercom, Zendesk, Crisp, HelpScout widgets, in-app live chat, email clients, or ticket automation engines. They create privacy, operational, and styling obligations before STOA has enough paid-launch volume.

### Tutor Availability

Keep scheduling rules backend-owned:

- Frontend should edit availability windows as ISO timestamp/date payloads plus timezone labels.
- Backend should validate overlap, capacity, tutor assignment, request eligibility, and paid-plan entitlement.
- Use React Hook Form + Zod for add/edit windows.
- Use TanStack Query keys shaped like `['tutor', 'availability', tutorId, { from, to }]`.
- Render simple weekly lists or compact grids with existing UI primitives.
- Use `date-fns` only if manipulating intervals becomes repetitive or error-prone; otherwise use `Intl.DateTimeFormat`.

Do not add FullCalendar, drag-and-drop scheduling boards, calendar sync, video-call scheduling, payroll, timesheets, or resource-planning libraries. Phase 11 needs availability visibility, not a scheduling product.

### Admin Analytics UI

Use aggregated STOA API endpoints plus Recharts:

- Add `src/services/admin/adminAnalyticsApi.ts`, `src/services/admin/adminAnalyticsQueryKeys.ts`, and hooks under `src/hooks/admin/`.
- Prefer backend-shaped resources: `GET /admin/analytics/summary`, `GET /admin/analytics/funnel`, `GET /admin/analytics/referrals`, `GET /admin/analytics/support`, and `GET /admin/analytics/tutor-availability`.
- Render KPI cards first, then small line/bar charts for trends.
- Use Recharts through local chart components so theme, empty states, loading states, and accessibility stay consistent.
- Backend responses should be aggregated and privacy-filtered. The frontend should not build analytics from raw user events, raw chat content, or database exports.

Do not add Metabase/Superset embeds, D3, Chart.js plus wrappers, data-grid enterprise packages, raw event explorers, SQL editors, export-heavy reporting, or client-side BI transformations.

### Backend Cleanup Boundaries

Phase 11 is frontend-only, so backend cleanup should mean contract cleanup at the frontend boundary:

- Consolidate duplicated frontend API clients into `src/services/**` using `httpClient`.
- Move new request/response DTOs into `src/types/**` or colocated service types when scope is narrow.
- Remove frontend-only demo branches once MSW can represent the same backend state.
- Keep SQLite, FastAPI, payment provider code, AI provider code, file scanning, quota enforcement, email delivery, and production data migration outside the frontend phase.
- Use docs or typed service TODOs to flag missing backend endpoints; do not implement backend behavior in the browser.

## Recommended File/Module Layout

```text
src/
  mocks/
    browser.ts
    handlers.ts
    scenarios/
      paidLaunch.ts
      supportTickets.ts
      tutorAvailability.ts
      adminAnalytics.ts
  services/
    growth/
      growthApi.ts
      growthQueryKeys.ts
    referrals/
      referralApi.ts
      referralQueryKeys.ts
    support/
      supportApi.ts
      supportQueryKeys.ts
    tutor/
      tutorAvailabilityApi.ts
      tutorQueryKeys.ts
    admin/
      adminAnalyticsApi.ts
      adminQueryKeys.ts
  hooks/
    growth/
    referrals/
    support/
    tutor/
    admin/
  components/
    admin/analytics/
    growth/
    referrals/
    support/
    tutor/availability/
```

Use the existing service/hook/component/page separation. Avoid route components that fetch directly, forms that hand-roll validation, or components that branch on mock-vs-real data.

## Environment Flags

Add only public, non-secret `VITE_*` flags:

| Variable | Purpose | Default Recommendation |
|----------|---------|------------------------|
| `VITE_ENABLE_MOCK_API` | Starts MSW for local/demo frontend-only mode | `false` |
| `VITE_MOCK_SCENARIO` | Selects deterministic demo API state | unset or `paid-launch-happy-path` locally |
| `VITE_ENABLE_PAYMENT` | Shows billing/checkout entry points | environment-specific |
| `VITE_ENABLE_MOCK_CHECKOUT` | Uses virtual checkout instead of real hosted checkout | `true` locally, `false` production |
| `VITE_ENABLE_REFERRALS` | Shows referral UI | `false` until backend contract/demo handlers exist |
| `VITE_ENABLE_SUPPORT` | Shows support ticket entry points | `true` for launch |
| `VITE_ENABLE_TUTOR_AVAILABILITY` | Shows tutor availability UI | `false` until contract is ready |
| `VITE_ENABLE_ADMIN_ANALYTICS` | Shows admin analytics UI | `false` until aggregate endpoint/demo handler exists |
| `VITE_ENABLE_ANALYTICS` | Sends sanitized analytics events | environment-specific |

Vite exposes `VITE_*` values to browser code, so these flags must never contain secrets, API keys, webhook secrets, database URLs, model-provider keys, or payment-provider secret keys.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Mock API | MSW | More `src/data/mock*.ts` files | Static data bypasses real network/error states and makes frontend-only demos diverge from backend contracts. |
| Mock API | MSW | Local-only mock backend expansion | Phase 11 is frontend-only. A backend mock server increases scope and still requires endpoint maintenance. |
| Admin charts | Recharts | D3 | D3 is too low-level for small operational dashboards and would increase chart ownership. |
| Admin charts | Recharts | Chart.js/react-chartjs-2 | Works, but shadcn chart guidance already aligns with Recharts and local primitives. |
| Tutor availability | Native UI + optional date-fns | FullCalendar | Too much scheduling product surface for simple availability windows. |
| Growth/referrals | Existing analytics + typed STOA APIs | Segment/PostHog/Amplitude | Premature vendor lock-in and privacy review overhead for early paid launch. |
| Feature flags | `src/lib/env.ts` booleans | LaunchDarkly/GrowthBook | Remote flag platforms are unnecessary before STOA has multiple environments, operators, and experiment volume. |
| Support | STOA support API + admin UI | Zendesk/Intercom widget | Adds privacy, styling, account, and vendor workflow obligations before ticket volume justifies it. |
| Payment | Backend-created Stripe Checkout URL | Stripe Elements / frontend card entry | Direct card UI increases PCI/security surface and conflicts with the existing hosted checkout direction. |
| Data layer | REST + Axios + TanStack Query | GraphQL/tRPC/OpenAPI generator | Current contracts are still evolving. Manual typed services are clearer until backend contracts stabilize. |
| State | TanStack Query for server data | Zustand for server data | Duplicates cache ownership and creates stale paid-access/support/admin state. |

## Installation

Recommended Phase 11 additions:

```bash
npm install recharts
npm install -D msw
```

Conditional only if tutor availability needs browser-side date math:

```bash
npm install date-fns
```

Do not install in Phase 11:

```bash
# Not recommended now
npm install @stripe/stripe-js
npm install @fullcalendar/react
npm install posthog-js @growthbook/growthbook-react
npm install @sentry/react
```

Notes:
- Sentry-like monitoring remains a later vendor decision unless production incidents require it now.
- If installing MSW, initialize the service worker through the supported MSW CLI workflow and commit the worker only if the chosen MSW setup requires it for local/demo operation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Existing stack fit | HIGH | Confirmed from `package.json`, `.planning/PROJECT.md`, and current `src/` service/hook/router structure. |
| MSW recommendation | HIGH | Official docs describe network-level mocks reusable across development, tests, and demos; this directly fits frontend-only mock/demo API needs. |
| Recharts recommendation | HIGH | Official Recharts docs and shadcn chart docs align with STOA's local UI primitive approach. |
| date-fns recommendation | MEDIUM | Useful if availability date math grows; not needed for simple ISO display. |
| Avoided vendor tools | HIGH | Current milestone is early paid launch and frontend-only; adding vendors would expand privacy, security, billing, and operations scope. |

## Sources

- Project context: `.planning/PROJECT.md` and current `src/` structure, read 2026-05-25.
- Vite env variables and public `VITE_*` behavior: https://vite.dev/guide/env-and-mode/
- React Router declarative routing docs: https://reactrouter.com/start/declarative/routing
- TanStack Query query-key guidance: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
- Stripe Checkout hosted/session model: https://docs.stripe.com/payments/checkout and https://docs.stripe.com/payments/checkout/how-checkout-works
- MSW official site/docs: https://mswjs.io/
- Recharts guide: https://recharts.github.io/en-US/guide/getting-started/
- shadcn chart docs using Recharts: https://ui.shadcn.com/docs/components/chart
- date-fns official site: https://date-fns.org/
- npm registry latest checks on 2026-05-25: `msw@2.14.6`, `recharts@3.8.1`, `date-fns@4.3.0`
