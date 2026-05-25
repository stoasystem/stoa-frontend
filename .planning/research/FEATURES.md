# Feature Landscape

**Domain:** Production-facing frontend cleanup, stability hardening, and demo artifact removal  
**Project:** STOA Frontend  
**Researched:** 2026-05-26  
**Overall confidence:** HIGH from `.planning/PROJECT.md`, `.planning/MILESTONES.md`, Phase 17 copy/visual QA docs, locale files, route metadata, and source grep of user-visible artifact wording.

## Executive Framing

Phase 18 should not add new STOA business features. Its value is making the existing multilingual product surface feel production-facing by removing development/demo/test language from customer-visible UI, hiding demo-only affordances unless explicitly enabled, and hardening states that users will see when APIs are slow, empty, rejected, or unavailable.

The repo already has broad product UI: homepage, login/register/onboarding, chat, parent reports, tutor workflows, pricing, billing, support, admin operations, organization/demo routes, and multilingual copy. That breadth creates the Phase 18 risk: older demo milestones intentionally exposed words such as `demo`, `mock`, `test`, `placeholder`, `virtual checkout`, and direct internal statuses. Those terms remain useful in docs and developer-only flows, but they should not appear on default production-facing customer paths.

The cleanup should distinguish "production-facing" from "production backend complete." STOA can still route through demo/local APIs for development and E2E, but the user-facing copy should say what the product does, not how the frontend is being tested. Where a flow is not live in production, the UI should either hide it, disable it with product-safe copy, or route to support/waitlist language.

## Cleanup Categories

### P0 - Must Fix for Production-Facing Surface

These categories block Phase 18 completion if visible on default app paths.

| Category | Surfaces | Expected Outcome | Notes |
| --- | --- | --- | --- |
| User-visible artifact wording | Homepage, login, register, chat, parent, tutor, pricing, billing, support, admin | Default user journeys do not display `demo`, `mock`, `test`, `Codex`, `development`, `sample`, `placeholder`, `virtual checkout`, or similar internal wording. | Permit terms only in developer docs, QA docs, env variable names, internal identifiers, and explicitly flagged local demo mode. |
| Demo-only login shortcuts | Login and onboarding | Demo account chooser is hidden unless an explicit demo flag is enabled and the app is not production. | Existing `enableDemoShortcuts` is a starting point; Phase 18 should make production fail closed. |
| Payment/demo checkout wording | Pricing, billing, checkout result pages | Customer-facing copy describes hosted checkout, plan review, trial, or contact support. Demo checkout pages are hidden/blocked outside explicit demo mode. | Current English billing/pricing contains direct "demo checkout" and "demo" wording. |
| Internal status labels | Billing plans, teacher help, tutor queues, admin, support | Users see mapped labels such as "Trial", "Teacher-supported", "Teacher is reviewing", not raw values like `free_trial`, `tutor_supported`, `pending_review`, `in_progress`, or endpoint names. | Add or centralize display-label helpers where values come from API contracts. |
| Loading/empty/error/success states | Chat, parent, tutor, billing, support, admin | Every P0 flow has non-jarring loading, empty, error, success, retry, and fallback states using localized product copy. | Phase 17 visual QA already covered layout; Phase 18 should cover state behavior. |
| Duplicate-submit prevention | Login/register, chat send, teacher request, tutor update, billing action, support ticket | Primary actions disable while pending, avoid double network submissions, and show clear success/failure feedback. | Current code has some mutation pending states; Phase 18 should audit across P0/P1 flows. |
| Route fallback behavior | Protected routes, unknown routes, disabled demo routes | Unauthorized, forbidden, not found, and disabled-feature routes explain next steps without technical wording. | Demo/placeholder routes should not look like broken production pages. |
| Multilingual parity | EN/DE/FR/IT P0 copy | Cleanup is applied across all four locale files, not only English. | Phase 17 established natural locale copy; Phase 18 must not regress it. |

### P1 - Important Follow-Up in Same Milestone if P0 Is Stable

These items are visible enough to hurt confidence, but can follow P0 cleanup.

| Category | Surfaces | Expected Outcome | Notes |
| --- | --- | --- | --- |
| Public marketing/demo-adjacent pages | `/for-parents`, `/how-it-works`, `/teacher-support`, `/for-schools`, `/for-tutoring-centers`, partnership onboarding | Public pages avoid "demo" framing and use product-safe interest/onboarding language. | Keep school/organization claims conservative because production multi-tenant backend is out of scope. |
| P1 account and history pages | Profile, learning history, parent child history, tutor availability | Empty/error/loading states are consistent with P0 surfaces and free of internal wording. | These are secondary but likely reached during demos and pilots. |
| Support ticket lists/details | User and admin support ticket flows | Tickets show understandable statuses, timestamps, and recovery actions. | Avoid exposing backend codes unless needed for support diagnostics in admin-only details. |
| Admin operations | Admin dashboard, usage, analytics, help requests, support | Admin can see operational labels, but not fake-production claims or raw endpoint placeholder cards on primary surfaces. | Admin may retain more technical copy than parents/students, but it still must read as an operations product. |
| Documentation handoff | README, release checklist, QA docs | Clear distinction between production-facing UI, local demo mode, and developer/test docs. | Update docs after UI audit so handoff reflects actual behavior. |

### P2 - Defer or Keep Behind Demo/Internal Gates

These should not consume Phase 18 unless they are accidentally exposed in P0/P1 flows.

| Category | Surfaces | Expected Outcome | Notes |
| --- | --- | --- | --- |
| Organization and learning-intelligence demos | Organization dashboard, diagnosis, curriculum graph, tutor assignment, retention, advanced analytics | Hidden by default or clearly gated as internal/demo exploration, not promoted as live product. | Production multi-tenant, diagnosis engine, curriculum graph backend, and tutor matching remain out of scope. |
| Legacy placeholder routes | Deprecated student/teacher/parent placeholder pages, admin placeholder routes | Hidden from nav and not part of acceptance unless reachable from a production-facing route. | Consider redirecting or removing later; Phase 18 can document if not visible. |
| Full legal/compliance rewrite | Privacy/terms legal content | Avoid obvious placeholder wording, but do not claim legal finality. | Professional legal review remains a separate milestone. |
| Full visual regression platform | Automated screenshot diffing | Optional future hardening. | Phase 18 should create repeatable QA evidence, not build a large test platform. |

## Surface Priorities

| Priority | Surface | Routes / Files to Audit | Phase 18 Expectations |
| --- | --- | --- | --- |
| P0 | Login | `/login`, `src/components/auth/LoginForm.tsx`, `auth.json` | Hide demo shortcuts by default; remove "Use demo account" in production; prevent duplicate sign-in; make failed auth copy actionable and localized. |
| P0 | Register / onboarding | `/register`, auth step components, tutor credential upload, `auth.json` | Copy should describe real onboarding paths without implying real tutor verification/OCR/admission decisions. Pending review should be product language, not raw `pending_review`. |
| P0 | Chat | `/chat`, chat components, `chat.json` | Student messages, uploads, streaming, retry, stop generation, empty state, teacher request, and quota states should be stable and localized; no provider/Codex wording. |
| P0 | Parent | `/parent`, child summary, report, history, `parent.json` | Parent reports should avoid mock/demo claims, raw child IDs, and alarmist language; empty child/report states need next steps. |
| P0 | Tutor | `/tutor`, request detail, status update, availability, `tutor.json` | Tutor queues should show professional workflow states; disable duplicate status/note submits; map raw statuses to labels. |
| P0 | Pricing | `/pricing`, pricing components, `pricing.json` | Explain plan value and checkout readiness without "demo" wording unless demo mode is explicit; no aggressive sales copy. |
| P0 | Billing | `/billing`, checkout result routes, billing components, `billing.json` | Payment disabled/mock checkout copy should become product-safe default copy; demo checkout route should be gated; no card handling implied. |
| P0 | Support | `/support`, ticket form/list/detail, `support.json` | Support flows should have stable submit success/error/empty states and no feedback-tool/test language. |
| P0 | Admin primary operations | `/admin`, `/admin/help-requests`, `/admin/support`, `/admin/usage` | Admin copy can be operational but should not display "mock admin ticket queue", "demo launch dashboard", or endpoint placeholder language on primary routes. |
| P1 | Public marketing and acquisition | `/`, `/for-parents`, `/how-it-works`, `/teacher-support`, partnership pages, `home.json` | Remove "Demo-ready today" and similar public claims; use production-safe product proof or invitation language. |
| P1 | Account and learning history | `/profile`, `/learning-history`, parent child history | Consistent loading/empty/error states; avoid placeholder profile/history data wording. |
| P1 | Admin analytics/support detail | `/admin/analytics`, support detail routes | Map statuses and metrics; keep technical labels only where useful to operators. |
| P2 | Organization and advanced demos | `/organization/*`, `/students/:id/diagnosis`, `/curriculum-graph`, advanced analytics, retention | Keep hidden or explicit internal mode; do not spend Phase 18 polishing as production product unless default navigation exposes them. |

## Table Stakes

Features users and maintainers should expect. Missing items mean the product still feels like a development/demo app.

| Feature / Work Category | Why Expected | Complexity | Acceptance Criteria |
| --- | --- | --- | --- |
| Production-facing terminology audit | The milestone is explicitly about removing demo/test/mock/Codex/development wording from user-facing UI. | Medium | Grep/audit passes for user-visible source and locale JSON; exceptions are documented as developer-only/internal. |
| P0 locale copy cleanup | Phase 17 made copy natural; Phase 18 must keep all four locales clean. | High | EN/DE/FR/IT auth, chat, pricing, billing, support, parent, tutor, admin/home P0 strings avoid artifact wording and preserve local tone. |
| Demo-account guard hardening | Demo shortcuts are useful locally but harmful in production-facing flows. | Medium | Demo account chooser appears only when explicit flag is enabled and environment/API mode allows it; production cannot expose it by flag accident. |
| Demo/mock checkout guard | Billing is a high-trust surface. | Medium | Virtual/mock checkout routes and CTAs are unavailable or product-safely replaced outside explicit local/demo mode. |
| API/demo fallback guard | Production/staging should not silently use fallback data. | Medium | `allowDemoFallback` behavior is documented and verified; production/staging examples fail closed with user-safe errors. |
| Display-label mapping | Internal enum values are unavoidable in API contracts but should not leak to users. | Medium | Shared label mapping exists for subscription plans, subscription statuses, help-request statuses, support statuses, onboarding/review statuses, and route/status badges. |
| Loading state audit | Slow APIs should look intentional, not broken. | Medium | P0 pages render skeleton/loading text that is localized, non-technical, and does not trap authenticated users indefinitely. |
| Empty state audit | Empty accounts are normal in production. | Medium | First-use states explain what to do next for chat, parent children/reports, tutor queue, billing plans, support tickets, and admin queues. |
| Error state audit | API/backend failures are normal production conditions. | Medium | P0 failures show localized message, retry or support path, and no raw stack, endpoint, provider, or `{ code }` object. |
| Success state audit | Users need confirmation after submits. | Low | Register, login, chat send, teacher request, tutor update, billing action, support ticket, and admin actions show clear success or navigation. |
| Duplicate-submit prevention | Double sends create bad product data and confusing UI. | Medium | Mutating buttons are disabled while pending or idempotent; rapid double-clicks do not create duplicate chat messages, teacher requests, tickets, or status updates. |
| Route fallback and disabled-feature UX | Users will hit stale links and guarded routes. | Low | Not found, unauthorized, forbidden, disabled checkout, disabled support ticket, and disabled referral routes give user-safe next steps. |
| Production-facing QA evidence | Cleanup is easy to regress without an artifact. | Low | Add/update QA checklist with route x locale x environment checks and grep evidence. |
| README/release checklist update | Future phases need the production/demo boundary preserved. | Low | README explains production-facing mode, local demo mode, guard flags, and cleanup verification commands. |

## Required Copy Audit Items

Phase 18 should audit these terms in user-facing source (`src/pages`, `src/components`, `src/i18n/locales`) and classify each hit as remove, replace, gate, or allow as internal.

| Term / Pattern | Default User-Facing Rule | Preferred Replacement |
| --- | --- | --- |
| `demo`, `demo account`, `Demo-ready`, `demo checkout` | Remove or gate behind explicit local demo mode. | "Try STOA", "Plan review", "Preview account" only if intentionally non-production; otherwise hide. |
| `mock`, `mock checkout`, `mock data` | Remove from UI. | "Plan review", "secure checkout when available", or developer-only docs. |
| `test`, `testing-stage` | Remove from UI unless referring to academic tests. | "Review", "trial", "setup", or docs-only technical wording. |
| `Codex`, provider names | Never visible in frontend product UI. | "Learning Assistant" or backend/service wording in developer docs only. |
| `development`, `dev`, `debug` | Remove from user surfaces; allow in docs and environment cards only if admin/internal. | "Local setup" in docs; hide in product UI. |
| `sample` | Avoid in user data labels. | "Example" only in form placeholders where helpful, otherwise real product labels. |
| `placeholder`, `future`, `not implemented` | Hide or replace with product-safe unavailable state. | "This area is not available yet. Contact STOA support." |
| `virtual checkout` | Avoid on production-facing billing. | "Checkout review" or "secure hosted checkout" depending environment. |
| Raw enum/status values | Never render directly. | Localized display labels. |
| Endpoint/method labels such as `GET /admin/users` | Avoid outside developer docs/admin diagnostics. | Product object label, e.g. "User management". |

### Copy Areas That Need Explicit Checks

| Namespace / Area | Current Risk | Required Check |
| --- | --- | --- |
| `auth.json` | `login.demoTitle`, forgot-password body says "demo screen". | Login/register/forgot-password should read as product flows; demo chooser only local. |
| `chat.json` | Mostly clean, but key name `placeholder` is internal-safe while displayed text must stay student-facing. | Verify no Learning Assistant copy regresses to provider/AI/Codex language. |
| `pricing.json` | Checkout copy says "During this demo". | Replace with product-safe payment availability copy and keep payment safety clear. |
| `billing.json` | Multiple `demo checkout` and `mockCheckout*` strings. | Gate demo wording or replace with production-facing hosted-checkout/support copy. |
| `support.json` | `eyebrow` says "Pilot support". | Decide if pilot remains production-facing; otherwise use normal support language. |
| `home.json` | "Demo-ready today" appears in trust/proof section. | Replace with production-safe capability or readiness copy. |
| `admin.json` | "Review demo operations..." appears in admin overview. | Replace with operations wording; keep demo only in internal mode. |
| Hardcoded page/component copy | Several pages contain `Demo`, `Mock`, `Placeholder`, endpoint labels, and "not implemented" wording outside locale files. | Move P0/P1 strings into i18n or replace directly if admin/internal. |

## Environment-Guard Behavior

| Behavior | Expected Rule | Acceptance Criteria |
| --- | --- | --- |
| Demo login shortcuts | Only available when `VITE_ENABLE_DEMO_SHORTCUTS=true` and the app is in local/demo mode, never in production. | Production build/config with the flag accidentally true still hides shortcuts or fails QA. |
| Demo API fallback | Available only for `mock` or explicitly enabled `demo` API mode. | Staging/production do not silently fall back to mock data; errors are user-safe. |
| Mock checkout | Available only when explicit mock checkout flag and non-production/demo mode allow it. | `/billing/checkout/demo` is inaccessible or product-safely redirected outside allowed mode. |
| Debug/internal badges | Admin/internal only and hidden from student/parent/tutor/public surfaces. | No debug badge or env text appears on P0 customer routes. |
| Organization/demo routes | Hidden from default role navigation unless organization mode or explicit demo context is enabled. | Route config and nav filtering are verified. |
| Public registration | Obeys existing public-register flag without exposing admin creation. | Public register supports student/parent/tutor only; unavailable states are product-safe. |
| Feature flags | Disabled features show next steps, not implementation details. | Parent report, teacher help, referral, support tickets, payment, and feedback flags have stable disabled states. |

## Stability Hardening Expectations

| Flow | Loading | Empty | Error | Success | Duplicate-Submit Guard |
| --- | --- | --- | --- | --- | --- |
| Login | Button pending state; no layout shift. | Not applicable. | Invalid credentials and network errors are localized and actionable. | Redirect to role home. | Disable sign-in while pending. |
| Register/onboarding | Step submission pending state. | Incomplete profile guidance per role. | Validation errors near fields; backend failure toast/state. | Role-specific confirmation and next route. | Disable continue/register/upload buttons while pending. |
| Chat | Conversation/message skeleton and streaming state. | First question prompt and create-conversation path. | Retry load, retry send, upload failure, stream failure. | Message appears once; teacher request confirmation. | Disable send while sending unless intentional queued send; disable teacher request after submit. |
| Parent | Dashboard/report skeletons. | No children, no report, no history with next steps. | Retry/support path without raw API errors. | N/A or report loaded state. | Avoid duplicate child/report fetch actions where applicable. |
| Tutor | Queue/detail skeletons. | No open requests with useful guidance. | Retry load/update; status update failure visible. | Status/note saved confirmation. | Disable status and note submit while pending. |
| Pricing | Plan cards stable while data is loading. | Fallback plan copy if plans unavailable. | Support/contact path if plans cannot load. | Plan selection routes cleanly. | Prevent duplicate checkout starts. |
| Billing | Subscription/usage skeletons. | No plan/usage state explains next action. | Checkout/session failure safe message. | Subscription/checkout result copy. | Disable checkout/manage billing action while pending. |
| Support | Form submit pending state. | No tickets with support CTA. | Submit/list/detail failure with retry/contact. | Ticket submitted confirmation. | Disable submit while pending; no duplicate ticket creation. |
| Admin | Operations cards skeletons. | Empty queues and metrics are normal states. | Retry and diagnostics path without leaking stack traces. | Status updates reflected once. | Disable admin mutations while pending. |

## Differentiators

Not required for minimum cleanup, but valuable if P0 is complete.

| Feature | Value Proposition | Complexity | Notes |
| --- | --- | --- | --- |
| Production-facing copy audit matrix | Gives future phases a durable checklist for user-visible wording by route, locale, and environment. | Low | Extend the Phase 17 copy review matrix rather than creating an unrelated format. |
| Guard verification matrix | Prevents environment flags from drifting into unsafe combinations. | Medium | Check local/demo, staging-like, and production-like env combinations. |
| Central display-label module | Reduces repeated enum-to-label drift and raw status leaks. | Medium | Start with subscription, teacher help, support ticket, onboarding, route status. |
| User-visible text grep script | Makes banned-term checks repeatable in CI or release checklist. | Low | Keep developer docs excluded or explicitly allowlisted. |
| Cross-locale state QA | Ensures loading/error/empty/success states fit in EN/DE/FR/IT, not just happy-path copy. | Medium | Build on Phase 17 route/locale/viewport matrix. |
| Production-facing demo mode banner for internal runs | When local demo mode is intentionally enabled, a subtle internal-only indicator prevents operator confusion. | Low | Keep it gated and absent from customer-facing production. |

## Anti-Features

Explicitly do not build these in Phase 18.

| Anti-Feature | Why Avoid | What to Do Instead |
| --- | --- | --- |
| New business modules | The milestone is cleanup/stability, not scope expansion. | Improve existing routes only. |
| New languages | Phase 18 should preserve EN/DE/FR/IT quality. | Apply cleanup across current locale set. |
| Formal production backend implementation | Backend, database, payments, and AI orchestration remain out of scope. | Keep frontend contracts and user-safe unavailable states. |
| Real payment collection | Frontend must not handle card data or payment secrets. | Keep hosted-checkout direction; gate demo checkout. |
| Real tutor verification/OCR/admission logic | Current tutor credential upload is onboarding/API-contract work only. | Use "submitted for review" copy without implying completed verification. |
| Direct model-provider integration | Frontend must not call OpenAI, Claude, Gemini, DeepSeek, Codex, or provider-specific APIs. | Keep calls behind STOA backend API. |
| Broad visual redesign | Phase 17 already handled typography/copy; Phase 18 should not restyle the product. | Make targeted state/copy/layout fixes only. |
| Removing developer demo infrastructure | Local demo APIs and docs remain valuable for development and QA. | Hide or guard user-facing exposure; keep docs explicit. |
| Pretending incomplete systems are live | Misleads users and creates legal/trust risk. | Hide, disable, or present honest product-safe next steps. |
| Raw technical diagnostics on customer routes | Creates confusion and can leak internals. | Log/report internally; show support-safe messages to users. |

## Feature Dependencies

```text
Route/page inventory -> P0/P1/P2 cleanup scope
P0 copy audit -> locale JSON updates -> multilingual state QA
Environment guard rules -> login shortcuts / mock checkout / demo fallback behavior
Display-label mapping -> status and enum cleanup across chat, tutor, billing, support, admin
Loading/empty/error/success audit -> duplicate-submit audit -> P0 acceptance tests
P0 + P1 route QA -> README / release checklist / research handoff
```

## Suggested Requirement Categories

### Artifact Wording Removal

- **CLEANUP-P0-01:** Default user-facing P0 routes do not display `demo`, `mock`, `test`, `Codex`, `development`, `sample`, `placeholder`, or equivalent internal wording.
- **CLEANUP-P0-02:** All EN/DE/FR/IT P0 locale strings are audited and updated for production-facing wording.
- **CLEANUP-P0-03:** Hardcoded P0/P1 page and component strings are replaced, localized, or explicitly allowlisted as internal/admin-only.

### Environment Guards

- **GUARD-P0-01:** Demo login shortcuts are unavailable in production-facing mode.
- **GUARD-P0-02:** Mock/virtual checkout routes and CTAs are unavailable or product-safely redirected outside explicit demo mode.
- **GUARD-P0-03:** Demo API fallback cannot silently serve production/staging user journeys.
- **GUARD-P1-01:** Demo/advanced organization and analytics routes stay hidden from default role navigation.

### Display Labels

- **LABEL-P0-01:** Subscription plans and statuses use user-facing labels across pricing/billing.
- **LABEL-P0-02:** Teacher-help and tutor request statuses use user-facing labels across chat/tutor/admin.
- **LABEL-P1-01:** Support, onboarding, and admin operation statuses use mapped labels instead of raw API values.

### Stability Hardening

- **STATE-P0-01:** Login/register/chat/parent/tutor/pricing/billing/support/admin P0 flows have loading, empty, error, and success states.
- **STATE-P0-02:** P0 mutating actions prevent duplicate submissions and show pending feedback.
- **STATE-P0-03:** Disabled-feature, unauthorized, forbidden, not-found, and route fallback states are user-safe and localized.

### QA and Documentation

- **QA-P18-01:** Production-facing banned-term grep/audit evidence is captured with documented exceptions.
- **QA-P18-02:** Route x locale x environment QA covers P0 surfaces and key P1 surfaces.
- **QA-P18-03:** README and release checklist explain production-facing mode, local demo mode, and guard verification.

## MVP Recommendation

Prioritize:

1. **P0 copy and term audit:** auth/login/register, chat, parent, tutor, pricing, billing, support, admin primary, and homepage public proof copy.
2. **Environment guards:** demo shortcuts, demo fallback, mock checkout, hidden demo/placeholder routes, disabled-feature states.
3. **Display-label mapping:** subscription plans/statuses, teacher-help statuses, onboarding review states, support/admin statuses.
4. **State hardening:** loading/empty/error/success and duplicate-submit checks for P0 flows.
5. **QA/docs closure:** grep evidence, locale/environment route matrix, README/release checklist updates.

Defer:

- Organization and advanced learning-intelligence demo polish unless exposed by default navigation.
- Legal finalization and professional translation review.
- Full visual regression infrastructure.
- Backend/payment/auth architecture changes.

## Acceptance Criteria

| Area | Done When |
| --- | --- |
| Copy cleanup | P0 user-visible source and locale files pass the banned-term audit with only documented developer/internal exceptions. |
| Multilingual parity | EN/DE/FR/IT P0 strings are updated consistently and still fit the Phase 17 locale/viewport expectations. |
| Login/onboarding | Demo shortcuts are hidden by default; public registration excludes admin creation; pending review copy is product-safe. |
| Chat | No provider/test/demo wording; send/upload/stream/retry/teacher request states are stable and duplicate-safe. |
| Parent | Dashboard/report/history states are parent-friendly, non-alarmist, and free of mock/demo wording. |
| Tutor | Queue/detail/status/note states use professional labels and block duplicate updates. |
| Pricing/billing | No production-facing "demo checkout" or "mock checkout" wording; hosted checkout/payment-disabled states are safe and clear. |
| Support | Support page and ticket flows have clean submit, empty, error, and success states. |
| Admin | Primary admin routes use operations copy, not demo/mock/placeholder labels; technical detail is limited to appropriate admin diagnostics. |
| Guards | Demo accounts, demo fallback, mock checkout, debug UI, and demo routes are gated by explicit non-production/demo conditions. |
| QA evidence | Route x locale x environment checks, banned-term audit, build/lint, and release checklist updates are recorded. |

## Risk Notes

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Removing all "demo" wording could hide important safety disclaimers in local demo mode. | Medium | Gate demo disclaimers to explicit local/demo mode; do not show them in production-facing mode. |
| Pricing/billing wording can accidentally imply live payment collection. | High | Keep hosted-checkout direction clear; hide mock checkout unless enabled; never request card data in frontend. |
| Demo fallback can mask staging/production backend failures. | High | Fail closed for staging/production modes and show support-safe errors. |
| Internal enum labels can reappear from API responses. | Medium | Centralize display-label mapping and add tests/grep for known raw values on rendered P0 pages. |
| Multilingual cleanup may regress Phase 17 natural copy. | Medium | Update all locales intentionally; rerun route/locale/viewport QA for P0 surfaces. |
| Admin needs some operational detail, but users should not see implementation internals. | Medium | Separate admin diagnostics from customer-facing pages and keep endpoint/debug details out of default cards. |
| Placeholder pages may remain reachable by direct URL. | Low to Medium | Hide from nav, redirect if obsolete, or render product-safe unavailable state. |
| Hardcoded copy outside i18n can be missed. | Medium | Audit both locale JSON and `src/pages`/`src/components` hardcoded strings. |

## Sources

- `.planning/PROJECT.md` - Phase 18 goal, target features, constraints, out-of-scope boundaries, and active requirements.
- `.planning/MILESTONES.md` - Recent milestone history and Phase 17 verification context.
- `docs/language/visual-qa-by-locale.md` - Existing route/locale/viewport QA baseline and Phase 18 automation note.
- `docs/language/copy-review-matrix.md` - P0 copy scope and approved Phase 17 terminology/tone baseline.
- `src/i18n/locales/en/auth.json` - Current login/register/forgot-password copy and demo wording risk.
- `src/i18n/locales/en/chat.json` - Current chat state and teacher escalation copy.
- `src/i18n/locales/en/pricing.json` - Current pricing/payment copy and demo wording risk.
- `src/i18n/locales/en/billing.json` - Current billing, payment flag, and mock checkout copy risk.
- `src/i18n/locales/en/support.json` - Current support copy and pilot wording risk.
- `src/lib/env.ts` - Current environment flags and API/demo mode behavior.
- `src/components/auth/LoginForm.tsx` - Current demo shortcut guard behavior.
- `src/pages/billing/BillingPage.tsx` and `src/pages/billing/VirtualCheckoutPage.tsx` - Current billing/mock checkout UI behavior.
- `src/app/router/routeConfig.ts` - Route priority/status metadata for P0/P1/P2 cleanup classification.
- Source grep for `demo|mock|test|Codex|development|sample|placeholder` across `src`, `docs`, `README.md`, and planning files.
