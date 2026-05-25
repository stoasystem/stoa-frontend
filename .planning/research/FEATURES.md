# Research: Feature Expectations for v1.9 Phase 10

## Table Stakes

### Pilot Feedback and Bug Sprint

- Consolidated pilot review document.
- Feedback categorized into critical bugs, UX confusion, value confusion, missing features, performance, trust, payment/pricing, and AI quality.
- P0/P1 bug list with fix or workaround status.
- QA checklist updates and E2E coverage for core flow fixes.

### Core UX Iteration

- Student dashboard next-action cards and clearer continue-learning entry points.
- Chat empty state, upload guidance, response loading, teacher-help CTA, and recent conversation clarity.
- Parent dashboard and report surfaces that explain child activity, weak topics, teacher help, and why STOA matters.
- Tutor request detail that makes student, subject, context, AI answer, required action, and resolution path clear.

### Pricing and Conversion

- `/pricing` must explain Free Trial, Student Plan, Family Plan, and Tutor-supported Plan.
- CTAs should support current launch state: start free trial, join pilot, talk to us, upgrade after pilot.
- Parent dashboard/report should include upgrade prompts that test willingness to pay.
- Analytics should track pricing and conversion events without blocking the user flow.

### Billing and Subscription Preparation

- `/billing` shows plan, subscription status, trial end, upgrade path, and support path.
- Subscription badge and plan cards show current state clearly.
- Billing API client and hooks define the future backend contract.
- Virtual checkout mode allows complete pricing-to-success demo before a real backend exists.

### Admin and Tutor Operations

- Admin can view usage, feedback, and help requests at minimum.
- Additional admin routes can be placeholders if the contract and route shell are clear.
- Tutor dashboard shows pending count, resolved-today count, and average response-time placeholder.
- Resolved tutor requests require a short note.

### Legal and Launch

- Privacy and terms drafts become launch-ready frontend copy.
- Register flow includes terms consent.
- Footer/layout links expose privacy and terms.
- Release process, rollback plan, post-launch monitoring, launch checklist, and README reflect Phase 10.

## Differentiators

- Frontend-only virtual checkout makes stakeholder demos and automated tests possible before payment infrastructure is live.
- Parent value explanations connect learning activity to willingness-to-pay testing.
- Tutor operations metrics create a lightweight service-quality loop without implementing payroll or scheduling.
- Admin billing-interest visibility gives the team commercial signal before charging real users.

## Anti-Features

- Full payment enforcement.
- Direct card entry in the STOA frontend.
- Full CRM or accounting.
- Complex school tenant management.
- Complete tutor payroll.
- Large-scale A/B testing or growth automation.
