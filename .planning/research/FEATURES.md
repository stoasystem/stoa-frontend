# Feature Landscape: STOA Frontend v1.10 Phase 11

**Domain:** Paid launch frontend, parent acquisition funnel, referrals, tutor operations, support, analytics, campaign attribution, and demo API behavior  
**Researched:** 2026-05-25  
**Overall confidence:** MEDIUM-HIGH

## Research Position

Phase 10 already shipped pricing validation, subscription UI, billing contracts, virtual checkout, parent conversion prompts, tutor operations improvements, and basic admin launch routes. Phase 11 should not rebuild those surfaces. It should turn them into a frontend-only paid launch operating layer: acquisition pages, referral/invite flows, usage/quota visibility, feature-gating states, support tickets, tutor availability, operational dashboards, UTM attribution, and deterministic demo/mock API behavior.

The main product constraint remains important: this milestone must not become the real payments, subscriptions, analytics, support, or database backend. The frontend should define contracts, render credible UI states, and support mock/demo flows. Real Stripe Checkout sessions, Customer Portal sessions, webhooks, quota enforcement, support persistence, analytics aggregation, and database durability stay backend-owned.

## Table Stakes

Features users, operators, or launch stakeholders will expect. Missing these makes the paid launch UI feel incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Paid launch route group | Paid launch needs a coherent entry point instead of scattered pages. | Low | Keep `/pricing` and `/billing`; add growth routes such as `/parents`, `/how-it-works`, `/ai-homework-help`, `/teacher-support`, `/schools`, and `/tutoring-centers`. |
| Parent acquisition landing pages | Paid parent traffic needs pages that match ad/search/referral intent. Google Ads emphasizes useful, relevant information and expectation match after an ad click. | Medium | Each page needs one primary CTA, parent-specific proof, learning-value copy, pricing/trial route, FAQ, privacy/trust links, and mobile-first layout. |
| SEO metadata for acquisition pages | Search snippets and title links influence whether users click. | Low | Add per-page title, description, canonical intent, and structured-content-ready sections. Avoid relying on SPA body text alone if static hosting can support metadata. |
| Clear pricing-to-checkout path | Users expect plan selection to continue into payment or a clear disabled/mock state. Stripe Checkout is the preferred direction because payment details stay on hosted/embedded Stripe UI, not STOA UI. | Medium | Frontend starts checkout through backend contract only; when mock mode is enabled, route to explicit virtual checkout. |
| Billing status and manage-billing entry | Paying users expect to see current plan, trial/active/past-due/canceled states, renewal or trial end, and a way to manage billing. | Medium | Real manage billing should be a backend-created Stripe Customer Portal session. Until then, show backend-pending/demo states and support path. |
| Usage quota display | Subscription plans need visible consumption for AI messages, uploads, teacher help, parent reports, or family seats. | Medium | Display advisory quota in frontend; backend must enforce real quotas later. Show remaining/used/reset date and unavailable/error states. |
| Feature gating UI | Paid features need understandable locked, trial, quota-exceeded, and upgrade states. | Medium | Gate UI should explain value and next action; do not rely on frontend gates for security or entitlement enforcement. |
| Checkout success/cancel recovery | Users returning from hosted checkout or virtual checkout need confirmation, plan refresh, and next action. | Low | Include `success`, `cancelled`, and `pending verification` states. Avoid assuming payment success from URL alone in real mode. |
| Referral dashboard | Parents need an obvious place to invite another parent or family member. | Medium | Show referral link/code, copy action, share email text, invite status placeholder, and conversion reward copy if enabled. |
| Invitation acceptance page | Invitees need a dedicated landing/registration path that preserves invite context. | Medium | Capture `invite`, `ref`, or token query params; validate shape client-side; send token/code in registration payload. Backend owns final validation and expiry. |
| Referral attribution propagation | Referral programs fail if referral codes are lost between landing, registration, and checkout. | Medium | Persist referral code and UTM context through register and checkout-start payloads. Prefer short-lived session/local storage with explicit allowlist. |
| Cognito-compatible invite UX | Current stack uses Cognito/Amplify. Cognito supports admin-created invited users and customizable invite messages, but frontend still needs an acceptance/onboarding surface. | Medium | Treat Cognito invite email as an auth primitive; STOA referral/invite state is product data that backend validates. |
| Tutor availability editor | Tutors need to set when they can help students before scheduling or assignment workflows are credible. | Medium | Table stakes: weekly hours, date-specific overrides, timezone display, subject/grade coverage, max requests or capacity indicator. Calendly-like products expose weekly schedules, date-specific hours, and event-type-specific schedules. |
| Tutor subject and coverage settings | Matching help requests requires visible tutor capability metadata. | Low | Subject, grade band, language, response mode, and notes. Keep payroll, automatic routing, and live scheduling out of scope. |
| Tutor unavailable states | Students/admins need to know if human help is temporarily unavailable. | Low | Show unavailable/limited-capacity state and support escalation route; do not promise immediate help without backend capacity rules. |
| User support ticket creation | Paid users expect a support path beyond generic feedback. Zendesk-style tickets commonly include subject, description, status, priority, requester, assignee, tags/custom fields. | Medium | User form should capture category, subject, description, role, affected child/request, severity, and contact permission. Avoid file content uploads unless already supported safely. |
| User support ticket list and detail | Users need to track open and resolved support issues. | Medium | Show ticket status, last update, comments, and next expected action. Start with simple statuses: open, pending, resolved, closed. |
| Admin support triage | Operators need a queue with filters and status changes. | Medium | Admin can filter by status/category/severity, open detail, add note, update status in mock/demo mode. Backend owns persistence and notifications later. |
| Operational analytics dashboard | Admin launch needs more than raw event lists. Product analytics tools commonly organize funnels, retention, journeys, cohorts, and dashboards. | High | Provide overview cards and trend placeholders for acquisition, activation, subscription intent, conversion, usage, support, tutor responsiveness, and churn/retention signals. |
| Billing/conversion analytics | Paid launch decisions require visibility into pricing views, plan selections, checkout starts, checkout outcomes, subscription states, quota blocks, and manage-billing clicks. | Medium | Keep event names and payloads privacy-safe; do not include chat content, tokens, uploaded file content, or full support text. |
| Parent acquisition funnel analytics | Operators need attribution from acquisition page to registration and checkout. | Medium | Funnel: acquisition page view -> CTA click -> register start -> register complete -> pricing view -> checkout start -> success/cancel/support. |
| Support analytics | Support load affects paid launch quality. | Medium | Track created/open/resolved counts, response age, category distribution, high severity, and unresolved aging. |
| Tutor operations analytics | Tutor availability and help quality require operational metrics. | Medium | Track tutor availability completeness, active tutors, pending help requests, first action time, resolved count, overdue requests, and unavailable coverage gaps. |
| Churn/retention placeholders | Paid launch needs early retention and cancellation-risk visibility even before full BI. | Medium | Show trial ending soon, inactive paid users, quota exhausted, canceled/past-due placeholders. Mark backend-pending clearly. |
| UTM capture utility | Campaign links use UTM parameters to identify traffic source/campaign; Google recommends setting relevant UTM fields together to avoid `(not set)` reporting. | Medium | Whitelist `utm_source`, `utm_medium`, `utm_campaign`, `utm_id`, `utm_source_platform`, `utm_content`, `utm_term`; persist first touch and latest touch. |
| UTM propagation to key payloads | Attribution is useful only if it reaches registration, checkout, referral, and support/contact flows. | Medium | Add campaign context to analytics events and frontend API payloads. Scrub unknown query params and never persist tokens/passwords. |
| Paid launch analytics taxonomy | Events need consistent names before dashboards are meaningful. | Medium | Include page views, CTA clicks, referral copied, invite accepted, register completed, pricing selected, checkout started, checkout succeeded/canceled, quota viewed/exceeded, ticket created, ticket resolved, tutor availability saved. |
| Demo/mock API mode | Phase 11 is frontend-only, so UI needs deterministic data for demos and E2E. MSW supports reusable network-level REST/GraphQL mocks in browser and tests; Vite modes/env vars can gate this behavior. | High | Prefer MSW for browser/test mocks where feasible; local FastAPI/SQLite remains demo/test-only. Provide clear `VITE_ENABLE_MOCK_API` and visible demo banner. |
| Mock scenarios | Stakeholders need to see success, empty, loading, error, expired, quota-exceeded, past-due, no-availability, and high-support-load states. | Medium | Add scenario selector in development/demo only or route/query-driven fixtures guarded by env. |
| Demo data reset and docs | Repeatable demos require resettable seed state and known accounts. | Medium | Document reset steps and scope. Do not treat demo persistence as production architecture. |
| E2E coverage for paid launch path | Core paid launch flows need regression coverage. | Medium | Cover acquisition page -> UTM/referral capture -> register payload support -> pricing -> mock checkout success/cancel -> billing quota/gate -> support ticket -> admin overview. |

## Differentiators

Not mandatory for the first paid launch UI, but valuable if the roadmap has room after table stakes.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Parent value proof ladder | Connects student usage to parent willingness to pay. | Medium | Show weekly learning proof, weak-topic improvement, tutor involvement, and "why this matters" before upgrade CTAs. |
| Referral context on landing pages | Makes referred traffic feel personal. | Medium | "Invited by [first name/family]" if backend provides safe display data; otherwise generic invited-state copy. |
| Family invite split | Supports both parent-to-parent referral and parent inviting a co-parent/child. | High | Requires careful role and consent handling; good later, not essential for Phase 11 MVP. |
| Availability completeness score | Helps operators see which tutors are ready for paid launch. | Low | Simple admin/tutor indicator: subjects set, timezone set, weekly hours set, date overrides reviewed. |
| Operational health rail | Gives admins a single daily launch-readiness view. | Medium | Combine conversion, support backlog, tutor capacity, checkout issues, and high-error indicators. |
| Attribution debug panel | Makes campaign QA easier before paid traffic starts. | Low | Dev/demo-only panel showing first-touch/latest-touch/referral context and payload propagation. |
| Demo scenario switcher | Speeds stakeholder demos and QA. | Medium | Select plan/status/support/tutor availability scenarios without modifying code or backend state. Keep disabled in production builds. |

## Anti-Features

Features to explicitly not build in Phase 11.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Direct card entry in STOA frontend | Increases payment and compliance scope. | Use backend-created Stripe Checkout or Customer Portal sessions; mock checkout must be clearly virtual. |
| Frontend-only subscription enforcement as security | Users can bypass browser checks. | Show advisory gates in UI; backend enforces real entitlements later. |
| Production support backend in frontend repo | Violates Phase 11 frontend-only boundary. | Define ticket contracts, mock data, local/demo support only, and backend requirements. |
| Production analytics warehouse or BI platform | Too much scope for the milestone. | Build event taxonomy, admin dashboard UI, mock/demo aggregates, and backend contract expectations. |
| Full CRM | Not required for early paid launch UI. | Provide support/admin queues and billing-interest views only. |
| Tutor payroll, contracts, or compensation workflows | Operationally sensitive and outside paid launch frontend. | Limit to availability, subjects, capacity, and help-request readiness. |
| Automatic tutor scheduling/routing engine | Requires backend matching logic, calendars, and operational policy. | Show availability and admin/tutor readiness UI; backend scheduling can come later. |
| Complex coupons, affiliate payouts, or reward accounting | Referral value is not validated yet and backend accounting is absent. | Capture referral codes and invite events; show simple "reward pending" placeholder if needed. |
| Large-scale A/B testing platform | Premature without traffic volume and analytics backend. | Use static landing variants only if required; track page/source/campaign consistently. |
| Persisting arbitrary query params | Can leak sensitive data and pollute analytics. | Persist an explicit UTM/referral allowlist only. |
| Storing support ticket body or chat contents in analytics | Privacy and safety risk. | Use category/status/count metadata only. |
| Treating SQLite/MSW/local FastAPI as production architecture | Prior local backend exists only to unblock frontend demos and tests. | Label all demo/mock paths and docs clearly as non-production. |

## Feature Dependencies

```text
UTM capture utility -> Acquisition page analytics -> Registration/checkout attribution
Referral code capture -> Registration payload support -> Referral admin/conversion visibility
Pricing plan selection -> Checkout-start contract -> Billing success/cancel states -> Subscription/quota UI
Subscription/quota contract -> Feature-gating UI -> Upgrade/checkout CTAs
Tutor subject settings -> Tutor availability editor -> Admin tutor capacity view
Support ticket create/list/detail -> Admin support queue -> Support operational analytics
Analytics event taxonomy -> Admin operational analytics dashboard -> Launch-readiness review
Mock API handlers/fixtures -> Demo scenarios -> E2E coverage and stakeholder demo flow
Demo backend boundary docs -> Mock/demo implementation -> README/QA handoff
```

## MVP Recommendation

Prioritize:

1. UTM/referral context plumbing first, because acquisition, registration, checkout, analytics, and admin dashboards all depend on consistent attribution.
2. Billing/quota/feature-gating UI next, because paid launch must make plan value, limits, locked states, and checkout paths visible even before backend enforcement.
3. Parent acquisition pages after the tracking foundation, because these pages are only useful if their CTAs and conversion source are measurable.
4. Support ticket and tutor availability UI in parallel, because they are operational readiness surfaces with mostly independent data contracts.
5. Admin operational analytics after event names, support contracts, tutor availability contracts, and billing/quota contracts exist; otherwise the dashboard will be a pile of placeholders.
6. Demo/mock API behavior throughout the milestone, not at the end, so every page can be developed and tested without production backend dependencies.

Defer:

- Real Stripe webhook handling, subscription persistence, and quota enforcement: backend-owned.
- Customer Portal implementation beyond frontend contract and placeholder: requires backend session creation.
- Referral reward accounting and payout: not needed until referral conversion is validated.
- Calendar integrations for tutor availability: start with STOA-owned availability settings and mock/demo contracts.
- Full BI/warehouse/churn models: use operational summary cards and event-contract documentation first.

## Suggested Phase Slices

1. **Demo/API Boundary and Launch Tracking Foundation**
   - Demo/mock API mode, fixture strategy, UTM/referral capture, paid launch analytics event taxonomy.
   - Avoids building growth pages before attribution plumbing exists.

2. **Billing, Quotas, and Feature Gates**
   - Plan usage UI, quota cards, locked states, checkout-start contract, manage-billing placeholder, mock checkout scenario coverage.
   - Keeps payment details hosted/backend-owned.

3. **Parent Acquisition and Referral Flow**
   - Landing pages, SEO metadata, CTA routing, referral dashboard, invite acceptance, registration payload propagation.
   - Builds on tracking and billing CTAs.

4. **Tutor Availability and Support Tickets**
   - Tutor availability/subject settings, user support tickets, admin support triage, mock status updates.
   - Separates operational readiness from acquisition work.

5. **Admin Operational Analytics and QA**
   - Admin dashboard for conversion, billing, support, tutor capacity, retention/churn placeholders; E2E and documentation.
   - Uses event contracts and mock aggregates from earlier slices.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Paid launch UI | HIGH | Stripe hosted Checkout/Customer Portal patterns are current official guidance; project constraints already require no direct card handling. |
| Parent acquisition pages | MEDIUM | Google Ads/Search docs support relevance, navigation, title/snippet, and structured content; exact page content depends on STOA positioning and ads. |
| Referral/invitation | MEDIUM | Cognito supports admin-created invitations and custom messages; STOA-specific referral tracking/reward UX needs backend/product policy later. |
| Tutor availability | MEDIUM-HIGH | Scheduling products converge on weekly hours, date overrides, timezone, and event-specific schedules; STOA can start with simpler availability settings. |
| Support tickets | MEDIUM-HIGH | Zendesk-style ticket fields/statuses provide a strong pattern; STOA should keep the initial version narrower. |
| Admin analytics | MEDIUM | Product analytics tools converge on funnels, retention, cohorts, and dashboards; STOA should avoid full BI until backend data exists. |
| UTM tracking | HIGH | Google Analytics docs clearly define campaign URL parameters and recommend complete UTM sets. |
| Demo/mock API | HIGH | MSW and Vite docs support env-gated browser/test mocks; project constraints already require demo/backend boundary clarity. |

## Sources

- Stripe Checkout docs, hosted/embedded payment UI and Checkout Sessions: https://docs.stripe.com/payments/checkout — HIGH confidence.
- Stripe embeddable pricing table docs, subscription table limits, Checkout handoff, Customer Portal link, and sensitive `client-reference-id` warning: https://docs.stripe.com/payments/checkout/pricing-table — HIGH confidence.
- Stripe Customer Portal docs, self-service payment details, invoices, and subscription management: https://docs.stripe.com/billing/subscriptions/customer-portal — HIGH confidence.
- Google Analytics URL builder docs, UTM campaign parameters and recommendation to set relevant UTM fields together: https://support.google.com/analytics/answer/10917952?hl=en — HIGH confidence.
- Google Analytics recommended events docs, recommended event names and reporting utility: https://support.google.com/analytics/answer/9267735 — HIGH confidence.
- Google Ads landing page definition, relevance/usefulness/ease of navigation/expectation matching: https://support.google.com/google-ads/answer/14086 — HIGH confidence.
- Google Search Central SEO starter guide, title links, snippets, and structured data eligibility: https://developers.google.com/search/docs/fundamentals/seo-starter-guide — HIGH confidence.
- Amazon Cognito user account creation docs, admin-created invited users and customizable invite messages: https://docs.aws.amazon.com/cognito/latest/developerguide/how-to-create-user-accounts.html — HIGH confidence.
- Calendly availability docs, weekly hours, date-specific hours, assigning schedules, and event-specific custom hours: https://help.calendly.com/hc/en-us/articles/14074797893143-How-to-set-your-availability — MEDIUM-HIGH confidence.
- Zendesk ticket fields docs, standard ticket fields, status, priority, and tags/custom fields: https://support.zendesk.com/hc/en-us/articles/4408886739098-About-ticket-fields — MEDIUM-HIGH confidence.
- Amplitude analytics docs, funnels, retention, journeys, cohorts, dashboards, and account-level reporting patterns: https://amplitude.com/docs/analytics — MEDIUM confidence.
- Mock Service Worker docs, browser/Node request interception and reusable mocks: https://mswjs.io/ — HIGH confidence.
- Vite env variables and modes docs, mode-specific env priority and `import.meta.env` behavior: https://vite.dev/guide/env-and-mode — HIGH confidence.
