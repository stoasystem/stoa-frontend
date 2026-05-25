# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.0 Frontend Foundation** - Phases 1-3 (shipped 2026-05-24)
- ✅ **v1.1 Frontend Development Foundation** - Phases 4-7 (shipped 2026-05-24)
- ✅ **v1.2 Core Product UI** - Phases 8-10 (shipped 2026-05-24)
- ✅ **v1.3 Phase 4 Backend Integration and Real Chat API** - Phases 11-14 (shipped 2026-05-24)
- ✅ **v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow** - Phases 15-20 (implemented 2026-05-24)
- ✅ **v1.5 Phase 6 Authentication, User Roles, and Parent Visibility** - Phases 21-27 (implemented 2026-05-24)
- ✅ **v1.6 Phase 7 Product Polishing, Analytics, and MVP Readiness** - Phases 28-34 (implemented 2026-05-25)
- ✅ **v1.7 Phase 8 Staging Deployment, QA, and Early User Testing** - Phases 35-40 (implemented 2026-05-25)
- ✅ **v1.8 Phase 9 Production Readiness, Monitoring, and Pilot Launch** - Phases 41-47 (implemented 2026-05-25)
- ✅ **v1.9 Phase 10: Pilot Iteration, Payment Preparation, and Production Launch** - Phases 48-55 (implemented 2026-05-25)
- 🚧 **v1.10 Phase 11: Paid Launch Frontend, Growth Funnel, and Operational UI Scaling** - Phases 56-63 (planned)

## Phases

<details open>
<summary>🚧 v1.10 Phase 11: Paid Launch Frontend, Growth Funnel, and Operational UI Scaling (Phases 56-63)</summary>

**Milestone Goal:** Build frontend-only paid launch, growth funnel, referral, tutor availability, support ticket, admin operational analytics, UTM tracking, and demo/mock API surfaces so STOA can demonstrate early paid growth and operational workflows without implementing formal backend payment, subscription enforcement, analytics, support, or database systems.

- [ ] **Phase 56: Frontend Boundary, Demo API Strategy, and Attribution Foundation** - Establish frontend-only boundaries, demo backend cleanup rules, mock API strategy, feature flags, UTM capture, referral attribution, and paid launch analytics taxonomy.
- [ ] **Phase 57: Billing Plans, Usage Quotas, and Feature Gating UI** - Expand billing/pricing contracts and UI for plan catalog, subscription, usage quota, feature access, checkout, manage billing placeholder, and locked states.
- [ ] **Phase 58: Parent Acquisition and Partnership Landing Pages** - Add parent, how-it-works, AI homework help, teacher support, school, and tutoring center landing entries with clear CTAs and tracked conversion events.
- [ ] **Phase 59: Referral and Invitation Frontend Flow** - Add referral API contract, referral page, invite link copy, referral code capture, register payload propagation, and deterministic demo data.
- [ ] **Phase 60: Tutor Availability Frontend UI** - Add tutor availability API contract, tutor availability route, weekly availability editor, subject selector, save mutation, and admin-facing availability placeholder.
- [ ] **Phase 61: Support Ticket Frontend and Admin Triage UI** - Add support ticket contracts, user ticket create/list/detail, admin support queue/detail, status update mock UI, and privacy-safe support analytics.
- [ ] **Phase 62: Admin Operational Analytics Dashboard** - Add admin analytics contract and dashboard for active users, student activity, registrations, usage, teacher help, parent report views, checkout, support, and churn placeholders.
- [ ] **Phase 63: Docs, QA, E2E, and Phase 11 Verification** - Update README, growth/billing/operations/analytics docs, QA checklist, E2E coverage, and final build verification.

### Phase 56: Frontend Boundary, Demo API Strategy, and Attribution Foundation

**Goal**: Lock the Phase 11 frontend-only boundary before adding growth and operations UI.
**Depends on**: Phase 55
**Requirements**: [BOUND-01, BOUND-02, BOUND-03, BOUND-04, BOUND-05, ATTR-01, ATTR-02, ATTR-03, ATTR-04, ATTR-05, FLAG-01]
**Success Criteria** (what must be TRUE):
  1. Docs explicitly state that formal backend, payment webhook, subscription enforcement, analytics backend, support backend, admin backend, and complex database design are out of scope.
  2. Existing FastAPI/SQLite/local backend code is documented as demo/test-only and not formal backend architecture.
  3. Demo/mock API strategy covers billing, feature access, referrals, tutor availability, support tickets, and admin analytics.
  4. UTM/referral capture utility stores only whitelisted attribution metadata and can be used by register/checkout/analytics.
  5. Paid launch analytics event taxonomy and feature flags are defined.
**Plans**: 0/1

### Phase 57: Billing Plans, Usage Quotas, and Feature Gating UI

**Goal**: Make the paid launch billing surface complete enough to demo plans, quotas, and locked states without real backend enforcement.
**Depends on**: Phase 56
**Requirements**: [BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, BILL-07, BILL-08, BILL-09]
**Success Criteria** (what must be TRUE):
  1. Billing types and services cover plan catalog, subscription, usage quota, feature access, checkout session, and manage-billing placeholder.
  2. Billing hooks use TanStack Query for plans, subscription, usage, feature access, and checkout mutation.
  3. `/pricing` displays plan data, recommended plan, comparison, FAQ, and parent value CTA.
  4. `/billing` displays subscription status, plan, usage quota, payment/demo mode, upgrade, and manage-billing placeholder.
  5. Feature gating UI shows locked/quota states and upgrade prompt for AI chat, file upload, teacher help, and parent reports.
**Plans**: 0/1

### Phase 58: Parent Acquisition and Partnership Landing Pages

**Goal**: Give early paid launch traffic clear parent and partner entry pages with measurable CTAs.
**Depends on**: Phase 56
**Requirements**: [GROW-01, GROW-02, GROW-03, GROW-04, GROW-05, GROW-06, GROW-07]
**Success Criteria** (what must be TRUE):
  1. `/for-parents`, `/how-it-works`, `/ai-homework-help`, and `/teacher-support` exist and route to pricing/register.
  2. `/for-schools` and `/for-tutoring-centers` exist as lightweight partnership entries.
  3. Landing pages use shared components/content where practical.
  4. Parent value CTA clicks are tracked without sensitive payloads.
**Plans**: 0/1

### Phase 59: Referral and Invitation Frontend Flow

**Goal**: Let parents share STOA and preserve referral context through registration and checkout-like flows.
**Depends on**: Phase 56
**Requirements**: [REF-01, REF-02, REF-03, REF-04, REF-05, REF-06]
**Success Criteria** (what must be TRUE):
  1. Referral types and service contract define `GET /referrals/me`.
  2. `/referrals` displays invite link, referral code, successful invites, copy action, and reward placeholder.
  3. Register reads referral code from `ref` or equivalent URL parameter.
  4. Register payload can include referral code and stored attribution metadata.
  5. Referral copy event is tracked and deterministic demo data exists.
**Plans**: 0/1

### Phase 60: Tutor Availability Frontend UI

**Goal**: Let tutors demonstrate availability and subject setup while leaving matching and scheduling enforcement to future backend work.
**Depends on**: Phase 56
**Requirements**: [TUTOR-01, TUTOR-02, TUTOR-03, TUTOR-04, TUTOR-05, TUTOR-06]
**Success Criteria** (what must be TRUE):
  1. Tutor availability contract defines get/update for weekly availability and subjects.
  2. `/tutor/availability` shows current availability, subject coverage, and status.
  3. Tutor can edit weekly availability windows and subjects in the UI.
  4. Save mutation shows success/error feedback and invalidates relevant query state.
  5. Admin-facing tutor availability overview exists as a placeholder or analytics card without scheduling backend logic.
**Plans**: 0/1

### Phase 61: Support Ticket Frontend and Admin Triage UI

**Goal**: Upgrade support from generic feedback into frontend ticket surfaces for users and operators without implementing a production support backend.
**Depends on**: Phase 56
**Requirements**: [SUP-01, SUP-02, SUP-03, SUP-04, SUP-05, SUP-06]
**Success Criteria** (what must be TRUE):
  1. Support ticket types/services cover user create/list/detail and admin list/detail/status update contracts.
  2. `/support/tickets` supports ticket creation and list display.
  3. `/support/tickets/:ticketId` shows user ticket detail and status.
  4. `/admin/support` and `/admin/support/:ticketId` show admin queue/detail/status update mock UI.
  5. Analytics and docs exclude full private ticket bodies and sensitive data.
**Plans**: 0/1

### Phase 62: Admin Operational Analytics Dashboard

**Goal**: Give launch operators a frontend dashboard for conversion, usage, billing, support, tutor capacity, and retention placeholders.
**Depends on**: Phase 57, Phase 59, Phase 60, Phase 61
**Requirements**: [ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05]
**Success Criteria** (what must be TRUE):
  1. Admin analytics contract defines `GET /admin/analytics/overview`.
  2. `/admin/analytics` shows active users, weekly active students, registrations, messages, uploads, teacher-help requests, parent report views, checkout starts/completions, and cancelled subscriptions.
  3. Dashboard handles loading, empty, backend-pending, and success states.
  4. Billing interest/conversion overview is visible.
  5. Admin analytics remains frontend-only and does not implement BI/data warehouse behavior.
**Plans**: 0/1

### Phase 63: Docs, QA, E2E, and Phase 11 Verification

**Goal**: Close Phase 11 with documentation and verification evidence for the frontend-only paid launch and operations demo surface.
**Depends on**: Phase 62
**Requirements**: [DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, QA-01, QA-02, QA-03]
**Success Criteria** (what must be TRUE):
  1. README documents Phase 11 scope, contracts, demo backend/mock behavior, and main additions.
  2. Growth, billing, operations, and analytics docs exist.
  3. Manual QA checklist covers Phase 11 flows.
  4. E2E or route smoke coverage verifies core demo flows where feasible.
  5. `npm run build` passes.
**Plans**: 0/1

</details>

<details>
<summary>✅ Previous shipped milestones (Phases 1-55)</summary>

Phases 1-55 shipped the STOA frontend foundation, product UI, backend chat integration, streaming/file uploads, authenticated roles, parent/tutor/admin MVP flows, staging/QA, production/pilot readiness, pricing validation, virtual checkout, launch-ready legal drafts, and Phase 10 launch verification.

See `.planning/MILESTONES.md` and archived milestone audit files for detailed shipped scope and verification evidence.

</details>

## Progress

**Execution Order:**
Phases execute in numeric order: 56 -> 57 -> 58 -> 59 -> 60 -> 61 -> 62 -> 63

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 56. Frontend Boundary, Demo API Strategy, and Attribution Foundation | v1.10 | 0/1 | Planned | — |
| 57. Billing Plans, Usage Quotas, and Feature Gating UI | v1.10 | 0/1 | Planned | — |
| 58. Parent Acquisition and Partnership Landing Pages | v1.10 | 0/1 | Planned | — |
| 59. Referral and Invitation Frontend Flow | v1.10 | 0/1 | Planned | — |
| 60. Tutor Availability Frontend UI | v1.10 | 0/1 | Planned | — |
| 61. Support Ticket Frontend and Admin Triage UI | v1.10 | 0/1 | Planned | — |
| 62. Admin Operational Analytics Dashboard | v1.10 | 0/1 | Planned | — |
| 63. Docs, QA, E2E, and Phase 11 Verification | v1.10 | 0/1 | Planned | — |
