# Requirements: STOA Frontend v1.10 Phase 11 Paid Launch Frontend, Growth Funnel, and Operational UI Scaling

**Defined:** 2026-05-25
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries backed only by the unified STOA backend API contract.

## v1.10 Requirements

Phase 11 is frontend-only. It prepares paid launch, parent acquisition, referrals, tutor availability, support tickets, admin analytics, UTM attribution, and demo/mock API behavior without implementing formal backend payment, subscription enforcement, analytics, support, or database systems.

### Frontend-Only Boundary and Demo API Cleanup

- [x] **BOUND-01**: Phase 11 docs explicitly state that formal backend, payment webhook, subscription enforcement, production analytics backend, complex admin backend, production support backend, and complex database design are out of scope.
- [x] **BOUND-02**: Existing local FastAPI/SQLite/demo backend support is documented as demo/test-only infrastructure.
- [x] **BOUND-03**: Prior backend-like features are reviewed and either documented, isolated, or marked for cleanup so they do not imply production backend architecture.
- [x] **BOUND-04**: Demo/mock API strategy is defined for billing, feature access, referrals, tutor availability, support tickets, and admin analytics.
- [x] **BOUND-05**: Mock/demo data is kept behind typed services or mock handlers, not embedded directly in page components.

### Billing, Usage, Feature Access, and Checkout Frontend

- [x] **BILL-01**: `src/types/billing.ts` defines billing plan, subscription, usage quota, feature access, and checkout-related types.
- [x] **BILL-02**: Billing service exposes contracts for plans, subscription, usage quota, feature access, checkout session, and manage-billing placeholder.
- [x] **BILL-03**: Billing hooks expose plans, subscription, usage, feature access, and checkout mutation through TanStack Query.
- [x] **BILL-04**: `/pricing` displays frontend-driven plan data, recommended plan state, comparison, FAQ, and parent value CTA.
- [x] **BILL-05**: `/billing` displays subscription status, current plan, usage quota, payment/demo mode, upgrade action, and manage-billing placeholder.
- [x] **BILL-06**: Billing success and cancelled routes show mock checkout return states and next actions.
- [x] **BILL-07**: Feature gating UI can show locked states for AI messages, file uploads, teacher help, and parent reports.
- [x] **BILL-08**: Upgrade prompt/dialog routes users to pricing or billing without pretending frontend gates are secure enforcement.
- [x] **BILL-09**: Checkout payload can include attribution/UTM metadata without exposing payment secrets.

### Parent Acquisition and Landing Pages

- [x] **GROW-01**: `/for-parents` explains STOA value for parents and routes to pricing/register.
- [x] **GROW-02**: `/how-it-works` explains student asks, AI explains, file upload, teacher support, and parent report flow.
- [x] **GROW-03**: `/ai-homework-help` presents the AI homework help use case.
- [x] **GROW-04**: `/teacher-support` explains human teacher backup and tutor-supported plan value.
- [x] **GROW-05**: `/for-schools` and `/for-tutoring-centers` provide lightweight partnership entry placeholders.
- [x] **GROW-06**: Landing pages use shared components/content patterns and clear CTAs.
- [x] **GROW-07**: Parent funnel CTA clicks are tracked with privacy-safe analytics metadata.

### Referral and Invitation Flow

- [x] **REF-01**: Referral types and service contract define `GET /referrals/me`.
- [x] **REF-02**: `/referrals` shows invite link, referral code, successful invites, copy action, and reward placeholder.
- [x] **REF-03**: Register page reads `ref` or referral code from the URL.
- [x] **REF-04**: Register payload can include referral code and stored attribution metadata.
- [x] **REF-05**: Referral link copy triggers a privacy-safe analytics event.
- [x] **REF-06**: Referral demo/mock response can return a deterministic invite link and successful invite count.

### Tutor Availability UI

- [x] **TUTOR-01**: Tutor availability types and service contracts define `GET /tutors/me/availability` and `PATCH /tutors/me/availability`.
- [x] **TUTOR-02**: `/tutor/availability` displays current weekly availability, subjects, and availability status.
- [x] **TUTOR-03**: Tutor can edit weekly availability windows in the frontend UI.
- [x] **TUTOR-04**: Tutor can edit tutor-supported subjects in the frontend UI.
- [x] **TUTOR-05**: Availability save mutation shows success/error feedback and invalidates the relevant query.
- [x] **TUTOR-06**: Admin-facing tutor availability overview is represented as a placeholder or analytics card without implementing scheduling backend logic.

### Support Ticket UI

- [x] **SUP-01**: Support ticket types and service contracts define user ticket create/list/detail and admin ticket list/detail/status update.
- [x] **SUP-02**: `/support/tickets` lets users create a ticket and view their ticket list.
- [x] **SUP-03**: `/support/tickets/:ticketId` shows ticket detail and status.
- [x] **SUP-04**: `/admin/support` shows admin support ticket queue with filter/status states.
- [x] **SUP-05**: `/admin/support/:ticketId` shows ticket detail and mock status update UI.
- [x] **SUP-06**: Support ticket analytics avoid full private ticket bodies and sensitive data.

### Admin Operational Analytics

- [x] **ADMIN-01**: Admin analytics types and service contract define `GET /admin/analytics/overview`.
- [x] **ADMIN-02**: `/admin/analytics` shows active users, weekly active students, registrations, messages, uploads, teacher-help requests, parent report views, checkout starts, checkout completions, and cancelled subscriptions.
- [x] **ADMIN-03**: Admin analytics UI shows loading, empty, backend-pending, and success states.
- [x] **ADMIN-04**: Billing interest/conversion overview is visible through admin analytics or a dedicated admin section.
- [x] **ADMIN-05**: Admin operational UI remains frontend-only and avoids BI/data warehouse implementation.

### UTM, Referral Attribution, and Paid Launch Analytics

- [x] **ATTR-01**: `src/lib/utm.ts` captures whitelisted UTM params from URL and stores them safely.
- [x] **ATTR-02**: Stored attribution can be read by register, checkout, referral, and analytics flows.
- [x] **ATTR-03**: App startup captures UTM/referral context.
- [x] **ATTR-04**: Paid launch analytics event names include pricing, checkout, billing, feature locked, upgrade prompt, parent landing, referral, tutor availability, support ticket, admin analytics, and UTM captured events.
- [x] **ATTR-05**: Analytics payloads exclude chat content, file contents, payment secrets, tokens, and full support bodies.
- [x] **FLAG-01**: `src/lib/env.ts` and `.env.example` include referral, support tickets, mock API, tutor availability, and admin analytics flags.

### Documentation, QA, and Verification

- [x] **DOC-01**: README documents Phase 11 frontend-only scope, API contracts, demo backend/mock behavior, and main additions.
- [x] **DOC-02**: Growth docs cover parent acquisition funnel, referral program, and paid launch campaign.
- [x] **DOC-03**: Billing docs cover checkout flow contract and subscription access UI.
- [x] **DOC-04**: Operations docs cover tutor availability UI and support ticket UI.
- [x] **DOC-05**: Analytics docs cover paid launch events and operational dashboard.
- [x] **QA-01**: Manual QA checklist covers billing/pricing, feature gating, parent funnel, referral, tutor availability, support tickets, admin analytics, UTM, and build.
- [x] **QA-02**: E2E or route smoke coverage verifies core Phase 11 demo flows where feasible.
- [x] **QA-03**: `npm run build` passes at milestone completion.

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
| BOUND-01 | Phase 56 | Complete |
| BOUND-02 | Phase 56 | Complete |
| BOUND-03 | Phase 56 | Complete |
| BOUND-04 | Phase 56 | Complete |
| BOUND-05 | Phase 56 | Complete |
| ATTR-01 | Phase 56 | Complete |
| ATTR-02 | Phase 56 | Complete |
| ATTR-03 | Phase 56 | Complete |
| ATTR-04 | Phase 56 | Complete |
| ATTR-05 | Phase 56 | Complete |
| FLAG-01 | Phase 56 | Complete |
| BILL-01 | Phase 57 | Complete |
| BILL-02 | Phase 57 | Complete |
| BILL-03 | Phase 57 | Complete |
| BILL-04 | Phase 57 | Complete |
| BILL-05 | Phase 57 | Complete |
| BILL-06 | Phase 57 | Complete |
| BILL-07 | Phase 57 | Complete |
| BILL-08 | Phase 57 | Complete |
| BILL-09 | Phase 57 | Complete |
| GROW-01 | Phase 58 | Complete |
| GROW-02 | Phase 58 | Complete |
| GROW-03 | Phase 58 | Complete |
| GROW-04 | Phase 58 | Complete |
| GROW-05 | Phase 58 | Complete |
| GROW-06 | Phase 58 | Complete |
| GROW-07 | Phase 58 | Complete |
| REF-01 | Phase 59 | Complete |
| REF-02 | Phase 59 | Complete |
| REF-03 | Phase 59 | Complete |
| REF-04 | Phase 59 | Complete |
| REF-05 | Phase 59 | Complete |
| REF-06 | Phase 59 | Complete |
| TUTOR-01 | Phase 60 | Complete |
| TUTOR-02 | Phase 60 | Complete |
| TUTOR-03 | Phase 60 | Complete |
| TUTOR-04 | Phase 60 | Complete |
| TUTOR-05 | Phase 60 | Complete |
| TUTOR-06 | Phase 60 | Complete |
| SUP-01 | Phase 61 | Complete |
| SUP-02 | Phase 61 | Complete |
| SUP-03 | Phase 61 | Complete |
| SUP-04 | Phase 61 | Complete |
| SUP-05 | Phase 61 | Complete |
| SUP-06 | Phase 61 | Complete |
| ADMIN-01 | Phase 62 | Complete |
| ADMIN-02 | Phase 62 | Complete |
| ADMIN-03 | Phase 62 | Complete |
| ADMIN-04 | Phase 62 | Complete |
| ADMIN-05 | Phase 62 | Complete |
| DOC-01 | Phase 63 | Complete |
| DOC-02 | Phase 63 | Complete |
| DOC-03 | Phase 63 | Complete |
| DOC-04 | Phase 63 | Complete |
| DOC-05 | Phase 63 | Complete |
| QA-01 | Phase 63 | Complete |
| QA-02 | Phase 63 | Complete |
| QA-03 | Phase 63 | Complete |

**Coverage:**
- v1.10 requirements: 57 total
- Mapped to phases: 57
- Complete: 57
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after v1.10 implementation and verification*
