# Requirements: STOA Frontend v1.10 Phase 11 Paid Launch Frontend, Growth Funnel, and Operational UI Scaling

**Defined:** 2026-05-25
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries backed only by the unified STOA backend API contract.

## v1.10 Requirements

Phase 11 is frontend-only. It prepares paid launch, parent acquisition, referrals, tutor availability, support tickets, admin analytics, UTM attribution, and demo/mock API behavior without implementing formal backend payment, subscription enforcement, analytics, support, or database systems.

### Frontend-Only Boundary and Demo API Cleanup

- [ ] **BOUND-01**: Phase 11 docs explicitly state that formal backend, payment webhook, subscription enforcement, production analytics backend, complex admin backend, production support backend, and complex database design are out of scope.
- [ ] **BOUND-02**: Existing local FastAPI/SQLite/demo backend support is documented as demo/test-only infrastructure.
- [ ] **BOUND-03**: Prior backend-like features are reviewed and either documented, isolated, or marked for cleanup so they do not imply production backend architecture.
- [ ] **BOUND-04**: Demo/mock API strategy is defined for billing, feature access, referrals, tutor availability, support tickets, and admin analytics.
- [ ] **BOUND-05**: Mock/demo data is kept behind typed services or mock handlers, not embedded directly in page components.

### Billing, Usage, Feature Access, and Checkout Frontend

- [ ] **BILL-01**: `src/types/billing.ts` defines billing plan, subscription, usage quota, feature access, and checkout-related types.
- [ ] **BILL-02**: Billing service exposes contracts for plans, subscription, usage quota, feature access, checkout session, and manage-billing placeholder.
- [ ] **BILL-03**: Billing hooks expose plans, subscription, usage, feature access, and checkout mutation through TanStack Query.
- [ ] **BILL-04**: `/pricing` displays frontend-driven plan data, recommended plan state, comparison, FAQ, and parent value CTA.
- [ ] **BILL-05**: `/billing` displays subscription status, current plan, usage quota, payment/demo mode, upgrade action, and manage-billing placeholder.
- [ ] **BILL-06**: Billing success and cancelled routes show mock checkout return states and next actions.
- [ ] **BILL-07**: Feature gating UI can show locked states for AI messages, file uploads, teacher help, and parent reports.
- [ ] **BILL-08**: Upgrade prompt/dialog routes users to pricing or billing without pretending frontend gates are secure enforcement.
- [ ] **BILL-09**: Checkout payload can include attribution/UTM metadata without exposing payment secrets.

### Parent Acquisition and Landing Pages

- [ ] **GROW-01**: `/for-parents` explains STOA value for parents and routes to pricing/register.
- [ ] **GROW-02**: `/how-it-works` explains student asks, AI explains, file upload, teacher support, and parent report flow.
- [ ] **GROW-03**: `/ai-homework-help` presents the AI homework help use case.
- [ ] **GROW-04**: `/teacher-support` explains human teacher backup and tutor-supported plan value.
- [ ] **GROW-05**: `/for-schools` and `/for-tutoring-centers` provide lightweight partnership entry placeholders.
- [ ] **GROW-06**: Landing pages use shared components/content patterns and clear CTAs.
- [ ] **GROW-07**: Parent funnel CTA clicks are tracked with privacy-safe analytics metadata.

### Referral and Invitation Flow

- [ ] **REF-01**: Referral types and service contract define `GET /referrals/me`.
- [ ] **REF-02**: `/referrals` shows invite link, referral code, successful invites, copy action, and reward placeholder.
- [ ] **REF-03**: Register page reads `ref` or referral code from the URL.
- [ ] **REF-04**: Register payload can include referral code and stored attribution metadata.
- [ ] **REF-05**: Referral link copy triggers a privacy-safe analytics event.
- [ ] **REF-06**: Referral demo/mock response can return a deterministic invite link and successful invite count.

### Tutor Availability UI

- [ ] **TUTOR-01**: Tutor availability types and service contracts define `GET /tutors/me/availability` and `PATCH /tutors/me/availability`.
- [ ] **TUTOR-02**: `/tutor/availability` displays current weekly availability, subjects, and availability status.
- [ ] **TUTOR-03**: Tutor can edit weekly availability windows in the frontend UI.
- [ ] **TUTOR-04**: Tutor can edit tutor-supported subjects in the frontend UI.
- [ ] **TUTOR-05**: Availability save mutation shows success/error feedback and invalidates the relevant query.
- [ ] **TUTOR-06**: Admin-facing tutor availability overview is represented as a placeholder or analytics card without implementing scheduling backend logic.

### Support Ticket UI

- [ ] **SUP-01**: Support ticket types and service contracts define user ticket create/list/detail and admin ticket list/detail/status update.
- [ ] **SUP-02**: `/support/tickets` lets users create a ticket and view their ticket list.
- [ ] **SUP-03**: `/support/tickets/:ticketId` shows ticket detail and status.
- [ ] **SUP-04**: `/admin/support` shows admin support ticket queue with filter/status states.
- [ ] **SUP-05**: `/admin/support/:ticketId` shows ticket detail and mock status update UI.
- [ ] **SUP-06**: Support ticket analytics avoid full private ticket bodies and sensitive data.

### Admin Operational Analytics

- [ ] **ADMIN-01**: Admin analytics types and service contract define `GET /admin/analytics/overview`.
- [ ] **ADMIN-02**: `/admin/analytics` shows active users, weekly active students, registrations, messages, uploads, teacher-help requests, parent report views, checkout starts, checkout completions, and cancelled subscriptions.
- [ ] **ADMIN-03**: Admin analytics UI shows loading, empty, backend-pending, and success states.
- [ ] **ADMIN-04**: Billing interest/conversion overview is visible through admin analytics or a dedicated admin section.
- [ ] **ADMIN-05**: Admin operational UI remains frontend-only and avoids BI/data warehouse implementation.

### UTM, Referral Attribution, and Paid Launch Analytics

- [ ] **ATTR-01**: `src/lib/utm.ts` captures whitelisted UTM params from URL and stores them safely.
- [ ] **ATTR-02**: Stored attribution can be read by register, checkout, referral, and analytics flows.
- [ ] **ATTR-03**: App startup captures UTM/referral context.
- [ ] **ATTR-04**: Paid launch analytics event names include pricing, checkout, billing, feature locked, upgrade prompt, parent landing, referral, tutor availability, support ticket, admin analytics, and UTM captured events.
- [ ] **ATTR-05**: Analytics payloads exclude chat content, file contents, payment secrets, tokens, and full support bodies.
- [ ] **FLAG-01**: `src/lib/env.ts` and `.env.example` include referral, support tickets, mock API, tutor availability, and admin analytics flags.

### Documentation, QA, and Verification

- [ ] **DOC-01**: README documents Phase 11 frontend-only scope, API contracts, demo backend/mock behavior, and main additions.
- [ ] **DOC-02**: Growth docs cover parent acquisition funnel, referral program, and paid launch campaign.
- [ ] **DOC-03**: Billing docs cover checkout flow contract and subscription access UI.
- [ ] **DOC-04**: Operations docs cover tutor availability UI and support ticket UI.
- [ ] **DOC-05**: Analytics docs cover paid launch events and operational dashboard.
- [ ] **QA-01**: Manual QA checklist covers billing/pricing, feature gating, parent funnel, referral, tutor availability, support tickets, admin analytics, UTM, and build.
- [ ] **QA-02**: E2E or route smoke coverage verifies core Phase 11 demo flows where feasible.
- [ ] **QA-03**: `npm run build` passes at milestone completion.

## Future Requirements

Deferred to later milestones.

- **BACKEND-PAY-01**: Real Stripe Checkout and Customer Portal backend sessions.
- **BACKEND-SUB-01**: Real subscription persistence and quota enforcement.
- **BACKEND-ANLY-01**: Production analytics aggregation backend.
- **BACKEND-SUP-01**: Production support ticket backend and notifications.
- **BACKEND-REF-01**: Referral reward accounting and fraud controls.
- **BACKEND-SCHED-01**: Tutor scheduling, matching, capacity, and calendar integration backend.
- **PLATFORM-01**: School/tutoring center multi-tenant backend and organization admin system.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Formal production backend | Phase 11 is frontend-only. |
| Real Stripe webhook | Backend-owned future paid launch work. |
| Real subscription enforcement | Backend APIs must enforce true access later. |
| Production analytics backend | This milestone defines UI/contracts/events only. |
| Complex admin backend | Admin pages use contracts/demo data only. |
| Production support ticket backend | Support UI can be mocked/demoed first. |
| Complex database schema | Demo/test data is enough for frontend flow validation. |
| Full CRM/helpdesk | Too much operational scope. |
| Tutor payroll and scheduling engine | Outside frontend paid launch UI. |
| CMS/SEO content system | Landing entries only; no content backend. |
| Ad pixels/growth SDKs/A-B testing platform | Attribution and event taxonomy are enough. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOUND-01 | Phase 56 | Planned |
| BOUND-02 | Phase 56 | Planned |
| BOUND-03 | Phase 56 | Planned |
| BOUND-04 | Phase 56 | Planned |
| BOUND-05 | Phase 56 | Planned |
| ATTR-01 | Phase 56 | Planned |
| ATTR-02 | Phase 56 | Planned |
| ATTR-03 | Phase 56 | Planned |
| ATTR-04 | Phase 56 | Planned |
| ATTR-05 | Phase 56 | Planned |
| FLAG-01 | Phase 56 | Planned |
| BILL-01 | Phase 57 | Planned |
| BILL-02 | Phase 57 | Planned |
| BILL-03 | Phase 57 | Planned |
| BILL-04 | Phase 57 | Planned |
| BILL-05 | Phase 57 | Planned |
| BILL-06 | Phase 57 | Planned |
| BILL-07 | Phase 57 | Planned |
| BILL-08 | Phase 57 | Planned |
| BILL-09 | Phase 57 | Planned |
| GROW-01 | Phase 58 | Planned |
| GROW-02 | Phase 58 | Planned |
| GROW-03 | Phase 58 | Planned |
| GROW-04 | Phase 58 | Planned |
| GROW-05 | Phase 58 | Planned |
| GROW-06 | Phase 58 | Planned |
| GROW-07 | Phase 58 | Planned |
| REF-01 | Phase 59 | Planned |
| REF-02 | Phase 59 | Planned |
| REF-03 | Phase 59 | Planned |
| REF-04 | Phase 59 | Planned |
| REF-05 | Phase 59 | Planned |
| REF-06 | Phase 59 | Planned |
| TUTOR-01 | Phase 60 | Planned |
| TUTOR-02 | Phase 60 | Planned |
| TUTOR-03 | Phase 60 | Planned |
| TUTOR-04 | Phase 60 | Planned |
| TUTOR-05 | Phase 60 | Planned |
| TUTOR-06 | Phase 60 | Planned |
| SUP-01 | Phase 61 | Planned |
| SUP-02 | Phase 61 | Planned |
| SUP-03 | Phase 61 | Planned |
| SUP-04 | Phase 61 | Planned |
| SUP-05 | Phase 61 | Planned |
| SUP-06 | Phase 61 | Planned |
| ADMIN-01 | Phase 62 | Planned |
| ADMIN-02 | Phase 62 | Planned |
| ADMIN-03 | Phase 62 | Planned |
| ADMIN-04 | Phase 62 | Planned |
| ADMIN-05 | Phase 62 | Planned |
| DOC-01 | Phase 63 | Planned |
| DOC-02 | Phase 63 | Planned |
| DOC-03 | Phase 63 | Planned |
| DOC-04 | Phase 63 | Planned |
| DOC-05 | Phase 63 | Planned |
| QA-01 | Phase 63 | Planned |
| QA-02 | Phase 63 | Planned |
| QA-03 | Phase 63 | Planned |

**Coverage:**
- v1.10 requirements: 57 total
- Mapped to phases: 57
- Planned: 57
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after v1.10 roadmap creation*
