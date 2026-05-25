# Domain Pitfalls: Phase 18 Production-Facing Cleanup and Stability Hardening

**Domain:** Removing user-visible demo/development artifacts from an existing demo-backed React frontend while preserving developer workflows
**Project:** STOA Frontend
**Researched:** 2026-05-26
**Overall confidence:** HIGH for current-code risks and roadmap implications; MEDIUM for exact final copy because final wording should be verified in implementation and QA.

## Research Context

Phase 18 should make STOA feel production-facing without adding product scope. The risky part is that STOA is not a clean greenfield app: it already depends on demo accounts, demo API fallback, virtual checkout, localized P0 copy, route inventory metadata, support forms, tutor workflows, billing contracts, and Playwright flows. Cleanup can easily become a destructive sweep that removes the demo scaffolding developers still need or a shallow text pass that leaves raw internal states visible.

The safest approach is to split Phase 18 into five roadmap slices:

1. **Phase 18.1: Audit Calibration and Source Inventory** - define what counts as user-visible copy, scan rendered sources, and separate safe internal identifiers from UI leaks.
2. **Phase 18.2: Environment Guards and Demo Flow Preservation** - hide demo-only UI by default while preserving local demo accounts, demo backend fallback, and E2E setup.
3. **Phase 18.3: Display Labels and i18n Mapping** - map internal statuses, plan IDs, route statuses, ticket values, and checkout states to localized user-facing labels.
4. **Phase 18.4: State Hardening and Duplicate-Submit Controls** - harden loading, empty, error, success, retry, and pending states across auth, chat, billing, tutor, and support flows.
5. **Phase 18.5: Production-Facing QA Evidence and Docs** - automate or document evidence for terminology cleanup, flag behavior, demo preservation, i18n parity, and cross-locale visual checks.

## Critical Pitfalls

### Pitfall 1: Calibrating the Cleanup Scan Too Broadly or Too Narrowly

**What goes wrong:** A grep for `demo`, `mock`, `test`, `placeholder`, `Codex`, and `development` either floods the phase with false positives or misses actual rendered copy. Current examples show why: internal names such as `mockBillingPlans`, `allowDemoFallback`, `checkout_mock_completed`, `routeConfig.status = 'demo'`, and `src/services/demo/demoFallback.ts` are implementation details, while strings such as "Demo checkout", "Virtual checkout is disabled", "Mock admin ticket queue", and "Reward placeholder" are user-visible leaks.

**Why it happens:** Teams use raw text search as the source of truth. In this app, rendered copy can live in JSX, locale JSON, data fixtures, route metadata, fallback API data, alt text, aria labels, toast messages, and docs copied into UI. Conversely, internal identifiers often must stay stable because they are API contracts, analytics event names, type unions, or developer-only module names.

**Consequences:** The cleanup either burns time renaming safe internals or ships visible development language in P0/P1 routes. Worse, renaming identifiers can break test fixtures, analytics events, demo API fallbacks, route inventory docs, and billing contracts without improving the product surface.

**Warning signs:**
- Scan output mixes TypeScript identifiers, analytics event names, docs, route metadata, locale strings, and JSX literals in one undifferentiated list.
- Developers propose renaming `mockBillingPlans`, `enableMockCheckout`, `allowDemoFallback`, `VITE_ENABLE_DEMO_API`, or `checkout_mock_completed` only because the word matched grep.
- A scan excludes `src/data`, i18n locale JSON, alt text, toast strings, and route metadata even though those can render to users.
- The audit passes because source paths were cleaned, but browser screenshots still show `demo`, `mock`, `placeholder`, or raw route/status labels.

**Prevention strategy:**
- Classify every match as one of: rendered public UI, rendered authenticated UI, rendered developer-only UI, internal identifier, test fixture, documentation, or API/analytics contract.
- Treat rendered public/authenticated UI as the default cleanup target. Preserve internal identifiers unless they leak to users.
- For data fixtures and fallback API responses, decide at render time: data IDs and contract values can stay internal; display strings need locale-backed labels or production-facing fixture copy.
- Add a browser-level visible-text scan for P0/P1 routes because source grep alone will miss runtime fallback text and can over-report internal code.

**Roadmap phase to address:** Phase 18.1: Audit Calibration and Source Inventory.

### Pitfall 2: Breaking Demo Backend Flows While Removing Demo Language

**What goes wrong:** Cleanup hides or disables the local demo flows that developers and E2E tests still rely on. The app currently depends on demo accounts in `tests/e2e/helpers.ts`, demo login shortcuts behind `enableDemoShortcuts`, demo API fallback through `allowDemoFallback`, virtual checkout behind `enableMockCheckout`, and Playwright web-server env flags that set `VITE_ENABLE_MOCK_CHECKOUT=true` and `VITE_ENABLE_PAYMENT=false`.

**Why it happens:** "Remove demo artifacts" is interpreted as deleting demo mechanics instead of removing demo wording from normal user-facing paths. Phase 18 explicitly says demo/backend internals should remain available to developers, only not visible as product copy by default.

**Consequences:** Developers lose the ability to run the local role flows, E2E tests fail, pricing-to-billing validation regresses, and future frontend work becomes slower. The app may look cleaner but become less verifiable.

**Warning signs:**
- Fixed seed accounts such as `student@test.com` stop working in local or Playwright flows.
- `/billing/checkout/demo` is deleted instead of being gated and relabeled for local/developer use.
- `allowDemoFallback` is disabled in demo mode, causing local backend outages to break every demo-backed query.
- Tests are updated by deleting coverage rather than setting the right environment flags.
- README/demo docs still tell developers to run flows that no longer exist.

**Prevention strategy:**
- Preserve demo accounts, demo API fallback, local backend reset behavior, and virtual checkout routes for local/demo environments.
- Hide demo shortcuts and badges from production-facing UI through explicit env flags, not by deleting helper code.
- Rename visible copy from "demo/mock/test" to product-safe language where possible, but keep developer docs explicit about demo workflows.
- Run E2E with the same local flags after cleanup, especially auth, chat, billing, parent, tutor, and support flows.

**Roadmap phase to address:** Phase 18.2: Environment Guards and Demo Flow Preservation.

### Pitfall 3: Hiding Useful Developer Tools with Overbroad Feature Flags

**What goes wrong:** A single production cleanup switch disables unrelated capabilities. `src/lib/env.ts` already has many flags with different meanings: `enableDemoShortcuts`, `enableMockCheckout`, `enablePayment`, `enablePublicRegister`, `enableTeacherHelp`, `enableParentReport`, `enableReferral`, `enableSupportTickets`, and `enableDemoApi`. Some default to `false` unless explicitly enabled; others default to enabled unless explicitly set to `false`.

**Why it happens:** The team may add one umbrella flag such as `VITE_PRODUCTION_CLEANUP=true` or treat `isProduction` as permission to hide broad UI. That collapses separate concepts: public production posture, local development helpers, payment readiness, support-ticket availability, teacher-help availability, and demo API fallback.

**Consequences:** Production may accidentally lose useful support or teacher-help UI, staging may not exercise real launch flows, and local development may become unable to validate checkout or demo API behavior. Since Vite exposes `VITE_*` values to browser code, flags are not security controls and cannot enforce backend authorization.

**Warning signs:**
- One flag controls demo login shortcuts, billing checkout, support tickets, teacher help, and API fallback together.
- Code branches on `isProduction` to remove route behavior instead of using a specific feature flag.
- Production UI depends on `VITE_*` flags for security-sensitive access decisions.
- Flag defaults are inconsistent or undocumented, so an unset variable changes behavior across dev, staging, and production.

**Prevention strategy:**
- Keep separate flags for separate behaviors. Use `enableDemoShortcuts` only for demo account convenience UI, `enableMockCheckout` only for virtual checkout, and `enableDemoApi` only for demo fallback.
- Add a small environment matrix to Phase 18 docs: local demo, staging, production-facing preview, and production.
- Treat frontend flags as presentation/configuration only. Backend APIs must still enforce auth, roles, quotas, and payment access.
- Prefer positive, narrow guards in the component that renders the demo-only UI; avoid route-wide or layout-wide blanket hiding.

**Roadmap phase to address:** Phase 18.2: Environment Guards and Demo Flow Preservation.

### Pitfall 4: Confusing Internal Variable Names with Rendered Product Language

**What goes wrong:** Developers rename internal implementation terms such as `apiMode = 'demo'`, `mockBillingPlans`, `mockSubscription`, `TeacherHelpStatus`, or analytics event names while leaving user-facing strings untouched. Or they do the inverse: leave raw internal values visible because the TypeScript union looks "official."

**Why it happens:** The app has accumulated honest internal names for demo infrastructure. Those names are helpful for maintainability and docs. The problem is not the names themselves; the problem is rendering them directly or letting fallback data become copy.

**Consequences:** Unnecessary churn increases risk across services and tests. At the same time, users may still see strings like `free_trial`, `pending_review`, `in_progress`, `teacher_help_question`, `mock`, `placeholder`, or raw plan IDs.

**Warning signs:**
- PR changes rename files/types/events but screenshots do not change.
- UI components render `{status}`, `{ticket.priority}`, `{ticket.category}`, `{plan}`, or `{plan.name}` directly.
- Billing selected-plan copy uses fallback API strings instead of localized display labels.
- Support ticket badges show raw values such as `in_review`, `parent_report`, or `teacher_help`.

**Prevention strategy:**
- Preserve internal identifiers where they describe contracts or infrastructure. Add display-label mapping at render boundaries.
- Add typed label maps for subscription plans/statuses, teacher-help statuses, support categories/priorities/statuses, checkout result states, route inventory statuses, and attachment statuses.
- Make the mapping localized or at least route it through existing namespaces before closure.
- Add a visible-text audit that fails on raw snake_case/kebab-case values in user-facing pages.

**Roadmap phase to address:** Phase 18.3: Display Labels and i18n Mapping.

### Pitfall 5: Rendering Internal Status Values Directly

**What goes wrong:** Status cleanup misses the exact places that already render raw values. Current examples include `HelpRequestStatusBadge` returning `{status}`, tutor buttons rendering `Mark {status.replace('_', ' ')}`, `SupportTicketList` rendering `ticket.status` and `ticket.priority`, support detail rendering `ticket.status · ticket.priority`, parent summary rendering `record.status`, attachment preview rendering `attachment.status`, and learning profile cards rendering `item.status`.

**Why it happens:** Status values started as simple demo contracts, so rendering them directly was convenient. As the product becomes production-facing and multilingual, status values need a presentation layer.

**Consequences:** Users see implementation values, inconsistent capitalization, English-only status copy, or misleading labels. A status such as `pending` can mean teacher review, checkout, upload processing, support triage, or onboarding review; one generic label can be wrong in context.

**Warning signs:**
- JSX contains `{status}`, `{priority}`, `{category}`, or `.replace('_', ' ')`.
- One status dictionary is reused across unrelated domains.
- Existing `common.status.pending` is used for every pending state regardless of domain.
- Badges and filters are English hardcoded while page chrome is localized.

**Prevention strategy:**
- Create domain-specific label maps instead of one global status map: teacher help, support ticket, subscription, checkout, upload, learning record, route inventory.
- Keep internal values stable for API compatibility and analytics; map them at display time.
- Include the action implication in labels where useful, for example "Waiting for teacher review" instead of just "Pending."
- Add tests or browser checks that no raw snake_case values appear in P0/P1 surfaces.

**Roadmap phase to address:** Phase 18.3: Display Labels and i18n Mapping.

### Pitfall 6: Creating i18n Key Drift During Copy Cleanup

**What goes wrong:** The cleanup fixes English UI strings but leaves German, French, and Italian with old "demo/mock" terms, missing keys, or fallback English. Current `i18n` uses English fallback, multiple namespaces, `returnObjects`, and `defaultValue` in some plan rendering, which can mask missing localized copy until a browser QA pass catches it.

**Why it happens:** A production-facing copy pass touches many files: JSX literals, locale JSON, plan label fallbacks, status labels, buttons, toasts, and error states. If English is treated as canonical and other locales are patched later, fallback behavior makes drift easy to miss.

**Consequences:** Phase 18 appears complete in English but non-English users still see development wording, raw keys, fallback English, or old terminology. This is a direct regression after Phase 17's multilingual copy refinement.

**Warning signs:**
- New `t()` keys are added in `en` only.
- `defaultValue` falls back to API/demo strings for plan names, audiences, features, or CTAs.
- Browser QA does not switch all four locales for pages changed in Phase 18.
- Raw key-like text appears, such as `billing:...`, dotted keys, or untranslated English in DE/FR/IT pages.

**Prevention strategy:**
- Update EN/DE/FR/IT in the same change for every cleaned string.
- Add a locale-shape parity check for `src/i18n/locales/{en,de,fr,it}` and make fallback rendering a QA failure on P0/P1 pages.
- Avoid using API/demo data as `defaultValue` for user-facing labels unless the fallback is already production-safe.
- Extend Phase 17's visual QA matrix to the Phase 18 surfaces and states that changed.

**Roadmap phase to address:** Phase 18.3: Display Labels and i18n Mapping, then Phase 18.5 QA closure.

### Pitfall 7: Error Copy That Masks Actionable Retry Paths

**What goes wrong:** Cleanup replaces technical/demo errors with polished but unhelpful messages. Current API error handling collapses backend failures into `new Error(message)` in `httpClient`; login shows that raw message if present; chat load states show generic errors; upload hooks toast "File upload failed"; virtual checkout disabled states tell users to enable a mock checkout flag; and support flows have multiple form implementations with different success/error behavior.

**Why it happens:** Production-facing copy work can over-sanitize errors. But stability hardening requires users to know what they can do next: retry, sign in again, check file limits, contact support, return to billing, or wait while STOA saves the request.

**Consequences:** Users hit dead ends, retryable states look final, and support volume rises because copy hides the recovery path. Developers also lose diagnostic signal if all errors become the same friendly message.

**Warning signs:**
- Error states only say "Something went wrong" with no retry, return, or contact action.
- A failed checkout path mentions mock environment configuration to end users.
- 401/403 redirects happen without route context or clear "sign in again" copy.
- Upload, chat send, teacher-help request, and support submit errors do not expose retry controls.
- Backend `{ message, code }` values are discarded before UI can choose a helpful path.

**Prevention strategy:**
- Keep error copy production-facing but actionable. Every core error state should answer: what happened, what can the user do, and whether data was saved.
- Preserve backend error codes or typed error categories in service wrappers so UI can distinguish auth, validation, network, payment-disabled, and retryable failures.
- Add retry or navigation actions to chat load, conversation load, teacher help, billing checkout, support submit, and upload failures.
- Replace developer instructions such as "enable the mock checkout flag" with user-safe alternatives in normal UI, while leaving exact env guidance in docs.

**Roadmap phase to address:** Phase 18.4: State Hardening and Duplicate-Submit Controls.

### Pitfall 8: Duplicate-Submit Regressions While Refactoring Forms and Buttons

**What goes wrong:** In cleaning copy and states, handlers lose pending guards or reset fields too early. Current code has mixed patterns: `LoginForm` disables submit while pending, `VirtualCheckoutPage` buttons are not pending-state guarded because they only navigate, `ChatPage` guards streaming sends and teacher-help pending, `SupportRequestForm` disables during submit and resets on success, but `SupportTicketForm` clears fields immediately after `mutate` even if the request fails.

**Why it happens:** Production cleanup touches button labels, success states, and form copy. It is easy to move reset logic or remove pending checks when replacing text and component structure.

**Consequences:** Duplicate support tickets, duplicate teacher-help requests, repeated checkout events, repeated analytics events, lost support form content on failure, or multiple chat sends. These are visible stability regressions even if the UI copy is cleaner.

**Warning signs:**
- Submit handlers call `mutate` without checking `isPending` or disabling the initiating button.
- Form fields reset before `onSuccess`.
- Buttons that navigate or start checkout can be double-clicked and emit duplicate analytics.
- Retry buttons are available while the original request is still in flight.
- Tests only assert happy-path success and never double-click, fail, or retry.

**Prevention strategy:**
- Standardize mutation form behavior: validate, disable submit while pending, keep user input on error, reset only on success, and show an explicit success state.
- Add pending guards to checkout, support, teacher-help, tutor status update, upload, and chat send actions.
- Add at least one focused test or manual QA step for double-click prevention on support submit, teacher-help request, and checkout start.
- Do not hide duplicate-submit bugs behind copy changes; state behavior is part of Phase 18 stability hardening.

**Roadmap phase to address:** Phase 18.4: State Hardening and Duplicate-Submit Controls.

## Moderate Pitfalls

### Pitfall 9: Cleaning Virtual Checkout Copy by Pretending Payments Are Live

**What goes wrong:** To remove "demo" and "mock" wording, the UI starts implying that STOA is collecting real payments or has full subscription enforcement. This is especially risky in pricing and billing because Phase 18 must not add real payment collection, subscription enforcement, or backend payment webhooks.

**Warning signs:**
- "Demo checkout" is replaced with "Subscribe now" in an environment where `enablePayment=false`.
- Billing copy says plan changes are active when virtual checkout only simulates the journey.
- UI implies the frontend enforces quotas or payment access.
- Checkout result pages no longer distinguish hosted payment from local/developer virtual flow.

**Prevention strategy:**
- Use production-facing but truthful labels such as "Secure checkout preview" for non-payment environments and "Checkout is not available in this environment" for disabled states.
- Keep the payment boundary clear: real payment collection requires backend-created hosted checkout sessions; browser code must not handle card data or secrets.
- For local/developer virtual checkout, keep explicit docs and route guards, but avoid exposing mock terminology in normal user copy.

**Roadmap phase to address:** Phase 18.2 for flags and Phase 18.3 for billing/checkout label mapping.

### Pitfall 10: Route Inventory Statuses Leak Into Navigation or QA Decisions

**What goes wrong:** `routeConfig` uses internal route statuses such as `core`, `demo`, `placeholder`, `duplicate`, and `deprecated`. Those values are useful for maintainability, but Phase 18 can either overreact and rename them or underreact and let them drive visible copy/navigation labels.

**Warning signs:**
- Internal route statuses appear in UI badges, breadcrumbs, admin route lists, or docs intended for users.
- A route is hidden only because it has `status: 'demo'`, even though it is still needed for local/developer QA.
- Placeholder routes stay linked in normal navigation with production-facing labels that imply implemented functionality.

**Prevention strategy:**
- Keep route metadata internal and use separate user-facing labels.
- For placeholder/developer routes, either hide from normal nav or replace page copy with a production-safe "not available yet" path and a useful return action.
- Do not remove route entries that support route inventory, redirects, or E2E unless the roadmap explicitly deprecates the route.

**Roadmap phase to address:** Phase 18.1 for inventory and Phase 18.2 for guards.

### Pitfall 11: QA Evidence Says "No Demo Text" Without Proving Runtime States

**What goes wrong:** The phase closes with grep output but no browser evidence for the states users actually see: unauthenticated login/register, empty chat, conversation load error, teacher-help retry, billing checkout disabled/enabled, support submit success/error, tutor status update, parent report empty/error, and locale-specific rendering.

**Warning signs:**
- Evidence lists only command output from `rg`.
- Existing Playwright tests remain English-biased and assert copy that Phase 18 is supposed to change.
- The Phase 17 200-combination visual check remains documented but not reusable automation.
- No screenshots or trace notes cover disabled demo shortcuts, disabled mock checkout, and enabled local demo checkout separately.

**Prevention strategy:**
- Combine source scans with browser-visible scans and screenshots for a small but explicit route/state matrix.
- Update existing E2E selectors away from brittle English labels where copy is intentionally changing; use accessible roles plus stable state, or locale-specific expected labels where appropriate.
- Add Phase 18 evidence for at least: demo shortcuts hidden by default, local demo login still works, virtual checkout guard behavior, raw status-label absence, support duplicate-submit guard, and EN/DE/FR/IT visual smoke.
- Automate the Phase 17 overflow check or document the exact command and result if full automation is deferred.

**Roadmap phase to address:** Phase 18.5: Production-Facing QA Evidence and Docs.

### Pitfall 12: Legal and Trust Copy Gets "Polished" Beyond Current Capability

**What goes wrong:** Removing caveats makes privacy, support, payment, teacher verification, or learning-intelligence pages sound more complete than the system currently is. Phase 18 should remove development artifacts, not create new promises.

**Warning signs:**
- Legal placeholders become final-sounding legal commitments.
- Teacher support copy implies verified live teacher staffing beyond current tutor workflow support.
- Learning diagnosis pages imply real AI/graph computation rather than API/demo contract data.
- Support copy implies production SLA or guaranteed response time without operations backing.

**Prevention strategy:**
- Replace development language with scoped product language, not stronger claims.
- Preserve boundaries already stated in `.planning/PROJECT.md`: no real payment collection, no production backend implementation, no teacher verification, no formal legal package, no new AI/backend features.
- Where capability is unavailable, use user-safe availability language and a support path rather than demo terminology.

**Roadmap phase to address:** Phase 18.1 for scope lock and Phase 18.3 for copy/label mapping.

## Minor Pitfalls

### Pitfall 13: Documentation Cleanup Removes Developer Truth

**What goes wrong:** README and demo docs are cleaned so aggressively that developers cannot tell which flows require local FastAPI, demo API fallback, fixed demo users, or mock checkout flags.

**Prevention strategy:** Keep developer docs explicit. The ban is on user-visible product artifacts, not truthful setup instructions in README, demo backend docs, E2E docs, and release checklists.

**Roadmap phase to address:** Phase 18.5: Production-Facing QA Evidence and Docs.

### Pitfall 14: Accessibility Regressions from Copy-Only Edits

**What goes wrong:** Replacing labels and error states removes accessible names, status roles, or button clarity. Existing skeletons use `role="status"` in places, and forms use labels, but Phase 18 changes can accidentally make pending/error states less accessible.

**Prevention strategy:** Preserve labels, accessible button names, `role="status"` loading affordances, and form error association while changing copy. Add lightweight accessibility checks to the manual QA matrix for changed P0/P1 routes.

**Roadmap phase to address:** Phase 18.4 for state hardening and Phase 18.5 for QA.

### Pitfall 15: Analytics and Logs Lose Signal or Leak Cleanup Terms

**What goes wrong:** Renaming analytics events to remove `mock`/`demo` breaks dashboards, or visible console logs continue to use development terms in production. Current analytics includes `checkout_mock_completed`; logger behavior varies by env.

**Prevention strategy:** Keep analytics event names stable unless there is a migration plan. Clean visible UI first; treat logs/events as developer/ops contracts. Ensure production logging does not expose sensitive data or unnecessary console noise.

**Roadmap phase to address:** Phase 18.1 for scan classification and Phase 18.5 for release checklist.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
| --- | --- | --- |
| Phase 18.1 scan calibration | False positives drive internal renames while rendered copy is missed | Classify matches by renderability and preserve API/analytics/internal identifiers unless they leak. |
| Phase 18.1 source inventory | Locale JSON and data fixtures are skipped | Include JSX, locale files, `src/data`, route metadata, toasts, alt text, and fallback responses. |
| Phase 18.2 env guards | One broad flag hides unrelated capabilities | Use narrow flags already present in `src/lib/env.ts`; document local/staging/production matrix. |
| Phase 18.2 demo preservation | Demo backend and E2E flows break | Preserve fixed demo accounts, `allowDemoFallback`, local backend docs, and Playwright env setup. |
| Phase 18.2 checkout | Virtual checkout cleanup implies real payment | Keep hosted-checkout boundary clear; relabel preview states without promising live payment. |
| Phase 18.3 label mapping | Raw statuses render directly | Add domain-specific display maps for teacher help, support tickets, subscription, upload, checkout, learning, and route statuses. |
| Phase 18.3 i18n | English-only cleanup drifts from DE/FR/IT | Update all locale JSON together and add shape/raw-key checks. |
| Phase 18.4 errors | Friendly copy removes actionable retry paths | Pair every error with retry, return, contact, or sign-in action where applicable. |
| Phase 18.4 duplicate submit | Form refactors reset early or allow double-clicks | Disable while pending, reset only on success, and test double-submit on support, checkout, and teacher-help flows. |
| Phase 18.5 QA | Grep evidence replaces runtime evidence | Record route/state/locale/viewport/browser evidence and keep E2E coverage passing. |

## Recommended Phase 18 Acceptance Evidence

- Source scan report classifying matches into rendered UI, developer docs, tests, internal identifiers, and API/analytics contracts.
- Browser-visible text scan or screenshot matrix for `/`, `/login`, `/register`, `/chat`, `/parent`, `/parent/children/user-student/report`, `/tutor`, `/pricing`, `/billing`, `/support`, and changed checkout/support routes.
- Flag matrix evidence for demo shortcuts hidden, local demo login working, mock checkout disabled copy, and mock checkout enabled local flow.
- Raw-status evidence showing no visible snake_case/kebab-case status values in P0/P1 pages.
- Locale parity evidence for EN/DE/FR/IT on every cleaned P0/P1 surface.
- Duplicate-submit QA for login, chat send, teacher-help request, support submit, tutor status update, and checkout start.
- Updated README/release checklist that keeps developer workflow truthful while keeping product-facing UI clean.

## Sources

- Project scope and Phase 18 boundaries: `.planning/PROJECT.md`
- Phase 17 audit handoff and QA debt: `.planning/milestones/v1.16-MILESTONE-AUDIT.md`
- Locale QA baseline and required route/viewport matrix: `docs/language/visual-qa-by-locale.md`
- Environment flags and demo fallback config: `src/lib/env.ts`
- API error collapsing and auth redirects: `src/services/api/httpClient.ts`
- Auth token/demo account workflow: `src/store/authStore.ts`, `src/components/auth/LoginForm.tsx`, `tests/e2e/helpers.ts`
- Pricing and billing cleanup targets: `src/pages/pricing/PricingPage.tsx`, `src/pages/billing/BillingPage.tsx`, `src/pages/billing/VirtualCheckoutPage.tsx`, `src/pages/billing/CheckoutResultPage.tsx`, `src/hooks/billing/useCreateCheckoutSessionMutation.ts`
- Status-label risk examples: `src/components/tutor/HelpRequestStatusBadge.tsx`, `src/components/tutor/TutorRequestFilters.tsx`, `src/components/support/SupportTicketList.tsx`, `src/components/billing/BillingSummaryCard.tsx`, `src/components/billing/SubscriptionBadge.tsx`
- Duplicate-submit and form-state examples: `src/components/support/SupportRequestForm.tsx`, `src/components/support/SupportTicketForm.tsx`, `src/pages/chat/ChatPage.tsx`
- Current E2E coverage and English-biased selectors: `tests/e2e/*.spec.ts`, `playwright.config.ts`
- Official Vite env-variable behavior: https://vite.dev/guide/env-and-mode
- Official i18next fallback behavior: https://www.i18next.com/principles/fallback
- Official i18next objects/arrays behavior: https://www.i18next.com/translation-function/objects-and-arrays
- Official Playwright screenshot/visual-comparison guidance: https://playwright.dev/docs/test-snapshots
