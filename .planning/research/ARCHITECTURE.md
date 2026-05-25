# Phase 18 Research: Architecture

**Project:** STOA Frontend
**Phase:** v1.17 Phase 18 - Production-Facing Cleanup, Stability Hardening, and Demo Artifact Removal
**Researched:** 2026-05-26
**Research mode:** Ecosystem / codebase integration
**Overall confidence:** HIGH

## Recommendation

Phase 18 should integrate as a narrow production-facing cleanup layer across existing routes, shared UI primitives, and environment gates. Do not add new product modules, new route families, a CMS, a new state layer, or a new design system. The right shape is: centralize environment visibility and internal-to-user label mapping, then update existing page/component call sites to consume those helpers and i18n keys.

The highest-leverage additions are:

- `src/lib/displayLabels.ts` for role/status/category/plan labels and fallbacks.
- `src/lib/userFacingText.ts` for sanitizing or replacing backend/internal strings before render.
- `src/components/common/SafeStatusLabel.tsx` for status badges and inline labels.
- `src/components/common/InternalDebugPanel.tsx` for environment/debug details hidden from production.
- A small route gate/helper in `src/app/router/routeConfig.ts` and `src/lib/env.ts` so demo/placeholder surfaces remain reachable only when explicitly enabled.
- A QA scanning script or documented command that checks user-facing source and locale files for blocked production terms.

This keeps the existing architecture intact: React pages stay page-owned, TanStack Query stays the server-state layer, existing `EmptyState` / `ErrorState` / skeleton components stay the state presentation layer, and `src/i18n/locales/{en,de,fr,it}` remains the source of user copy.

## Existing Architecture Relevant to Phase 18

### Environment and Demo Boundaries

`src/lib/env.ts` already centralizes browser-public configuration:

- `appEnv`, `apiMode`, `apiBaseUrl`
- `isDevelopment`, `isStaging`, `isProduction`
- feature flags such as `enableDemoShortcuts`, `enableMockCheckout`, `enableDemoApi`, `allowDemoFallback`

Use this file as the only Phase 18 environment integration point. Page components should not inspect raw `import.meta.env`.

Current gaps:

- Demo-only login shortcuts are gated by `enableDemoShortcuts`, which is correct.
- Mock checkout and demo API fallback are separately gated, but user copy still says `demo` / `mock`.
- Hidden/demo route metadata exists in `routeConfig.ts`, but `AppRouter.tsx` still declares all routes unconditionally.
- Admin environment cards render raw environment/API values directly and should be moved behind an internal panel.

### Routing and Navigation

`src/app/router/AppRouter.tsx` is the route declaration surface. `src/app/router/routeConfig.ts` already classifies route and nav metadata with `status: 'core' | 'demo' | 'placeholder' | 'duplicate' | 'deprecated'`.

Phase 18 should use that existing status taxonomy rather than inventing new route metadata. The needed architectural change is to enforce visibility:

- core routes remain always available;
- demo/placeholder/duplicate/deprecated routes are hidden from production navigation;
- direct route access to demo-only pages should either redirect to `/` or render `NotFoundPage` in production;
- compatibility aliases can remain if they do not expose demo terminology in visible UI.

High-risk existing routes:

- `/billing/checkout/demo` should become internal/demo-only, with user-facing copy changed to "checkout preview" or hidden outside demo mode.
- `/ai-homework-help` should remain an alias only if marketing copy does not expose `AI` as the product concept.
- `/admin/advanced-analytics`, `/admin/retention`, `/organization/**`, `/students/:studentId/diagnosis`, `/curriculum-graph`, and `/partnership/onboarding` are demo-classified and should be gated in production unless product owners explicitly promote them to core.
- `/admin/users`, `/admin/billing-interest`, and `/admin/system` currently render placeholder contract shells; these should be gated or rewritten as internal operational previews.

### I18n and Copy

The app already uses i18next with static locale files:

```text
src/i18n/locales/{en,de,fr,it}/{common,home,auth,chat,parent,tutor,pricing,billing,support,admin,errors}.json
```

Phase 18 should migrate hard-coded user-facing strings into these namespaces only when the component is visible to users. Developer docs and internal-only debug text can remain English if they are behind `InternalDebugPanel`.

Current high-priority hard-coded copy:

- `src/pages/onboarding/OnboardingPage.tsx`
- `src/pages/support/SupportPage.tsx`
- `src/components/support/SupportRequestForm.tsx`
- `src/components/billing/BillingStatusAlert.tsx`
- `src/components/billing/CheckoutButton.tsx`
- `src/components/billing/PlanUsageCard.tsx`
- `src/components/chat/TeacherHelpStatusCard.tsx`
- `src/components/chat/ChatMessageBubble.tsx`
- `src/components/chat/AttachmentPreview.tsx`
- `src/pages/not-found/NotFoundPage.tsx`
- `src/pages/admin/OperationsPlaceholder.tsx`
- `src/components/admin/AdminEnvironmentCard.tsx`

Do not create a generic translation-rendering abstraction. Add focused i18n keys next to the namespaces already used by each component.

## Integration Points

### 1. Environment Guards

Modify `src/lib/env.ts`:

```ts
export const showInternalDebug = !isProduction && import.meta.env.VITE_SHOW_INTERNAL_DEBUG === 'true'
export const enableProductionDemoSurfaces =
  !isProduction && import.meta.env.VITE_ENABLE_DEMO_SURFACES === 'true'
export const showDemoAccounts = enableDemoShortcuts && !isProduction
export const showCheckoutPreview = enableMockCheckout && !isProduction
```

Recommended names should be production-oriented:

- use `showCheckoutPreview` in UI components;
- keep `enableMockCheckout` only in API/service internals;
- use `showDemoAccounts` in auth UI;
- use `showInternalDebug` for admin environment and backend-contract panels;
- use `enableProductionDemoSurfaces` or `showDemoSurfaces` for route gating.

Modify `src/components/auth/LoginForm.tsx`:

- replace direct `enableDemoShortcuts` usage with `showDemoAccounts`;
- leave demo account fill behavior unchanged;
- change `auth:login.demoTitle` to a non-production-only label such as "Test account shortcuts" because it will never appear in production.

Modify `src/components/billing/CheckoutButton.tsx`, `BillingStatusAlert.tsx`, `BillingPage.tsx`, and `VirtualCheckoutPage.tsx`:

- user copy should say "checkout preview" or "plan review" when mock checkout is enabled;
- the route `/billing/checkout/demo` can remain internally but should not be linked or described as `demo`;
- production should not show checkout-preview controls unless `enablePayment` is true.

Modify `src/components/admin/AdminEnvironmentCard.tsx` and `src/pages/admin/OperationsPlaceholder.tsx`:

- wrap raw environment, endpoint, and API base URL details in `InternalDebugPanel`;
- production user-facing admin pages should show operationally useful copy, not backend endpoint contracts.

### 2. Route and Page Cleanup

Modify `src/app/router/routeConfig.ts`:

- add helper `isRouteVisibleInCurrentEnvironment(meta: AppRouteMeta): boolean`;
- use existing `status` to suppress demo/placeholder/duplicate/deprecated routes when `isProduction`;
- keep labels and descriptions product-facing, even for internal metadata, because metadata is already used in navigation and docs.

Modify `src/lib/navigation.ts`:

- filter nav items through the same visibility helper;
- avoid showing any item with `status !== 'core'` in production unless a new explicit flag allows it.

Modify `src/app/router/AppRouter.tsx`:

- put demo-only route groups behind small wrappers or conditional route elements.
- Recommended minimal pattern: create a `DemoSurfaceRoute` component under `src/app/router/DemoSurfaceRoute.tsx` that returns `<Outlet />` when `showDemoSurfaces` is true and `<NotFoundPage />` otherwise.
- Use it around demo route blocks rather than putting env checks inside each page.

Do not remove routes outright in Phase 18 unless there is no linked path and no E2E dependency. Gating is safer than deletion because previous milestone docs and tests may still use hidden paths.

### 3. Display Labels and User-Facing Text

Add `src/lib/displayLabels.ts`.

Responsibilities:

- Map known internal enum/API values to product copy keys.
- Provide safe fallbacks for unknown statuses.
- Keep returned values locale-aware by returning i18n keys, not English strings, where practical.

Recommended API:

```ts
export type LabelDomain =
  | 'chatMessageStatus'
  | 'teacherHelpStatus'
  | 'subscriptionStatus'
  | 'attachmentStatus'
  | 'supportTicketStatus'
  | 'supportCategory'
  | 'supportSeverity'
  | 'routeStatus'

export function getDisplayLabelKey(domain: LabelDomain, value: string): string
export function getFallbackLabelKey(domain: LabelDomain): string
```

Add `src/lib/userFacingText.ts`.

Responsibilities:

- Normalize backend error messages before display.
- Replace blocked internal terms when a string must be shown.
- Avoid leaking raw API codes, endpoint names, env names, provider names, or internal statuses.

Recommended API:

```ts
export function getUserFacingError(error: unknown, fallback: string): string
export function sanitizeUserFacingText(value: string): string
export function containsBlockedUserFacingTerm(value: string): boolean
```

Use it at query/mutation error render sites before showing `error.message`.

First call sites:

- `LoginForm` and `RegisterForm`: do not render raw auth error messages without fallback sanitization.
- `ChatPage`: sanitize create-conversation, conversation-load, teacher-help, and send errors.
- `SupportRequestForm`: local validation and mutation errors should use support/errors i18n keys.
- `BillingPage` and checkout components: avoid raw plan/status strings.
- `TutorDashboardPage` and tutor detail pages: do not show raw status update errors.

### 4. `SafeStatusLabel`

Add `src/components/common/SafeStatusLabel.tsx`.

Purpose:

- Render enum/status values through `displayLabels` and i18n.
- Avoid direct rendering of API values such as `in_progress`, `pending_review`, `failed`, `mock`, or `demo`.
- Preserve existing badge styling via `src/components/ui/badge.tsx`.

Recommended props:

```ts
type SafeStatusLabelProps = {
  domain: LabelDomain
  value: string | null | undefined
  variant?: 'badge' | 'text'
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
}
```

Initial replacements:

- `src/components/billing/SubscriptionBadge.tsx`
- `src/components/tutor/HelpRequestStatusBadge.tsx`
- `src/components/support/SupportTicketList.tsx`
- `src/components/admin/AdminFeedbackList.tsx`
- `src/components/chat/AttachmentPreview.tsx`
- `src/components/chat/ChatMessageBubble.tsx`
- `src/components/chat/TeacherHelpStatusCard.tsx`
- `src/components/learning/CurriculumGraphView.tsx`
- `src/components/dashboard/RecentQuestionsCard.tsx`

Keep domain-specific wrappers if they improve readability. For example, `SubscriptionBadge` can remain but should delegate to `SafeStatusLabel`.

### 5. `InternalDebugPanel`

Add `src/components/common/InternalDebugPanel.tsx`.

Purpose:

- Central place for endpoint names, API base URLs, env values, route metadata, mock/demo fallback notices, and backend-contract details.
- Hidden unless `showInternalDebug` is true.
- Makes QA scanning easier: debug terms can be allowed only inside this component, docs, service internals, and test files.

Recommended props:

```ts
type InternalDebugPanelProps = {
  title: string
  children: ReactNode
}
```

Implementation:

- return `null` when `showInternalDebug` is false;
- render a subtle dashed card when visible;
- include `data-internal-debug="true"` for Playwright/QA assertions.

Initial call sites:

- `AdminEnvironmentCard`
- `AdminOperationsPlaceholderPage`
- billing checkout preview details
- support endpoint fallback notes
- any page that currently says endpoint/API/mocked/demo/test in visible copy

### 6. Query State Hardening

Do not change TanStack Query architecture. Harden page-level query rendering around existing query hooks.

Recommended shared state primitives:

- keep `ChatSkeleton`, `DashboardSkeleton`, `ParentDashboardSkeleton`, `TutorDashboardSkeleton`, and `PageSkeleton`;
- expand `EmptyState`, `ErrorState`, and `LoadingState` to accept optional `title`, `message`, `action`, and `className`;
- use translated strings from the page namespace;
- use `getUserFacingError` only when showing dynamic errors.

Initial page targets:

- `BillingPage`: render loading state when subscription/plans/usage/access are loading; render empty state if no plans or usage; render sanitized error state for failed billing queries.
- `TutorDashboardPage`: handle stats query errors independently from request list; show filtered-empty state when the selected filter has no requests.
- `ChatPage`: disable first-conversation submit when create mutation is pending or message is blank; sanitize create and teacher-help errors.
- Parent report/history components: replace "No ..." hard-coded messages with i18n-backed empty states.
- Support tickets and admin lists: use consistent empty/error/loading patterns.

### 7. Duplicate-Submit Hardening

Use existing mutation `isPending` flags, but ensure submit handlers also guard at function entry. Button disabling alone is insufficient because keyboard submit, fast double-clicks, and React StrictMode can still expose duplicate paths.

Modify:

- `LoginForm`: if `loginMutation.isPending`, return before validation/mutation.
- `RegisterForm`: guard `handleSubmit` and disable next/back transitions while register/upload mutation is pending where relevant.
- `SupportRequestForm`: guard `handleSubmit` when `submitSupportRequest.isPending`.
- `TeacherRequestInlineAction` / `ChatPage.handleRequestTeacherHelp`: already partially guarded; keep the page-level guard and ensure inline button always receives `isRequesting`.
- `CheckoutButton` and `UpgradeButton`: guard `onClick` before `mutate`.
- `PlanCard`: accept `isSelecting` or let parent pass a disabled state; avoid multiple checkout starts from repeated plan selection.
- `PartnershipInterestForm`, `SupportTicketForm`, `TutorAvailabilityEditor`, and tutor note/status forms should receive the same pass.

Do not introduce a global "submit lock" store. Mutation-level guards are simpler and scoped.

### 8. QA Scanning

Add a lightweight QA scan focused on user-facing source and locale files.

Recommended file:

- `scripts/scan-user-facing-copy.mjs`

Recommended npm script:

- `"qa:copy": "node scripts/scan-user-facing-copy.mjs"`

Scan targets:

- `src/pages/**/*.{ts,tsx}`
- `src/components/**/*.{ts,tsx}`
- `src/i18n/locales/**/*.json`

Blocked terms for user-facing surfaces:

- `demo`
- `mock`
- `test`
- `Codex`
- `development`
- `sample`
- `placeholder`
- `AI` when used as a product noun

Allowlist:

- `src/lib/env.ts`
- `src/services/demo/**`
- `src/data/**`
- `src/hooks/useMockChat.ts` until it is removed or internally gated
- `src/components/common/InternalDebugPanel.tsx`
- `docs/**`, `.planning/**`, `backend/**`, tests, and Playwright fixtures
- translation keys may contain technical identifiers, but values should not expose blocked words unless explicitly internal.

The scan should fail on values/text, not on every identifier. For TSX, string literals and JSX text are enough for Phase 18; do not attempt full AST certainty unless the simple scan produces too many false positives.

## New Files

| File | Responsibility | Why |
|------|----------------|-----|
| `src/lib/displayLabels.ts` | Central label-key mapping for internal statuses and API values | Prevents direct enum/status rendering across components |
| `src/lib/userFacingText.ts` | Sanitizes dynamic errors/text before render | Prevents backend/internal wording leaks |
| `src/components/common/SafeStatusLabel.tsx` | Shared status rendering through display labels and i18n | Makes status cleanup consistent |
| `src/components/common/InternalDebugPanel.tsx` | Gated internal/debug details | Keeps useful diagnostics without production exposure |
| `src/app/router/DemoSurfaceRoute.tsx` | Route guard for demo/placeholder surfaces | Centralizes production route cleanup |
| `scripts/scan-user-facing-copy.mjs` | QA scan for blocked visible terms | Gives Phase 18 objective evidence |

## Modified Files

| File | Change |
|------|--------|
| `src/lib/env.ts` | Add semantic visibility flags: `showDemoAccounts`, `showCheckoutPreview`, `showInternalDebug`, `showDemoSurfaces` |
| `src/app/router/AppRouter.tsx` | Wrap demo/placeholder route groups with `DemoSurfaceRoute` |
| `src/app/router/routeConfig.ts` | Add route visibility helper and clean metadata descriptions |
| `src/lib/navigation.ts` | Filter nav items by environment-visible route status |
| `src/layouts/AppLayout.tsx` | Continue using nav config; avoid direct route/status labels |
| `src/components/auth/LoginForm.tsx` | Gate demo shortcuts via `showDemoAccounts`; sanitize login errors; add pending guard |
| `src/components/auth/RegisterForm.tsx` | Add submit guard; sanitize register errors; keep role/profile flow unchanged |
| `src/pages/auth/RegisterPage.tsx` | Usually copy-only; ensure all visible text remains i18n-backed |
| `src/pages/onboarding/OnboardingPage.tsx` | Move hard-coded pilot/support copy to i18n; replace pilot/demo wording with production-facing onboarding wording |
| `src/components/chat/TeacherRequestInlineAction.tsx` | Keep i18n, ensure duplicate-submit disabled state, no raw pending label |
| `src/components/chat/TeacherHelpStatusCard.tsx` | Replace hard-coded status maps with `SafeStatusLabel` and chat i18n |
| `src/components/chat/ChatMessageBubble.tsx` | Replace hard-coded role/status labels and fixed English date locale |
| `src/components/chat/AttachmentPreview.tsx` | Replace raw attachment status and MIME/internal text where visible |
| `src/components/billing/PlanCard.tsx` | Add disabled/selecting support if parent checkout is pending; keep plan copy from i18n |
| `src/pages/billing/BillingPage.tsx` | Add loading/empty/error states and replace payment/mock copy with production-facing labels |
| `src/components/billing/*` | Replace raw status/copy; guard checkout submits |
| `src/pages/support/SupportPage.tsx` | Move hard-coded text to support i18n; remove bug/pilot/internal wording from visible copy |
| `src/components/support/SupportRequestForm.tsx` | Move labels/options/errors/placeholders to support/errors i18n; add pending submit guard |
| `src/pages/not-found/NotFoundPage.tsx` | Translate route fallback and remove "does not exist yet" wording |
| `src/components/admin/*` | Gate internal environment/backend details; map statuses through safe labels |
| `src/i18n/locales/{en,de,fr,it}/*.json` | Add status, state, and cleanup copy keys across affected namespaces |
| `package.json` | Add `qa:copy` script |

## Suggested Build Order

1. **Environment and route visibility foundation**
   - Update `env.ts` semantic flags.
   - Add `DemoSurfaceRoute`.
   - Add route visibility helper in `routeConfig.ts`.
   - Update `navigation.ts` and `AppRouter.tsx`.
   - This prevents production from exposing demo-only surfaces before copy work is complete.

2. **Shared label and text safety**
   - Add `displayLabels.ts`, `userFacingText.ts`, `SafeStatusLabel`, and `InternalDebugPanel`.
   - Update a small set of status components first: `SubscriptionBadge`, `HelpRequestStatusBadge`, `AttachmentPreview`.
   - This creates stable primitives before broad page cleanup.

3. **Auth, onboarding, support cleanup**
   - Update `LoginForm`, `RegisterForm`, `RegisterPage`, `OnboardingPage`, `SupportPage`, and `SupportRequestForm`.
   - Move hard-coded user copy into `auth`, `support`, `common`, and `errors` locale namespaces.
   - Add duplicate-submit guards to auth/support forms.

4. **Billing and checkout cleanup**
   - Update `BillingPage`, `PlanCard`, `CheckoutButton`, `UpgradeButton`, `BillingStatusAlert`, `PlanUsageCard`, and checkout result/preview pages.
   - Replace mock/demo/payment-disabled wording with product-safe states.
   - Add explicit loading/empty/error handling for all billing queries.

5. **Chat, tutor, parent, and admin status cleanup**
   - Update chat message/status/attachment labels.
   - Update teacher-help status cards and tutor request badges/filters.
   - Replace parent/admin empty states with translated shared states.
   - Gate admin internal contract shells behind `InternalDebugPanel`.

6. **QA scan and evidence**
   - Add `scripts/scan-user-facing-copy.mjs` and `npm run qa:copy`.
   - Run `npm run lint`, `npm run build`, and `npm run qa:copy`.
   - Add/adjust Playwright checks for production env route gating and absence of blocked terms on P0 routes.

## Data Flow Notes

### Environment Visibility Flow

```text
VITE_* public config
  -> src/lib/env.ts semantic flags
  -> routeConfig/navigation/AppRouter gates
  -> page/component conditional rendering
```

Rules:

- Components consume semantic flags, not raw `import.meta.env`.
- Production defaults hide demo accounts, checkout previews, debug panels, endpoint names, API base URLs, and demo-only routes.
- Service internals may keep `mock`/`demo` names, but UI paths should use product-facing names.

### Status Label Flow

```text
API/domain value
  -> type in src/types/**
  -> displayLabels.ts label key
  -> SafeStatusLabel
  -> i18n namespace value
  -> Badge/text in UI
```

Rules:

- Never render raw `status`, `role`, `category`, `severity`, `apiMode`, or endpoint values in user-facing UI.
- Unknown values use a generic translated fallback such as "Status unavailable".
- Domain wrappers can remain for readability but must delegate to `SafeStatusLabel`.

### Dynamic Error Flow

```text
Axios/backend/mutation error
  -> httpClient Error(message)
  -> page/hook render site
  -> getUserFacingError(error, translatedFallback)
  -> ErrorState/toast/inline error
```

Rules:

- Static validation errors should come from `errors` i18n keys.
- Dynamic backend errors should be sanitized before render.
- Raw backend messages can be logged through existing monitoring/logger paths, but not displayed directly.

### Query State Flow

```text
TanStack Query hook
  -> page-owned loading/error/empty/data branch
  -> shared state primitive
  -> localized user copy
```

Rules:

- Keep query ownership in pages and feature hooks.
- Use skeletons for initial page loading, `EmptyState` for legitimate no-data cases, and `ErrorState` for failures.
- Handle partial query failure where a page has multiple queries, especially billing and tutor dashboards.

### Duplicate-Submit Flow

```text
form/button event
  -> function-level pending guard
  -> validation
  -> mutation.mutate
  -> disabled/pending UI state
```

Rules:

- Every mutation-triggering submit/click should guard at the handler top and disable the control.
- Do not centralize submit state in Zustand.
- Keep idempotency/security as backend responsibilities; frontend hardening is UX protection.

## Architecture Anti-Patterns to Avoid

- Do not remove demo backend service files just to remove user-facing words; service internals still support local development.
- Do not replace i18next or add a CMS for cleanup copy.
- Do not make route guards a security boundary. Backend authorization remains authoritative.
- Do not scatter `isProduction` checks across many pages; centralize in env helpers and route/debug components.
- Do not render raw API `message`, `code`, `status`, `role`, endpoint, or `apiMode` values.
- Do not add broad feature modules, real payment logic, production backend work, new AI/provider integration, or new organization/analytics workflows.

## Verification Targets

Minimum Phase 18 checks:

- `npm run lint`
- `npm run build`
- `npm run qa:copy`
- Playwright production-mode smoke for `/`, `/login`, `/register`, `/chat`, `/parent`, `/tutor`, `/billing`, `/support`, `/admin`
- Playwright or route-level check that demo/placeholder routes are hidden or NotFound in production mode
- Grep/scan evidence that blocked terms are absent from visible page/component text and locale values
- Manual locale pass for English, German, French, and Italian on P0 pages touched by copy cleanup

## Sources

- `.planning/PROJECT.md` - Phase 18 goal, constraints, current state, and out-of-scope boundaries.
- `src/lib/env.ts` - existing environment and feature-flag integration point.
- `src/app/router/AppRouter.tsx` - current route declarations and demo/placeholder route exposure.
- `src/app/router/routeConfig.ts` - existing route/nav status taxonomy.
- `src/layouts/AppLayout.tsx` - navigation rendering and feedback/language integration.
- `src/components/auth/LoginForm.tsx` - demo shortcut gate, auth submit flow, raw error display.
- `src/pages/auth/RegisterPage.tsx` and `src/components/auth/RegisterForm.tsx` - registration copy and submit flow.
- `src/pages/onboarding/OnboardingPage.tsx` - hard-coded pilot/onboarding copy.
- `src/components/chat/TeacherRequestInlineAction.tsx`, `TeacherHelpStatusCard.tsx`, `ChatMessageBubble.tsx`, `AttachmentPreview.tsx` - teacher/status/internal-label surfaces.
- `src/components/billing/PlanCard.tsx`, `src/pages/billing/BillingPage.tsx`, `BillingStatusAlert.tsx`, `CheckoutButton.tsx`, `PlanUsageCard.tsx` - billing state, checkout preview, and mock/demo copy surfaces.
- `src/pages/support/SupportPage.tsx` and `src/components/support/SupportRequestForm.tsx` - support copy, categories, validation, and duplicate-submit flow.
- `src/components/common/{EmptyState,ErrorState,LoadingState}.tsx` - current shared state primitives.
- `src/i18n/index.ts`, `src/i18n/namespaces.ts`, and locale files - current i18n structure.
- `package.json` - scripts and verification integration point.
