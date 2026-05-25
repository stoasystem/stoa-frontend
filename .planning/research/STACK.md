# Phase 18 Research: Stack

**Milestone:** Production-Facing Cleanup, Stability Hardening, and Demo Artifact Removal  
**Researched:** 2026-05-26  
**Mode:** Ecosystem / stack research  
**Confidence:** HIGH for codebase fit and no-new-dependency recommendation; MEDIUM for exact source-file count until implementation scans every locale and route.

## Executive Stack Recommendation

Phase 18 should use the existing React, TypeScript, Vite, TailwindCSS, i18next, TanStack Query, Zod, React Hook Form, Sonner, Playwright, and local utility stack. Do not add new runtime or test dependencies. The requested work is a cleanup and hardening pass over existing surfaces: copy, environment gates, route visibility, status presentation, and standard UI states.

Use TypeScript utilities and existing shared components rather than new packages:

- `src/lib/env.ts` for all `VITE_*` flag parsing and production/demo gates.
- `src/i18n/locales/*/*.json` for user-facing strings and shared labels.
- `src/components/common/{LoadingState,ErrorState,EmptyState,PageSkeleton}.tsx` for consistent loading/error/empty treatment.
- `src/app/router/{AppRouter,routeConfig,routeGroups}.ts(x)` for hiding or redirecting demo-only routes.
- Small new local utilities, likely `src/lib/displayLabels.ts` and `src/lib/demoVisibility.ts`, for label mapping and route/UI visibility decisions.
- Existing Playwright and `rg` commands for evidence, not a new visual-regression SaaS or translation checker.

## Existing Stack Constraints

| Area | Current Stack | Phase 18 Constraint |
| --- | --- | --- |
| App framework | React 19, React Router 7, Vite 6 | Keep SPA structure. Do not migrate router mode or introduce a framework layer. |
| Language | TypeScript 5.5 | Prefer typed label maps and discriminated unions over ad hoc string formatting. |
| Styling | TailwindCSS 4 plus local UI primitives | Improve state presentation in place. No component-library replacement. |
| Localization | `i18next` and `react-i18next`, EN/DE/FR/IT JSON namespaces | User-visible cleanup must land in locale JSON or existing translated components. No new i18n engine. |
| Server state | TanStack Query 5 | Use existing `isLoading`, `isPending`, `isError`, `data?.length` branches. Do not duplicate server data into Zustand for UI state. |
| Forms | React Hook Form, Zod, existing form validation helpers | Use pending/submitting state and existing validation patterns to prevent duplicate submits. |
| Feedback | Sonner toasts and common state components | Standardize copy and retry affordances. Do not add a notification service. |
| Routing | `AppRouter.tsx`, `routeConfig.ts`, `routeGroups.ts` | Gate demo-only routes and remove user-visible `demo`/`placeholder` route language. |
| Demo fallback | `src/services/demo/demoFallback.ts`, `allowDemoFallback` | Keep developer fallback available only when explicitly enabled by env flags. |
| Verification | `npm run lint`, `npm run build`, `npm run test:e2e`, `rg` | Add focused checks and docs evidence. No new test framework. |

## Recommended No-New-Dependency Approach

### 1. Centralize Production-Facing Environment Gates

`src/lib/env.ts` already parses public Vite environment variables:

```ts
export const appEnv = import.meta.env.VITE_APP_ENV ?? 'development'
export const apiMode = (import.meta.env.VITE_API_MODE ?? 'demo') as ApiMode
export const enableDemoShortcuts = import.meta.env.VITE_ENABLE_DEMO_SHORTCUTS === 'true'
export const enableMockCheckout = import.meta.env.VITE_ENABLE_MOCK_CHECKOUT === 'true'
export const enableDemoApi = import.meta.env.VITE_ENABLE_DEMO_API === 'true'
export const allowDemoFallback = apiMode === 'mock' || (apiMode === 'demo' && enableDemoApi)
```

Recommended additions:

```ts
export const enableDemoUi = import.meta.env.VITE_ENABLE_DEMO_UI === 'true'
export const enableInternalDebugUi = import.meta.env.VITE_ENABLE_INTERNAL_DEBUG_UI === 'true'
export const showProductionFacingUi = isProduction || appEnv === 'staging'
```

Implementation rules:

- Default new flags to off. Demo-only user-facing UI should require an explicit `true`.
- Keep `VITE_ENABLE_DEMO_API` for API fallback, not UI visibility. API fallback and visible demo badges are different concerns.
- Keep `VITE_ENABLE_DEMO_SHORTCUTS` for login shortcuts only.
- Keep `VITE_ENABLE_MOCK_CHECKOUT` for virtual checkout routes and labels.
- In production/staging examples, set demo UI flags to false.
- Never add non-public secrets to `VITE_*`; Vite exposes only prefixed variables to client code, and those values are public browser configuration.

### 2. Add a Small Demo Visibility Utility

Likely new file: `src/lib/demoVisibility.ts`.

Purpose:

- Make UI gate decisions readable.
- Keep route and component logic consistent.
- Avoid scattered checks like `apiMode === 'demo'` in pages.

Suggested shape:

```ts
import {
  enableDemoShortcuts,
  enableDemoUi,
  enableInternalDebugUi,
  enableMockCheckout,
  isDevelopment,
} from '@/lib/env'
import type { AppRouteMeta } from '@/app/router/routeConfig'

export function canShowDemoAccountShortcuts() {
  return isDevelopment && enableDemoShortcuts
}

export function canShowDemoRoute(route: AppRouteMeta) {
  return route.status !== 'demo' || enableDemoUi
}

export function canShowPlaceholderRoute(route: AppRouteMeta) {
  return route.status !== 'placeholder' || enableInternalDebugUi
}

export function canUseVirtualCheckout() {
  return enableMockCheckout
}
```

Keep it dependency-free and deterministic. It should read env constants only, not `window.location` or user state.

### 3. Map Internal Values to User-Facing Labels

Likely new file: `src/lib/displayLabels.ts`.

Phase 18 should stop rendering raw values like `in_progress`, `pending_review`, file upload `failed`, route `placeholder`, and analytics/support/admin internal statuses directly. Use typed maps and i18n keys.

Initial target types:

| Domain | Type/File | Current Risk |
| --- | --- | --- |
| Teacher help | `src/types/teacherHelp.ts`, `HelpRequestStatusBadge.tsx`, `TeacherHelpStatusCard.tsx`, tutor filters | `in_progress`, `cancelled`, and raw badge labels can leak. |
| Chat messages | `src/types/chat.ts`, `ChatMessageBubble.tsx` | Local labels exist but are hardcoded English and partially internal. |
| Uploads | `src/types/file.ts`, `AttachmentPreview.tsx` | Attachment preview renders `attachment.status` directly. |
| Billing/subscription | `src/types/billing.ts`, `SubscriptionBadge.tsx`, `BillingStatusAlert.tsx` | Trial/payment/mock checkout labels need product language. |
| Admin/support/feedback | `src/services/admin/adminApi.ts`, `src/types/supportTicket.ts`, admin lists | Raw admin statuses are likely visible. |
| Learning graph | `src/types/curriculumGraph.ts`, `CurriculumGraphView.tsx` | Topic status is rendered directly. |
| Route metadata | `src/app/router/routeConfig.ts` | `demo`, `placeholder`, `duplicate` are internal route lifecycle states. |

Suggested local helper:

```ts
export function formatTeacherHelpStatus(status: TeacherHelpStatus) {
  return teacherHelpStatusLabels[status] ?? teacherHelpStatusLabels.pending
}
```

Prefer returning translation keys or translated strings through `t()`. If the map is pure TypeScript, keep English only for developer-facing fallbacks and use JSON keys for UI. Add matching keys under `src/i18n/locales/*/common.json`, for example:

```json
"statusLabels": {
  "teacherHelp": {
    "pending": "Teacher review requested",
    "assigned": "Teacher assigned",
    "in_progress": "Teacher is reviewing",
    "resolved": "Resolved",
    "cancelled": "Closed"
  }
}
```

### 4. Harden Existing State Components In Place

The existing shared components are too thin for a production-facing pass:

- `src/components/common/LoadingState.tsx`
- `src/components/common/ErrorState.tsx`
- `src/components/common/EmptyState.tsx`
- `src/components/common/PageSkeleton.tsx`
- page-specific skeletons such as `ChatSkeleton`, `DashboardSkeleton`, `ParentDashboardSkeleton`, `TutorDashboardSkeleton`

Recommended changes:

- Add optional `title`, `message`, `action`, and `className` props to shared state components.
- Keep defaults translated through `common.status` or a new `common.states` group.
- Preserve simple usage by accepting a string message as today where practical.
- Use `role="status"` for loading, and action buttons for retry/create flows where existing hooks expose refetch or mutation reset.
- Do not add Suspense migration. The app already uses explicit TanStack Query state branches.

Likely page groups to harden:

- Auth: `LoginForm.tsx`, `RegisterForm.tsx`, `ForgotPasswordPage.tsx`
- Chat: `ChatPage.tsx`, `ChatMessageList.tsx`, `TeacherHelpStatusCard.tsx`, `TeacherEscalationCard.tsx`
- Parent: dashboard, report, child history pages
- Tutor: dashboard, request detail, availability editor
- Billing/pricing: billing page, virtual checkout, checkout result, plan cards
- Support: support request and ticket forms/lists
- Admin/organization/learning-intelligence demo surfaces

### 5. Prevent Duplicate Submits With Existing Mutation State

No new form library is needed. Existing components already use combinations of:

- `mutation.isPending`
- local `disabled` props
- React Hook Form / form submit handlers
- Zod validation

Phase 18 should audit every submit button and action button for:

- `disabled={mutation.isPending || invalidLocalCondition}`
- stable pending label from i18n
- no second navigation while pending
- no duplicate toast on repeated clicks
- retry/reset path after failed mutation

Focus files:

- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/TutorCredentialUpload.tsx`
- `src/components/chat/ChatInput.tsx`
- `src/components/chat/TeacherHelpStatusCard.tsx`
- `src/components/chat/TeacherRequestInlineAction.tsx`
- `src/components/feedback/FeedbackDialog.tsx`
- `src/components/support/SupportRequestForm.tsx`
- `src/components/support/SupportTicketForm.tsx`
- `src/components/tutor/TutorRequestNoteForm.tsx`
- `src/components/tutor/TutorAvailabilityEditor.tsx`
- `src/components/partnership/PartnershipInterestForm.tsx`
- `src/pages/billing/VirtualCheckoutPage.tsx`

### 6. Route and Navigation Cleanup

Current `AppRouter.tsx` includes routes such as `/billing/checkout/demo`, `/admin/advanced-analytics`, `/admin/retention`, `/curriculum-graph`, and organization/learning-intelligence demo pages. `routeConfig.ts` marks many entries with `status: 'demo'`, `status: 'placeholder'`, or `status: 'duplicate'`.

Recommended treatment:

- Internal route status may stay in TypeScript metadata.
- Do not render route status words directly to users.
- Gate demo-only routes from navigation by filtering `navItems` and route groups using `demoVisibility`.
- For direct access to disabled demo routes, render `NotFoundPage` or a production-facing unavailable state. Avoid "demo disabled" copy in user-facing mode.
- Keep `/billing/checkout/demo` behind `enableMockCheckout`; in production-facing mode, redirect to `/billing` or show a neutral unavailable page.
- Rename `AdminOperationsPlaceholderPage` user-visible copy; the component file can stay, but titles and descriptions should say the area is "Not available yet" or "Operations area" rather than "placeholder" or endpoint names.

### 7. Copy and i18n Cleanup

Use existing namespaces. Do not introduce CMS, ICU, Fluent, or a translation SaaS.

Audit and update:

- `src/i18n/locales/*/common.json`
- `src/i18n/locales/*/auth.json`
- `src/i18n/locales/*/billing.json`
- `src/i18n/locales/*/chat.json`
- `src/i18n/locales/*/parent.json`
- `src/i18n/locales/*/pricing.json`
- `src/i18n/locales/*/support.json`
- `src/i18n/locales/*/tutor.json`
- `src/i18n/locales/*/admin.json`
- hardcoded page/component copy found by `rg`

Search terms for implementation:

```bash
rg -n "\bdemo\b|\bmock\b|\btest\b|Codex|development|sample|placeholder|TODO|\bAI\b|Human backup|Teacher backup" src
rg -n "\b(in_progress|pending_review|mock_checkout|demo-api|placeholder)\b" src
```

Developer docs may still contain these terms. Phase 18's user-facing audit should focus on `src/`, locale JSON, E2E selectors that expose copy, and README production-facing sections.

## Environment Variable Handling

Use Vite's existing `import.meta.env` pattern only through `src/lib/env.ts`. Vite official docs confirm client-exposed env variables are strings and must be prefixed with `VITE_`; values are replaced for the client build and must be treated as public.

Recommended Phase 18 env matrix:

| Variable | Current/New | Default | Production-Facing Meaning |
| --- | --- | --- | --- |
| `VITE_APP_ENV` | Current | `development` | Drives development/staging/production logging and UI decisions. |
| `VITE_API_MODE` | Current | `demo` | API contract mode: `mock`, `demo`, `staging`, `production`. Not a UI copy switch. |
| `VITE_ENABLE_DEMO_API` | Current | `false` | Allows demo API fallback only when explicitly enabled. |
| `VITE_ENABLE_DEMO_SHORTCUTS` | Current | `false` | Shows fixed demo account shortcuts only in development. |
| `VITE_ENABLE_MOCK_CHECKOUT` | Current | `false` | Enables virtual checkout flow for local demos/tests. |
| `VITE_ENABLE_DEMO_UI` | New | `false` | Allows user-visible demo-only pages/badges/labels in local demo mode. |
| `VITE_ENABLE_INTERNAL_DEBUG_UI` | New | `false` | Allows internal route/status/debug surfaces for developers only. |
| `VITE_ENABLE_PAYMENT` | Current | `false` | Keeps real payment UX separate from virtual checkout. |

Do not add:

- `VITE_CODEX_*`, model-provider keys, or frontend AI provider switches.
- Secret tokens, API keys, database URLs, or payment secrets.
- More API mode names unless backend contract docs require them.

## Implementation-Ready File Map

| File/Area | Recommended Work |
| --- | --- |
| `src/lib/env.ts` | Add demo UI/debug UI flags; keep defaults off; document `VITE_*` values as public. |
| `src/lib/demoVisibility.ts` | New tiny helper for demo shortcuts, demo routes, placeholder routes, and virtual checkout visibility. |
| `src/lib/displayLabels.ts` | New typed label helpers for teacher help, chat message, attachment, billing, support, admin, learning graph, and route statuses. |
| `src/i18n/locales/*/common.json` | Add shared state/status/action labels across EN/DE/FR/IT. |
| `src/i18n/locales/*/{auth,billing,chat,parent,pricing,support,tutor,admin}.json` | Remove user-facing development/demo wording and hardcoded internal status phrasing. |
| `src/app/router/AppRouter.tsx` | Gate direct demo-only routes or route them to production-facing fallback when flags are off. |
| `src/app/router/routeConfig.ts` | Keep internal statuses typed; prevent labels/descriptions with `demo`/`placeholder` from reaching navigation. |
| `src/app/router/routeGroups.ts` | Reuse existing `demoAdvanced` grouping for gating and E2E route audits. |
| `src/layouts/AppLayout.tsx`, `src/lib/navigation.ts` | Filter navigation items by demo/placeholder visibility. |
| `src/components/auth/LoginForm.tsx` | Demo shortcuts must use `canShowDemoAccountShortcuts()`. |
| `src/pages/billing/VirtualCheckoutPage.tsx`, `CheckoutResultPage.tsx` | Keep virtual checkout behind `enableMockCheckout`; use neutral copy when disabled. |
| `src/components/chat/*` | Replace AI/mock/status copy; map message and teacher-help statuses; keep duplicate submit guards. |
| `src/components/tutor/*` | Map request statuses and filters; avoid raw `in_progress`. |
| `src/components/learning/CurriculumGraphView.tsx` | Map topic status labels; remove direct raw status rendering. |
| `src/components/admin/*`, `src/pages/admin/*` | Remove endpoint/debug/placeholder language from production-facing UI; gate internal cards. |
| `src/components/common/*State.tsx` | Extend shared loading/error/empty components for consistent page states. |
| `tests/e2e/*` | Add production-facing no-artifact smoke checks and route-gating checks with existing Playwright. |
| `README.md`, `docs/qa/*` | Document Phase 18 env flags, audit commands, and release evidence. |

## Verification Commands

Run these before implementation handoff:

```bash
npm run lint
npm run build
npm run test:e2e
```

Run targeted artifact scans:

```bash
rg -n "\bdemo\b|\bmock\b|\btest\b|Codex|development|sample|placeholder|TODO|\bAI\b|Human backup|Teacher backup" src
rg -n "\b(in_progress|pending_review|mock_checkout|demo-api|placeholder)\b" src
```

Run targeted state scans:

```bash
rg -n "isPending|isSubmitting|disabled=.*isPending|disabled=.*isSubmitting|Loading\\.\\.\\.|Something went wrong|Nothing to show yet" src/components src/pages
```

Recommended Playwright additions:

- Production-facing artifact check over P0 routes: `/`, `/login`, `/register`, `/pricing`, `/chat`, `/dashboard`, `/parent`, `/tutor`, `/billing`, `/support`.
- Env-gated demo UI check with default flags off.
- Virtual checkout route check with `VITE_ENABLE_MOCK_CHECKOUT=false`.
- Locale smoke check over EN/DE/FR/IT for copied state labels if Phase 18 changes shared i18n keys.

## What Not To Add

Do not add:

- A new component library, design system, modal/toast package, or status-badge package.
- A new i18n framework, translation management service, ICU/FormatJS/Fluent migration, or machine translation workflow.
- A feature-flag SaaS or remote configuration service.
- MSW expansion or a new mock API layer just for hiding demo UI.
- Zustand stores for loading/error/empty state. Keep these local or in TanStack Query.
- A new unit-test framework solely for this milestone. Existing Playwright plus lint/build is sufficient.
- Direct OpenAI, Claude, Gemini, DeepSeek, Codex, or other model-provider frontend configuration.
- Frontend secrets, payment credentials, database URLs, or backend provider keys in `VITE_*`.
- Production backend, payment, SSO, refresh-token, or AWS deployment changes.
- New product modules, new languages, or a visual redesign.

## Sources

- Local source: `.planning/PROJECT.md`, `.planning/MILESTONES.md`, `package.json`, `src/lib/env.ts`, `src/app/router/AppRouter.tsx`, `src/i18n/locales/en/common.json`
- Vite official docs, env variables and modes: https://vite.dev/guide/env-and-mode/
- React Router official docs, declarative routing and route objects: https://reactrouter.com/start/declarative/routing and https://api.reactrouter.com/v7/types/react-router.BaseRouteObject.html
- TanStack Query official docs, disabling/lazy queries and query state implications: https://tanstack.com/query/latest/docs/react/guides/disabling-queries
- react-i18next official docs, namespaces and multiple translation files: https://react.i18next.com/guides/multiple-translation-files
- Playwright official docs, assertions and screenshot assertions: https://playwright.dev/docs/test-assertions
- React Hook Form official site, form-state/local form handling positioning: https://www.react-hook-form.com/
- Zod official docs, TypeScript-first schema validation: https://zod.dev/

## Bottom Line

Phase 18 is a typed cleanup and hardening pass, not a stack expansion. Add two small utilities (`demoVisibility` and `displayLabels`), extend `env.ts`, improve existing state components, move user-facing labels through i18n, gate demo-only UI with explicit off-by-default flags, and verify with current npm scripts plus targeted `rg`/Playwright checks.
