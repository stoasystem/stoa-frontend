# Requirements: STOA Frontend v1.9 Phase 10 Pilot Iteration, Payment Preparation, and Production Launch

**Defined:** 2026-05-25
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries backed only by the unified STOA backend API contract.

## v1.9 Requirements

Requirements for Phase 10. This milestone moves STOA from controlled pilot readiness into launch readiness and early commercial validation. Before real payment backend integration, the frontend must support a virtual payment flow so pricing, billing, subscription status, and checkout UX can be demonstrated and tested end to end.

### Pilot Review and Critical Bug Sprint

- [ ] **PILOT-01**: The team can review a `docs/pilot/pilot-review.md` summary covering participants, usage metrics, student feedback, parent feedback, tutor feedback, critical bugs, UX issues, value signals, pricing signals, recommended changes, and Phase 10 priorities.
- [ ] **PILOT-02**: Pilot feedback is categorized into critical bug, UX confusion, value confusion, missing feature, performance issue, trust issue, payment/pricing issue, and content/AI quality issue.
- [ ] **PILOT-03**: P0/P1/P2/P3 bug priority definitions and launch rules are documented.
- [ ] **PILOT-04**: P0/P1 bug fixes or workarounds can be tracked with reproduction steps, fix notes, QA evidence, and E2E coverage expectations.
- [ ] **PILOT-05**: Launch readiness docs make clear that P0 bugs must be fixed and P1 bugs must be fixed or have explicit workarounds before public launch.

### Student, Parent, and Tutor UX Iteration

- [ ] **UX-01**: Student dashboard shows next recommended actions such as continue last conversation, review weak topic, upload homework question, and ask a teacher.
- [ ] **UX-02**: Student chat empty state, new conversation flow, upload guidance, AI loading state, teacher-help CTA, recent conversations, and learning-history entry are clearer than the pilot version.
- [ ] **UX-03**: Parent dashboard first screen highlights whether the child is learning, recent questions, weak topics, teacher involvement, next parent action, and STOA value.
- [ ] **UX-04**: Parent report explains weak topics, weekly summary, teacher help records, and why the learning signal matters.
- [ ] **UX-05**: Parent dashboard and child report include lightweight upgrade/conversion CTAs.
- [ ] **UX-06**: Tutor request detail clearly shows student identity, grade, subject, student question, AI answer, student follow-up, required tutor action, and resolution controls.
- [ ] **UX-07**: Tutor resolved-state flow requires a short note or resolution explanation.
- [ ] **UX-08**: Tutor dashboard shows pending count, resolved-today count, and average response-time placeholder or value.
- [ ] **UX-09**: Core UX iteration emits or documents analytics events for parent report views, upgrade CTA clicks, pricing page views, pricing plan selections, checkout starts, tutor opens, status changes, and tutor notes.

### Pricing, Subscription Model, and Feature Flags

- [ ] **PRICE-01**: `/pricing` clearly explains STOA value, free trial, Student Plan, Family Plan, Tutor-supported Plan, pilot status, and why parents should pay.
- [ ] **PRICE-02**: Pricing tiers list included capabilities for AI learning chat, homework upload, learning history, parent dashboard, weekly parent reports, teacher help quota, and priority teacher support.
- [ ] **PRICE-03**: Pricing CTAs support current launch state through start free trial, join pilot, talk to us, and upgrade after pilot actions.
- [ ] **PRICE-04**: `docs/pricing/pricing-validation.md` records pricing assumptions, pilot signals, validation questions, and launch decision criteria.
- [ ] **PRICE-05**: `docs/pricing/subscription-model.md` defines subscription tiers, access matrix, and backend-owned enforcement boundaries.
- [ ] **PRICE-06**: User subscription types include `trial`, `active`, `inactive`, `expired`, `free_trial`, `student`, `family`, and `tutor_supported`.
- [ ] **FLAG-01**: Frontend feature flags include payment, mock checkout, public registration, teacher help, and parent report controls.
- [ ] **FLAG-02**: `.env.example` and README document production feature flags and safe defaults.

### Billing, Subscription UI, and Virtual Checkout

- [ ] **BILL-01**: Billing API client defines `GET /billing/subscription` and `POST /billing/checkout-session`.
- [ ] **BILL-02**: Billing hooks expose subscription query and create-checkout-session mutation using TanStack Query.
- [ ] **BILL-03**: `/billing` shows current plan, subscription status, trial end, upgrade path, and contact support path.
- [ ] **BILL-04**: Subscription badge, plan card, billing summary, and upgrade button components exist.
- [ ] **BILL-05**: The real payment path never collects card details in the frontend and redirects only to a backend-provided hosted checkout URL.
- [ ] **BILL-06**: Payment disabled state is clear and routes users to support, feedback, contact, or billing interest capture.
- [ ] **BILL-07**: Mock checkout flag enables a virtual checkout page for frontend demos and tests before the real backend exists.
- [ ] **BILL-08**: Virtual checkout can simulate plan selection, confirmation, success, and cancel states without real payment data.
- [ ] **BILL-09**: E2E or documented QA covers `/pricing` to `/billing` to virtual checkout success/cancel.
- [ ] **BILL-10**: Billing interest capture is represented through a documented frontend/backend contract or admin-visible placeholder.

### Parent Conversion Funnel

- [ ] **PARENT-01**: Parent dashboard includes a value explanation card that connects learning activity to parent decisions.
- [ ] **PARENT-02**: Parent report includes an upgrade prompt and pricing CTA.
- [ ] **PARENT-03**: Pricing CTA component can be reused from parent dashboard, report, and pricing surfaces.
- [ ] **PARENT-04**: Parent conversion funnel is documented from dashboard to report to value explanation to pricing CTA to pricing page to billing/contact.
- [ ] **PARENT-05**: Parent conversion analytics events are implemented or documented with privacy-safe payloads.

### Admin Operations

- [ ] **ADMIN-01**: `/admin/usage` is accessible to admins and shows usage summary data or clear backend-pending state.
- [ ] **ADMIN-02**: `/admin/feedback` is accessible to admins and shows feedback list data or clear backend-pending state.
- [ ] **ADMIN-03**: `/admin/help-requests` is accessible to admins and shows teacher help request data or clear backend-pending state.
- [ ] **ADMIN-04**: Admin route shells exist for users, support, billing interest, and system status.
- [ ] **ADMIN-05**: Admin API clients define users, feedback, support requests, usage summary, help requests, billing interest, and system status contracts.
- [ ] **ADMIN-06**: Admin query hooks exist for usage, feedback, help requests, and other Phase 10 admin contracts where useful.
- [ ] **ADMIN-07**: Non-admin users are blocked from admin pages and routed to `/forbidden`.
- [ ] **ADMIN-08**: Admin operations scope avoids full CRM, full BI, accounting, payroll, and school multi-tenant management.

### Tutor Operations

- [ ] **TUTOR-01**: Tutor help request queue shows status, priority placeholder, student context, subject, age/grade where available, and request age.
- [ ] **TUTOR-02**: Tutor request detail separates student question, AI answer, student follow-up, tutor notes, and status controls.
- [ ] **TUTOR-03**: Tutor notes can be submitted through a typed API contract.
- [ ] **TUTOR-04**: Marking a request resolved requires a resolution note.
- [ ] **TUTOR-05**: Tutor stats contract includes pending requests, resolved today, and average response time minutes.
- [ ] **TUTOR-06**: Tutor operation analytics record request opened, status changed, time to first action, resolved count, and note submitted events or documented placeholders.

### Privacy, Terms, Release, and Launch

- [ ] **LEGAL-01**: `/privacy` is updated to a launch-ready draft covering collected user data, student learning data, parent visibility, tutor visibility, data purpose, retention, deletion requests, contact, AI services, and third-party processing placeholders.
- [ ] **LEGAL-02**: `/terms` is updated to a launch-ready draft covering STOA as a learning aid, possible AI errors, review expectations, prohibited uploads, trial/subscription terms, service changes, termination, and contact.
- [ ] **LEGAL-03**: Registration requires terms/privacy consent before submit.
- [ ] **LEGAL-04**: App layout or footer links expose privacy and terms.
- [ ] **LAUNCH-01**: `docs/launch/release-process.md` documents branch/release flow, release gates, and environment checks.
- [ ] **LAUNCH-02**: `docs/launch/rollback-plan.md` documents deployment rollback, environment rollback, user communication, and new-registration pause procedures.
- [ ] **LAUNCH-03**: `docs/launch/post-launch-monitoring.md` documents 72-hour and first-week monitoring for login, chat, streaming, upload, teacher help, parent reports, checkout if enabled, and runtime errors.
- [ ] **LAUNCH-04**: `docs/launch/launch-checklist.md` covers CI, E2E, manual QA, P0/P1 status, environment variables, monitoring, analytics, support, privacy/terms, rollback, and launch approval.
- [ ] **LAUNCH-05**: README documents Phase 10 additions, launch flow, production feature flags, and billing API contracts.
- [ ] **LAUNCH-06**: Manual QA checklist includes pricing, billing, virtual checkout, parent conversion, tutor operations, admin operations, privacy/terms, and launch readiness checks.
- [ ] **LAUNCH-07**: E2E coverage includes the core demonstrable pricing/billing/virtual checkout flow where feasible.
- [ ] **LAUNCH-08**: `npm run build` remains passing at milestone completion.

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Paid Launch and Growth

- **PAY-REAL-01**: Real Stripe Checkout backend integration is enabled in production with provider price IDs owned by backend configuration.
- **SUB-ENF-01**: Backend enforces subscription access rules for message quota, upload quota, teacher-help quota, and parent-report access.
- **PORTAL-01**: Users can manage cancellation, invoices, and payment methods through a customer portal or support workflow.
- **GROWTH-01**: Parent acquisition funnel, referral/invitation, SEO, school partnership landing pages, and paid launch campaign support exist.
- **OPS-01**: Full support ticket system, operational analytics dashboard, churn/retention tracking, and tutor scheduling workflow exist.

## Out of Scope

Explicitly excluded from Phase 10.

| Feature | Reason |
|---------|--------|
| Full real payment processing | Phase 10 prepares contracts and demo flow; real provider rollout belongs to a backend-integrated paid launch phase. |
| Direct frontend card collection | Payment details must stay on hosted provider pages or test-only virtual screens. |
| Full subscription enforcement | Backend APIs must enforce true access and quota rules later. |
| Full CRM/helpdesk | Phase 10 only needs early operations visibility and support workflow continuity. |
| Complete accounting/invoice system | Not needed for pricing validation and first launch readiness. |
| Tutor payroll | Outside product launch readiness. |
| Complex coupons/promotions | Pricing validation needs simple tiers and CTAs. |
| Enterprise school dashboard and multi-tenant school system | Outside early commercial validation scope. |
| Full LMS courseware | STOA remains focused on AI learning help, parent visibility, and tutor support. |
| Large-scale A/B testing platform or data warehouse | Analytics events and admin usage views are enough for Phase 10. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PILOT-01 | Phase 48 | Planned |
| PILOT-02 | Phase 48 | Planned |
| PILOT-03 | Phase 48 | Planned |
| PILOT-04 | Phase 48 | Planned |
| PILOT-05 | Phase 48 | Planned |
| UX-01 | Phase 49 | Planned |
| UX-02 | Phase 49 | Planned |
| UX-03 | Phase 49 | Planned |
| UX-04 | Phase 49 | Planned |
| UX-05 | Phase 49 | Planned |
| UX-06 | Phase 50 | Planned |
| UX-07 | Phase 50 | Planned |
| UX-08 | Phase 50 | Planned |
| UX-09 | Phase 49 | Planned |
| PRICE-01 | Phase 51 | Planned |
| PRICE-02 | Phase 51 | Planned |
| PRICE-03 | Phase 51 | Planned |
| PRICE-04 | Phase 51 | Planned |
| PRICE-05 | Phase 51 | Planned |
| PRICE-06 | Phase 52 | Planned |
| FLAG-01 | Phase 52 | Planned |
| FLAG-02 | Phase 52 | Planned |
| BILL-01 | Phase 52 | Planned |
| BILL-02 | Phase 52 | Planned |
| BILL-03 | Phase 52 | Planned |
| BILL-04 | Phase 52 | Planned |
| BILL-05 | Phase 52 | Planned |
| BILL-06 | Phase 52 | Planned |
| BILL-07 | Phase 52 | Planned |
| BILL-08 | Phase 52 | Planned |
| BILL-09 | Phase 55 | Planned |
| BILL-10 | Phase 53 | Planned |
| PARENT-01 | Phase 49 | Planned |
| PARENT-02 | Phase 49 | Planned |
| PARENT-03 | Phase 51 | Planned |
| PARENT-04 | Phase 51 | Planned |
| PARENT-05 | Phase 49 | Planned |
| ADMIN-01 | Phase 53 | Planned |
| ADMIN-02 | Phase 53 | Planned |
| ADMIN-03 | Phase 53 | Planned |
| ADMIN-04 | Phase 53 | Planned |
| ADMIN-05 | Phase 53 | Planned |
| ADMIN-06 | Phase 53 | Planned |
| ADMIN-07 | Phase 53 | Planned |
| ADMIN-08 | Phase 53 | Planned |
| TUTOR-01 | Phase 50 | Planned |
| TUTOR-02 | Phase 50 | Planned |
| TUTOR-03 | Phase 50 | Planned |
| TUTOR-04 | Phase 50 | Planned |
| TUTOR-05 | Phase 50 | Planned |
| TUTOR-06 | Phase 50 | Planned |
| LEGAL-01 | Phase 54 | Planned |
| LEGAL-02 | Phase 54 | Planned |
| LEGAL-03 | Phase 54 | Planned |
| LEGAL-04 | Phase 54 | Planned |
| LAUNCH-01 | Phase 54 | Planned |
| LAUNCH-02 | Phase 54 | Planned |
| LAUNCH-03 | Phase 54 | Planned |
| LAUNCH-04 | Phase 54 | Planned |
| LAUNCH-05 | Phase 55 | Planned |
| LAUNCH-06 | Phase 55 | Planned |
| LAUNCH-07 | Phase 55 | Planned |
| LAUNCH-08 | Phase 55 | Planned |

**Coverage:**
- v1.9 requirements: 62 total
- Mapped to phases: 62
- Planned: 62
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after v1.9 roadmap creation*
