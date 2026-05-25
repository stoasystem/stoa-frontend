# Architecture Patterns

**Project:** STOA Frontend v1.10 Phase 11
**Domain:** Frontend-only paid launch, growth funnel, operational UI, and demo/mock API boundaries
**Researched:** 2026-05-25
**Overall confidence:** HIGH for repo architecture fit; MEDIUM for future backend endpoint naming because formal backend contracts are not yet owned here.

## Executive Recommendation

Phase 11 should extend the existing React/TanStack Query/service/router architecture, not introduce a new app architecture. The current repo already has the correct shape: `src/app/router/AppRouter.tsx` owns route registration, `src/services/**` owns typed API functions, `src/hooks/**` wraps TanStack Query, pages compose feature components, and `src/lib/env.ts` centralizes public runtime flags.

Use that shape for all paid launch features:

```text
Route/Page -> Feature Components -> Query/Mutation Hooks -> Typed Service -> httpClient or demo adapter
```

React Router should remain responsible for URL and layout boundaries. TanStack Query should remain responsible for remote/demo server state, cache invalidation, background refetching, and mutation state. Zustand should remain limited to app/session UI state such as auth token hydration and sidebar state; do not move billing, tickets, referrals, tutor availability, or admin analytics into Zustand.

The most important architectural boundary is frontend-only scope. Prior FastAPI/SQLite work is valuable local test infrastructure, but Phase 11 should not grow it into a real billing/support/referral/analytics backend. New paid-launch data should be represented as typed frontend API contracts plus deterministic mock/demo responses. If actual HTTP mocking becomes necessary for Playwright or local demos, prefer an isolated mock adapter or MSW-style network mock over adding new SQLite tables and backend routes.

## Current Architecture Fit

| Existing Area | Current Pattern | Phase 11 Use |
| --- | --- | --- |
| Routing | `BrowserRouter`, nested `ProtectedRoute`, `RoleRoute`, pages under `src/pages/**` | Add public growth routes, protected billing/referral/support routes, tutor availability, and admin operations routes in `AppRouter` |
| Services | Typed functions under `src/services/*/*Api.ts` using `httpClient` | Add domain services for billing plans/usage/access, referrals, support tickets, tutor availability, and admin analytics |
| Query hooks | `src/hooks/**` wraps `useQuery`/`useMutation` | Add one query-key factory per domain and invalidate related keys after mutations |
| Layouts | `MarketingLayout`, `DashboardLayout`, `AppLayout` | Use `MarketingLayout` for acquisition pages; use `DashboardLayout` for authenticated operational pages |
| Analytics | `trackEvent()` with sanitized payloads and non-blocking delivery | Extend event union for paid launch, UTM, referral, checkout, support-ticket, and tutor-availability events |
| Environment flags | `src/lib/env.ts` | Add explicit flags for demo API/mock paid launch behavior if needed |
| Demo backend | `backend/app` FastAPI + SQLite for local test/demo flows | Freeze as local test backend; do not treat as formal backend architecture |

## Recommended Architecture

```text
src/
  app/
    router/
      AppRouter.tsx
      ProtectedRoute.tsx
      RoleRoute.tsx
  components/
    billing/
    growth/
    referrals/
    support/
    tutor/
    admin/
  hooks/
    billing/
    referrals/
    support/
    tutor/
    admin/
  services/
    api/
      httpClient.ts
    billing/
      billingApi.ts
      billingQueryKeys.ts
      billingDemoData.ts
    referrals/
      referralApi.ts
      referralQueryKeys.ts
      referralDemoData.ts
    support/
      supportApi.ts
      supportQueryKeys.ts
      supportDemoData.ts
    tutor/
      tutorApi.ts
      tutorQueryKeys.ts
      tutorDemoData.ts
    admin/
      adminApi.ts
      adminQueryKeys.ts
      adminDemoData.ts
    analytics/
      analyticsClient.ts
      attribution.ts
  types/
    billing.ts
    referral.ts
    support.ts
    analytics.ts
```

The exact filenames can follow existing naming, but the boundary should stay consistent:

- `types/*` contains reusable DTO and UI-safe domain types.
- `services/*/*Api.ts` contains endpoint functions and any mock/demo adapter switch.
- `services/*/*QueryKeys.ts` contains key factories.
- `hooks/*` contains TanStack Query wrappers and invalidation behavior.
- `components/*` contains reusable UI.
- `pages/*` contains route-level composition only.

## Component Boundaries

| Component Boundary | Responsibility | Communicates With |
| --- | --- | --- |
| Growth/marketing pages | Public acquisition copy, role-specific CTAs, UTM capture trigger points | `MarketingLayout`, analytics/attribution service, register/checkout routes |
| Billing domain | Plans, subscription state, usage quotas, feature access, checkout/portal actions | Billing service, billing hooks, feature gates, analytics |
| Feature access UI | Locked states, quota meters, upgrade prompts, CTA routing | Billing hooks and plan metadata |
| Referral domain | Invite link display, copy action, referral code capture, register payload propagation | Referral service, attribution service, auth register mutation |
| Tutor availability | Tutor subjects, weekly availability blocks, availability status, save mutation | Tutor service/query keys, tutor dashboard nav |
| Support ticket domain | Ticket list/detail/create/status update surfaces for users and admins | Support service/query keys, admin routes |
| Admin analytics | Operational overview across usage, conversion, billing, referrals, support, tutor operations | Admin service/query keys, analytics DTOs, demo data |
| Demo/mock adapter | Deterministic frontend-only responses for Phase 11 contracts | Services only; never imported by pages directly |

## Data Flow

### Read Flow

```text
Page mounts
  -> hook calls useQuery(queryKey, service function)
  -> service calls httpClient or demo adapter
  -> component renders loading/error/empty/success state
```

### Mutation Flow

```text
User submits form/action
  -> hook calls useMutation
  -> service posts/patches through httpClient or demo adapter
  -> onSuccess invalidates the smallest related query-key prefix
  -> toast/inline state confirms result
  -> analytics event records metadata only
```

### Attribution Flow

```text
Public page load with query string
  -> attribution utility reads whitelisted URLSearchParams
  -> store first-touch and latest-touch attribution with TTL
  -> include attribution metadata in register, referral, checkout, and analytics payloads
```

Use browser `URLSearchParams` for parsing campaign parameters and Web Storage for short-lived attribution persistence. Store only whitelisted keys such as `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `ref`, `referral_code`, and `landing_page`. Do not persist arbitrary query strings.

## Billing Plans, Usage, and Feature Access

### Recommended Contract Shape

Move toward a billing type model that distinguishes:

- **Plan catalog**: what can be purchased or shown publicly.
- **Subscription state**: what the current account has.
- **Usage quotas**: how much of a limited feature has been consumed.
- **Feature access**: what the UI should show as available, locked, or upgradeable.

Recommended service functions:

```typescript
getBillingPlans(): Promise<{ items: BillingPlan[] }>
getSubscription(): Promise<Subscription>
getBillingUsage(): Promise<BillingUsageSummary>
getFeatureAccess(): Promise<FeatureAccessSummary>
createCheckoutSession(payload): Promise<{ checkoutUrl: string }>
createBillingPortalSession(): Promise<{ portalUrl: string }>
```

Recommended query keys:

```typescript
billingQueryKeys = {
  all: ['billing'],
  plans: () => ['billing', 'plans'],
  subscription: () => ['billing', 'subscription'],
  usage: () => ['billing', 'usage'],
  featureAccess: () => ['billing', 'feature-access'],
}
```

### UI Pattern

Use these reusable components:

- `PlanCard`: catalog display and CTA.
- `BillingSummaryCard`: current plan/status.
- `UsageQuotaCard`: quota limit/used/remaining for AI messages, uploads, parent reports, teacher help.
- `FeatureGate`: wraps feature entry points and renders either children, locked state, or upgrade prompt.
- `ManageBillingButton`: calls a backend/demo portal-session endpoint, not Stripe directly.

### Enforcement Boundary

Frontend gating is advisory UX. Backend APIs must eventually enforce message quota, upload quota, teacher-help quota, parent-report access, billing status, and role authorization. Phase 11 should make locked/usage states demonstrable, but it must not imply real subscription enforcement exists.

### Checkout Boundary

Real checkout should remain backend-created hosted checkout. The frontend selects a plan, sends plan and attribution metadata to the backend, receives a `checkoutUrl`, and redirects. The browser must not handle card data or payment secrets. Virtual checkout remains an explicit demo route, gated by environment flags.

## Landing Pages and Growth Funnel

Add public routes under `MarketingLayout`:

| Route | Purpose | Primary CTA |
| --- | --- | --- |
| `/parents` | Parent acquisition landing page | Register or pricing |
| `/how-it-works` | Explain student-AI-tutor-parent loop | Start trial |
| `/ai-homework-help` | SEO/product page for AI help | Try chat/register |
| `/teacher-support` | Premium tutor-support explanation | Tutor-supported plan |
| `/schools` | Lightweight B2B/school interest page | Contact/support ticket |
| `/tutoring-centers` | Partner/tutoring center interest page | Contact/support ticket |

Keep these pages content/data driven. Use a shared `growthPageContent.ts` or equivalent so cards, proof points, FAQs, and CTAs can be iterated without duplicating layouts.

Do not add a CMS, routing framework migration, or server-rendered SEO architecture in Phase 11. The milestone goal is credible frontend launch surfaces, not production content infrastructure.

## Referrals and Invitations

### Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/referrals` | Protected student/parent | Show invite link, referral code, copy CTA, referral status |
| `/invite/:code` | Public | Capture referral code, store attribution, route user to register/pricing |
| `/register?ref=...` | Public | Prefill/attach referral metadata to register payload |

### Data Model

```typescript
type ReferralSummary = {
  code: string
  inviteUrl: string
  invitedCount: number
  activatedCount: number
  rewardStatus: 'none' | 'pending' | 'earned'
}

type ReferralAttribution = {
  referralCode: string
  capturedAt: string
  landingPath: string
}
```

### Pattern

Referral capture belongs in a small attribution/referral utility, not in page-local state. Registration and checkout mutations should read the stored referral attribution and include it as optional metadata. This keeps referral propagation consistent across `/invite/:code`, public landing pages, registration, and checkout.

## Tutor Availability

Tutor availability should extend the existing tutor domain rather than create a separate scheduling subsystem.

Recommended routes:

- `/tutor/availability`
- Optional admin overview under `/admin/tutors` or `/admin/tutor-availability` only if needed for operations.

Recommended service functions:

```typescript
getTutorAvailability(): Promise<TutorAvailability>
updateTutorAvailability(payload): Promise<TutorAvailability>
getTutorSubjects(): Promise<{ items: TutorSubject[] }>
updateTutorSubjects(payload): Promise<{ items: TutorSubject[] }>
```

Recommended data shape:

```typescript
type TutorAvailability = {
  timezone: string
  weeklyBlocks: Array<{
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
    startTime: string
    endTime: string
    available: boolean
  }>
  acceptingRequests: boolean
  updatedAt?: string
}
```

Use TanStack Query invalidation after availability saves:

- Invalidate `tutorQueryKeys.availability()`.
- Invalidate admin tutor availability/operations summaries if those pages read the same operational signal.

Do not build live scheduling, calendar sync, payments per tutor, SLA assignment logic, or multi-person chat in Phase 11. The UI should show availability and subject coverage for demos and future backend contracts.

## Support Tickets

The existing `POST /support/requests` flow is a good seed, but Phase 11 needs ticket lifecycle UI.

Recommended user routes:

- `/support`
- `/support/tickets`
- `/support/tickets/new`
- `/support/tickets/:ticketId`

Recommended admin routes:

- `/admin/support`
- `/admin/support/:ticketId`

Recommended service functions:

```typescript
getSupportTickets(filters): Promise<{ items: SupportTicketSummary[] }>
getSupportTicket(ticketId): Promise<SupportTicketDetail>
createSupportTicket(payload): Promise<SupportTicketDetail>
addSupportTicketComment(payload): Promise<SupportTicketDetail>
updateSupportTicketStatus(payload): Promise<SupportTicketDetail>
```

Recommended query keys:

```typescript
supportQueryKeys = {
  all: ['support'],
  tickets: (filters) => ['support', 'tickets', filters],
  ticket: (ticketId) => ['support', 'tickets', ticketId],
}
```

Admin status/comment mutations should invalidate both support ticket detail and relevant list keys. User comments should not expose internal admin notes unless the DTO explicitly separates public and internal comments.

Telemetry and support payloads must keep the existing privacy rule: no passwords, tokens, full chat transcripts, file contents, or unnecessary child data.

## Admin Operational Analytics

Admin analytics should be an operational dashboard, not a BI platform. Keep it query-driven and backed by typed summary DTOs.

Recommended routes:

| Route | Purpose |
| --- | --- |
| `/admin/analytics` | Cross-domain operational overview |
| `/admin/analytics/conversion` | Landing, registration, pricing, checkout funnel |
| `/admin/billing-interest` | Existing billing interest shell, upgraded to list/summary |
| `/admin/support` | Ticket queue and status overview |
| `/admin/referrals` | Referral usage and activation overview |
| `/admin/tutors` | Tutor availability/coverage and help-request load |

Recommended service functions:

```typescript
getAdminAnalyticsOverview(): Promise<AdminAnalyticsOverview>
getAdminConversionFunnel(): Promise<AdminConversionFunnel>
getAdminBillingOverview(): Promise<AdminBillingOverview>
getAdminSupportOverview(): Promise<AdminSupportOverview>
getAdminReferralOverview(): Promise<AdminReferralOverview>
getAdminTutorOperationsOverview(): Promise<AdminTutorOperationsOverview>
```

Keep charts simple and resilient: cards, tables, trend rows, and empty/backend-pending states are enough. Avoid adding a charting dependency unless a later phase specifically needs it.

## UTM Capture and Paid Launch Analytics

Add an attribution utility near analytics:

```text
src/services/analytics/attribution.ts
```

Responsibilities:

- Parse whitelisted UTM/referral keys from `window.location.search`.
- Store first-touch and latest-touch attribution with a TTL.
- Expose `getAttributionMetadata()` for register, checkout, referral, and support flows.
- Clear or refresh expired attribution.
- Avoid arbitrary payload capture.

Recommended event additions:

- `growth_landing_viewed`
- `growth_cta_clicked`
- `utm_captured`
- `referral_invite_copied`
- `referral_code_captured`
- `register_started`
- `checkout_plan_selected`
- `checkout_portal_opened`
- `feature_gate_viewed`
- `feature_gate_upgrade_clicked`
- `usage_quota_viewed`
- `support_ticket_created`
- `support_ticket_status_updated`
- `tutor_availability_updated`
- `admin_analytics_viewed`

Payload rules should reuse the existing `sanitizeAnalyticsPayload()` approach: identifiers, roles, plan IDs, route names, status values, booleans, counts, and short campaign values are acceptable; free-form support content, chat content, file names, and private tutor notes are not.

## Demo Backend and Mock Data Boundary

### Dedicated Cleanup/Isolation Recommendation

Treat the current `backend/` directory as local functional-test infrastructure only. It should be described as a demo backend, not STOA's backend architecture.

Phase 11 should not add formal billing, referral, support-ticket, tutor-availability, or admin-analytics persistence to SQLite. Doing so would blur the project boundary and create migration pressure from a prototype database that was never designed for production.

Recommended cleanup/isolation plan:

1. **Freeze backend purpose:** Keep `backend/app` focused on existing local auth/chat/parent/tutor demo flows needed by current E2E.
2. **Name the boundary clearly:** Use docs and comments naming it "local demo backend" or "test backend"; avoid "production", "real backend", or schema ownership language.
3. **Move new demo data to frontend-owned mocks:** Put Phase 11 mutable demo state in TypeScript fixtures or a small demo adapter under `src/services/*/*DemoData.ts`.
4. **Do not expand SQLite schema for paid launch:** Billing plans, usage, referrals, availability, tickets, and admin analytics can be deterministic mock responses for Phase 11.
5. **Keep services stable:** Pages and hooks call the same service functions regardless of real or demo mode.
6. **Gate demo behavior:** Use explicit environment flags such as `VITE_ENABLE_DEMO_API` or existing mock checkout flags.
7. **Make mock state resettable:** Provide fixture-level reset helpers for tests instead of database reset scripts for new Phase 11 surfaces.
8. **Document production ownership:** Real payment webhooks, subscriptions, ticket storage, referral attribution, tutor scheduling, analytics pipelines, and databases are backend/platform concerns outside this frontend repo.

### Preferred Demo Adapter Pattern

```typescript
export async function getBillingUsage() {
  if (enableDemoPaidLaunchApi) {
    return getDemoBillingUsage()
  }

  const response = await httpClient.get<BillingUsageSummary>('/billing/usage')
  return response.data
}
```

This keeps page and hook code stable while making demo behavior explicit.

### When to Use MSW

If Phase 11 needs browser-level API mocking shared across local development and Playwright, add MSW in a later implementation phase and keep handlers under `src/mocks/handlers.ts`. MSW is a good fit because it intercepts real network requests and can reuse mock definitions across development and testing. Do not add MSW just for static page content; service-level fixtures are simpler for narrow Phase 11 demo surfaces.

## Patterns to Follow

### Pattern 1: Domain Query-Key Factories

**What:** Each domain owns its query-key factory.

```typescript
export const billingQueryKeys = {
  all: ['billing'] as const,
  plans: () => [...billingQueryKeys.all, 'plans'] as const,
  subscription: () => [...billingQueryKeys.all, 'subscription'] as const,
  usage: () => [...billingQueryKeys.all, 'usage'] as const,
}
```

**Why:** TanStack Query cache invalidation works best when keys are structured, serializable, and stable.

### Pattern 2: Mutations Invalidate Related Domain Keys

**What:** On mutation success, invalidate specific lists/details and any aggregate summaries.

```typescript
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: supportQueryKeys.all })
  await queryClient.invalidateQueries({ queryKey: adminQueryKeys.supportOverview() })
}
```

**Why:** This matches the existing tutor mutation pattern and avoids duplicating server/demo state into global stores.

### Pattern 3: Advisory Feature Gates

**What:** Use feature access data to render locked states and upgrade prompts.

```typescript
<FeatureGate feature="teacher_help" fallback={<UpgradePromptCard plan="tutor_supported" />}>
  <TeacherEscalationCard />
</FeatureGate>
```

**Why:** Users need clear plan-based UX now, while true enforcement remains backend-owned.

### Pattern 4: Public Funnel Pages Are Data-Driven

**What:** Use shared content objects for landing pages and compose common growth components.

**Why:** Phase 11 needs several acquisition pages; duplicating page markup will slow copy iteration and create inconsistent CTAs.

### Pattern 5: Attribution Is a Utility, Not Page State

**What:** Capture UTM/referral metadata once, store sanitized whitelisted values, and expose helper functions.

**Why:** Register, checkout, referral, and analytics flows all need the same attribution metadata.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Growing `backend/` Into the Real Backend

**What:** Adding billing, referrals, tickets, analytics, tutor availability, and database schemas to FastAPI/SQLite as if they were production architecture.

**Why bad:** It violates Phase 11 frontend-only scope, creates false confidence in unsupported persistence, and will cause rewrite churn when the formal backend exists.

**Instead:** Use typed contracts and frontend-owned demo adapters. Keep `backend/` as local demo/test support.

### Anti-Pattern 2: Putting Server State in Zustand

**What:** Storing billing usage, tickets, referral stats, tutor availability, or admin analytics in global client stores.

**Why bad:** It bypasses cache invalidation, refetching, loading/error states, and existing service boundaries.

**Instead:** Use TanStack Query hooks with domain query keys.

### Anti-Pattern 3: Direct Stripe or Payment Secret Handling in React

**What:** Handling card data, secret keys, webhook-like logic, or subscription truth in the frontend.

**Why bad:** Payment details and authoritative subscription state belong to hosted payment pages and backend/webhook processing.

**Instead:** Frontend requests a checkout/portal URL and redirects.

### Anti-Pattern 4: Analytics Payload Overcollection

**What:** Sending support messages, chat content, tutor notes, file names, or raw URL query strings in analytics events.

**Why bad:** It creates privacy and compliance risk for an education product.

**Instead:** Send sanitized metadata only.

### Anti-Pattern 5: Route Loader Migration During Phase 11

**What:** Migrating from current declarative routes plus TanStack Query to React Router data loaders/actions for this milestone.

**Why bad:** It adds architecture churn while server state is already organized through TanStack Query.

**Instead:** Keep `BrowserRouter`/`Routes` and add route entries. Reconsider data routers only in a separate architecture phase.

## Scalability Considerations

| Concern | Phase 11 Demo | First Paid Launch | Later Scale |
| --- | --- | --- | --- |
| Billing truth | Mock/demo subscription and usage DTOs | Backend subscription endpoints and hosted checkout | Provider webhooks, invoices, taxes, entitlements service |
| Feature access | Advisory gates and quota display | Backend-enforced quota responses plus frontend display | Central entitlement system and audit trail |
| Growth pages | Static React pages | Static pages plus analytics attribution | CMS/SEO/experimentation only if growth needs justify it |
| Referrals | Local/demo referral summaries and code capture | Backend invitation/referral records | Fraud prevention, reward accounting, lifecycle emails |
| Tutor availability | Tutor self-serve schedule UI and demo save | Backend availability records | Scheduling, calendar sync, assignment optimization |
| Support tickets | Mock/demo ticket queue | Backend ticket storage and admin workflow | Helpdesk/CRM integration, SLA reporting |
| Admin analytics | Aggregated demo summaries | Backend operational summary endpoints | Warehouse/BI tool, event pipeline, role-based exports |
| Demo backend | Existing local test backend | Still local-only | Remove or keep only as dev fixture after real backend stabilizes |

## Roadmap Implications

Recommended implementation ordering:

1. **Boundary and demo adapter foundation**
   - Add explicit demo/mock boundary before building new paid-launch surfaces.
   - Prevents accidental FastAPI/SQLite expansion.

2. **Billing plans, usage, and feature access**
   - Feature gates and upgrade prompts are dependencies for landing CTAs, parent conversion, and admin billing views.

3. **UTM and referral capture**
   - Attribution should exist before registration, checkout, and landing CTAs are instrumented.

4. **Landing pages**
   - Public funnel pages can reuse attribution and billing CTA routing.

5. **Support tickets and tutor availability**
   - Both are operational workflows with clear service/query patterns and moderate coupling to admin summaries.

6. **Admin analytics**
   - Build after billing/referrals/support/tutor surfaces define the event and DTO inputs.

## Confidence Assessment

| Area | Confidence | Notes |
| --- | --- | --- |
| Router integration | HIGH | Current declarative React Router setup is adequate; no route architecture migration needed. |
| TanStack Query integration | HIGH | Existing service/hook/query-key pattern maps directly to Phase 11 domains. |
| Billing boundary | HIGH | Existing docs and code already establish hosted checkout and backend enforcement as future backend-owned concerns. |
| UTM/referral pattern | HIGH | Browser APIs and existing analytics client provide enough frontend foundation. |
| Support-ticket architecture | MEDIUM | Current support request flow exists, but formal ticket backend contract is not defined. |
| Admin analytics | MEDIUM | Summary DTOs are straightforward, but real event aggregation is backend/platform-owned. |
| Demo backend isolation | HIGH | Project constraints explicitly require frontend-only boundary and current backend is visibly local test infrastructure. |

## Sources

- Local repo: `src/app/router/AppRouter.tsx`, `src/services/**`, `src/hooks/**`, `src/lib/env.ts`, `src/services/analytics/analyticsClient.ts`, `backend/app/**`
- Local docs: `.planning/PROJECT.md`, `docs/pricing/subscription-model.md`, `docs/pricing/pricing-validation.md`, `docs/operations/analytics.md`, `docs/operations/support-workflow.md`, `docs/demo/mvp-demo-flow.md`
- React Router official docs, Route Object and data APIs: https://reactrouter.com/start/data/route-object/
- TanStack Query official docs, query keys: https://tanstack.com/query/latest/docs/react/guides/query-keys
- TanStack Query official docs, query invalidation: https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
- TanStack Query official docs, optimistic updates: https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates
- Stripe official docs, Checkout Sessions and hosted checkout: https://docs.stripe.com/payments/checkout-sessions and https://docs.stripe.com/payments/checkout/how-checkout-works
- MDN, `URLSearchParams`: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
- MDN, Web Storage API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
- MSW official docs/site, request interception and reusable mocks: https://mswjs.io/
