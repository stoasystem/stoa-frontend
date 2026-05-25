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
- 🚧 **v1.9 Phase 10: Pilot Iteration, Payment Preparation, and Production Launch** - Phases 48-55 (planned)

## Phases

<details open>
<summary>🚧 v1.9 Phase 10: Pilot Iteration, Payment Preparation, and Production Launch (Phases 48-55)</summary>

**Milestone Goal:** Upgrade STOA from a controlled pilot launch frontend into a launch-ready early commercial product frontend that can demonstrate and test pricing, billing intent, subscription state, parent conversion, tutor operations, and admin operations before real payment/backend rollout.

- [ ] **Phase 48: Pilot Review and Critical Bug Sprint Planning** - Consolidate pilot feedback, analytics, support records, bug reports, and launch-blocker rules into actionable Phase 10 priorities.
- [ ] **Phase 49: Student and Parent UX Iteration with Conversion Signals** - Improve student learning continuation, parent value clarity, parent report comprehension, upgrade prompts, and conversion analytics.
- [ ] **Phase 50: Tutor Operations Workflow** - Make tutor request handling operational for real students with clearer context, required resolution notes, stats, and tracking.
- [ ] **Phase 51: Pricing Validation and Subscription Model** - Upgrade pricing from placeholder to validation-ready tiers, CTAs, parent funnel docs, and subscription access matrix.
- [ ] **Phase 52: Billing, Feature Flags, and Virtual Checkout Demo Flow** - Add billing contracts, subscription UI, feature flags, and mock checkout success/cancel flow before real backend payment integration.
- [ ] **Phase 53: Admin Launch Operations** - Expand admin operations for usage, feedback, help requests, billing interest, users, support, and system status boundaries.
- [ ] **Phase 54: Legal, Release, Rollback, and Monitoring Readiness** - Update privacy/terms and launch operations docs for public launch readiness.
- [ ] **Phase 55: README, QA, E2E, and Final Launch Verification** - Update README, QA/E2E coverage, launch checklist evidence, and final build verification.

### Phase 48: Pilot Review and Critical Bug Sprint Planning

**Goal**: Turn pilot evidence into a launch-prioritized iteration backlog before building new features.
**Depends on**: Phase 47
**Requirements**: [PILOT-01, PILOT-02, PILOT-03, PILOT-04, PILOT-05]
**Success Criteria** (what must be TRUE):
  1. `docs/pilot/pilot-review.md` exists with pilot summary, participants, usage metrics, role feedback, critical bugs, UX issues, value signals, pricing signals, recommended changes, and Phase 10 priorities.
  2. Feedback categories include critical bug, UX confusion, value confusion, missing feature, performance, trust, payment/pricing, and AI/content quality.
  3. P0/P1/P2/P3 definitions and launch rules are documented.
  4. P0/P1 bug-tracking expectations include reproduction, fix notes, QA evidence, and E2E coverage.
  5. Launch gates clearly require all P0 fixes and P1 fixes or workarounds.
**Plans**: 0/1

### Phase 49: Student and Parent UX Iteration with Conversion Signals

**Goal**: Improve the student and parent paths that drive learning value and willingness-to-pay evidence.
**Depends on**: Phase 48
**Requirements**: [UX-01, UX-02, UX-03, UX-04, UX-05, UX-09, PARENT-01, PARENT-02, PARENT-05]
**Success Criteria** (what must be TRUE):
  1. Student dashboard includes next-action and continue-learning components for recent conversation, weak topic review, homework upload, and teacher help.
  2. Chat empty state, new conversation, upload guidance, loading, teacher-help CTA, recent conversations, and learning-history entry are clearer.
  3. Parent dashboard foregrounds child activity, recent questions, weak topics, teacher involvement, next parent action, and STOA value.
  4. Parent report explains weak topics, weekly summary, teacher help records, and why each signal matters.
  5. Parent upgrade CTAs and privacy-safe conversion analytics exist or are documented in the right components.
**Plans**: 0/1

### Phase 50: Tutor Operations Workflow

**Goal**: Make tutor support usable for real student requests while keeping the scope short of scheduling, payroll, or live tutoring systems.
**Depends on**: Phase 49
**Requirements**: [UX-06, UX-07, UX-08, TUTOR-01, TUTOR-02, TUTOR-03, TUTOR-04, TUTOR-05, TUTOR-06]
**Success Criteria** (what must be TRUE):
  1. Tutor queue shows status, priority placeholder, student context, subject, grade/age where available, and request age.
  2. Request detail separates student question, AI answer, student follow-up, tutor notes, and status controls.
  3. Marking resolved requires a short resolution note.
  4. Tutor stats contract covers pending requests, resolved today, and average response time minutes.
  5. Tutor operation events are implemented or documented for opened, status changed, time to first action, resolved count, and note submitted.
**Plans**: 0/1

### Phase 51: Pricing Validation and Subscription Model

**Goal**: Turn pricing placeholders into a clear validation-ready commercial surface and subscription model.
**Depends on**: Phase 49
**Requirements**: [PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05, PARENT-03, PARENT-04]
**Success Criteria** (what must be TRUE):
  1. `/pricing` explains STOA value, free trial, Student Plan, Family Plan, Tutor-supported Plan, pilot status, and parent value.
  2. Pricing tiers list capabilities for AI chat, homework upload, learning history, parent dashboard, weekly reports, teacher help quota, and priority support.
  3. CTAs support free trial, join pilot, talk to us, and upgrade after pilot.
  4. Pricing validation and subscription model docs exist under `docs/pricing/`.
  5. Reusable pricing CTA supports parent dashboard/report/pricing funnel.
**Plans**: 0/1

### Phase 52: Billing, Feature Flags, and Virtual Checkout Demo Flow

**Goal**: Let developers and stakeholders demo and test a complete pricing-to-billing flow before real backend payment integration.
**Depends on**: Phase 51
**Requirements**: [PRICE-06, FLAG-01, FLAG-02, BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, BILL-07, BILL-08]
**Success Criteria** (what must be TRUE):
  1. User subscription types include subscription status and plan fields.
  2. `src/lib/env.ts`, `.env.example`, and README cover payment, mock checkout, public registration, teacher help, and parent report flags.
  3. Billing API client and hooks define subscription lookup and checkout-session creation.
  4. `/billing` shows current plan, subscription status, trial end, upgrade path, and support path.
  5. Subscription badge, plan card, billing summary, and upgrade button components exist.
  6. Real checkout path redirects only to a backend-provided hosted URL and never collects card details in the frontend.
  7. Mock checkout flag enables virtual checkout, success, and cancel states without real payment data.
**Plans**: 0/1

### Phase 53: Admin Launch Operations

**Goal**: Give the team enough admin visibility to operate early launch users without building a full CRM or BI platform.
**Depends on**: Phase 52
**Requirements**: [BILL-10, ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06, ADMIN-07, ADMIN-08]
**Success Criteria** (what must be TRUE):
  1. `/admin/usage`, `/admin/feedback`, and `/admin/help-requests` are admin-protected and show data or clear backend-pending states.
  2. Admin route shells exist for users, support, billing interest, and system status.
  3. Admin service contracts cover users, feedback, support requests, usage summary, help requests, billing interest, and system status.
  4. Query hooks exist for Phase 10 admin operations where useful.
  5. Non-admin access routes to `/forbidden`.
  6. Admin docs or page copy keep CRM, BI, accounting, payroll, and multi-tenant school management out of scope.
**Plans**: 0/1

### Phase 54: Legal, Release, Rollback, and Monitoring Readiness

**Goal**: Make public launch operations explicit before opening STOA to real launch users.
**Depends on**: Phase 53
**Requirements**: [LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04, LAUNCH-01, LAUNCH-02, LAUNCH-03, LAUNCH-04]
**Success Criteria** (what must be TRUE):
  1. `/privacy` covers user data, student learning data, parent/tutor visibility, purpose, retention, deletion, contact, AI services, and third-party processing placeholders.
  2. `/terms` covers learning-aid status, possible AI errors, review expectations, prohibited uploads, trial/subscription terms, service changes, termination, and contact.
  3. Register form requires terms/privacy consent.
  4. Layout/footer exposes privacy and terms links.
  5. Launch docs cover release process, rollback plan, post-launch monitoring, and launch checklist.
**Plans**: 0/1

### Phase 55: README, QA, E2E, and Final Launch Verification

**Goal**: Close Phase 10 with documentation and verification evidence that the launch-ready frontend can be built, tested, and demoed.
**Depends on**: Phase 54
**Requirements**: [BILL-09, LAUNCH-05, LAUNCH-06, LAUNCH-07, LAUNCH-08]
**Success Criteria** (what must be TRUE):
  1. README documents Phase 10 additions, launch flow, production feature flags, and billing API contracts.
  2. Manual QA checklist covers pricing, billing, virtual checkout, parent conversion, tutor operations, admin operations, privacy/terms, and launch readiness.
  3. E2E coverage includes pricing/billing/virtual checkout flow where feasible.
  4. Final verification records build, lint, E2E/manual QA expectations, P0/P1 status, and known residual risks.
  5. `npm run build` passes.
**Plans**: 0/1

</details>

<details>
<summary>✅ Previous shipped milestones (Phases 1-47)</summary>

Phases 1-47 shipped the STOA frontend foundation, development scaffold, mock product UI, backend chat integration, streaming/file upload workflow, authenticated role surfaces, parent/tutor workflows, MVP polish, analytics, staging/QA, feedback collection, production readiness, monitoring/logging, support, privacy/terms pilot drafts, backup/restore strategy, pricing/billing placeholders, pilot launch plan, and final Phase 9 verification.

See `.planning/MILESTONES.md` and archived milestone audit files for detailed shipped scope and verification evidence.

</details>

## Progress

**Execution Order:**
Phases execute in numeric order: 48 -> 49 -> 50 -> 51 -> 52 -> 53 -> 54 -> 55

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 48. Pilot Review and Critical Bug Sprint Planning | v1.9 | 0/1 | Planned | — |
| 49. Student and Parent UX Iteration with Conversion Signals | v1.9 | 0/1 | Planned | — |
| 50. Tutor Operations Workflow | v1.9 | 0/1 | Planned | — |
| 51. Pricing Validation and Subscription Model | v1.9 | 0/1 | Planned | — |
| 52. Billing, Feature Flags, and Virtual Checkout Demo Flow | v1.9 | 0/1 | Planned | — |
| 53. Admin Launch Operations | v1.9 | 0/1 | Planned | — |
| 54. Legal, Release, Rollback, and Monitoring Readiness | v1.9 | 0/1 | Planned | — |
| 55. README, QA, E2E, and Final Launch Verification | v1.9 | 0/1 | Planned | — |
