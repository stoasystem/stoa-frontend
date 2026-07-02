---
status: resolved
trigger: "pricing会直接跳转到登录页"
created: 2026-07-02
updated: 2026-07-02
---

# Debug Session: pricing-redirects-to-login

## Symptoms

- expected: Clicking the public Pricing navigation item opens the public `/pricing` page.
- actual: Clicking Pricing redirects directly to `/login`.
- errors: No visible browser error provided.
- timeline: Unknown.
- reproduction: From the public marketing header shown in the screenshot, click `Pricing`.

## Current Focus

- hypothesis: The public Pricing page performs a billing plans API request; an unauthenticated 401 triggers the global HTTP interceptor redirect to `/login`.
- test: Inspect pricing route/page dependencies and verify no protected route wraps `/pricing`.
- expecting: `/pricing` is public, but `PricingPage` calls `useBillingPlansQuery()`, which calls `/billing/plans`.
- next_action: Complete verification and close the session.
- reasoning_checkpoint:
- tdd_checkpoint:

## Evidence

- timestamp: 2026-07-02
  observation: `src/app/router/AppRouter.tsx` declares `/pricing` before the protected route wrapper.
  implication: The route itself is public; redirect is likely caused by page side effects.
- timestamp: 2026-07-02
  observation: `src/pages/pricing/PricingPage.tsx` calls `useBillingPlansQuery()`.
  implication: Loading the public pricing page triggers billing API data fetching.
- timestamp: 2026-07-02
  observation: `src/services/billing/billingApi.ts` fetches `/billing/plans` through `httpClient`.
  implication: If the endpoint requires auth, unauthenticated users receive 401.
- timestamp: 2026-07-02
  observation: `src/services/api/httpClient.ts` redirects all 401 responses to `/login`.
  implication: A public page can be redirected if it calls an auth-gated endpoint.

## Eliminated

- hypothesis: `/pricing` is nested under `ProtectedRoute`.
  reason: `AppRouter` defines `/pricing` as a top-level public route.

## Resolution

- root_cause: The public Pricing page called `useBillingPlansQuery()`, which requested `/billing/plans` through the global `httpClient`. When that unauthenticated request returned 401, the response interceptor redirected the browser to `/login`, even though `/pricing` is a public route.
- fix: `PricingPage` now renders its plan cards from the existing static public `pricingPlans` data instead of fetching billing plans on page load.
- verification: `npm run build` passed. Headless browser smoke clicked the header Pricing link and ended at `http://127.0.0.1:5173/pricing` with heading `Pricing`. A direct `/pricing` smoke recorded 0 `/billing/plans` requests.
- files_changed: `src/pages/pricing/PricingPage.tsx`, `.planning/debug/pricing-redirects-to-login.md`
