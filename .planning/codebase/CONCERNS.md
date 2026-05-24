# Codebase Concerns

**Analysis Date:** 2026-05-24

## Tech Debt

**Build scaffold is incomplete:**
- Issue: `package.json` defines `npm run build` as `tsc -b && vite build`, but no `tsconfig*.json` or `index.html` is present.
- Files: `package.json`, missing `tsconfig.json`, missing `index.html`.
- Why: The repo appears to be an early frontend skeleton.
- Impact: Production build is unlikely to work until standard Vite project files are added.
- Fix approach: Add `tsconfig.json`, `tsconfig.app.json` or equivalent, `index.html`, and any required Vite env type declarations.

**Lint scaffold is incomplete:**
- Issue: `npm run lint` invokes ESLint, but no ESLint 9 flat config exists.
- Files: `package.json`, missing `eslint.config.*`.
- Why: Dependencies and script were added before tool configuration.
- Impact: Lint command may fail or use no project-specific rules.
- Fix approach: Add `eslint.config.js` / `eslint.config.mjs` with TypeScript and React rules compatible with ESLint 9.

**Route pages are placeholders:**
- Issue: Every role page returns a plain TODO string.
- Files: `src/pages/**`.
- Why: The project currently defines navigation and architecture before implementing workflows.
- Impact: The app has route coverage but no user-facing functionality yet.
- Fix approach: Implement one vertical workflow at a time, starting with the route that validates the core product value.

**Auth state is not hydrated:**
- Issue: `src/stores/authStore.ts` defines `user`, but no code populates it from Cognito or backend profile data.
- Files: `src/stores/authStore.ts`, `src/main.tsx`, `src/App.tsx`.
- Why: Auth infrastructure exists, but profile/session loading is not implemented.
- Impact: Role-aware UI and access decisions cannot work reliably.
- Fix approach: Add session/profile bootstrap logic, likely via React Query plus a route guard or auth provider.

## Known Bugs

**Redirects to missing `/login` route on 401:**
- Symptoms: A 401 API response sets `window.location.href = '/login'`, but `src/App.tsx` does not define a `/login` route.
- Trigger: Any API call through `src/lib/api.ts` that receives HTTP 401.
- Workaround: None in-app.
- Root cause: Auth failure behavior was added before login routing.
- Fix: Add a login route or redirect to a route that exists.

**Comment says pages are lazy loaded, but imports are eager:**
- Symptoms: `src/App.tsx` comment says `// Pages — lazy loaded`, but components are statically imported.
- Trigger: Reading or modifying routing code.
- Workaround: Treat comment as stale.
- Root cause: Likely planned lazy loading was not implemented.
- Fix: Either implement `React.lazy` and `Suspense`, or update the comment.

## Security Considerations

**No route guards:**
- Risk: Student, parent, teacher, and admin routes are all accessible by path in the browser.
- Current mitigation: None in frontend routing.
- Recommendations: Add authenticated and role-aware guards in `src/App.tsx` or a dedicated guard component, backed by trusted backend profile claims.

**Auth store role is client-controlled state:**
- Risk: If role checks are based only on Zustand state, users could manipulate client state.
- Current mitigation: API requests carry Cognito tokens, so backend authorization can still enforce access if implemented server-side.
- Recommendations: Treat frontend role checks as UX only; enforce all permissions on the backend.

**Environment variable validation is absent:**
- Risk: Missing Cognito config can cause runtime auth failures that are hard to diagnose.
- Current mitigation: None.
- Recommendations: Validate required `VITE_*` values at startup and show a clear development error.

## Performance Bottlenecks

**Auth session lookup on every API request:**
- Problem: The Axios request interceptor calls `fetchAuthSession()` per request.
- Measurement: No runtime measurement exists.
- Cause: Simple centralized auth injection.
- Improvement path: Confirm Amplify caches sessions efficiently; if request volume grows, consider request batching and avoid unnecessary API calls.

**No route-level code splitting:**
- Problem: All route components are imported eagerly in `src/App.tsx`.
- Measurement: Negligible today because pages are placeholders.
- Cause: Static imports.
- Improvement path: Add lazy loading once pages become substantial.

## Fragile Areas

**API auth failure path:**
- Why fragile: It performs a global browser redirect from inside an Axios interceptor.
- Common failures: Redirecting to a missing route, interrupting public flows, losing intended return URL.
- Safe modification: Add tests around 401 behavior before expanding auth flows.
- Test coverage: None.

**Cognito configuration:**
- Why fragile: Env vars are passed directly into Amplify config without validation.
- Common failures: Undefined pool ID/client ID causing auth runtime errors.
- Safe modification: Add an explicit config validation module and developer-facing error message.
- Test coverage: None.

**Future role routing:**
- Why fragile: `src/App.tsx` already imports `useAuthStore` but does not use `user`, suggesting planned access control is unfinished.
- Common failures: Admin or teacher pages exposed, redirect loops, stale role state.
- Safe modification: Design route guard behavior before adding page-specific API calls.
- Test coverage: None.

## Scaling Limits

**Frontend-only shell:**
- Current capacity: Not applicable; no API-backed views are implemented.
- Limit: Product value is blocked by missing workflows, not runtime capacity.
- Symptoms at limit: Users see only TODO placeholders.
- Scaling path: Implement vertical slices with API, loading, error, and empty states.

**Backend dependency:**
- Current capacity: Unknown.
- Limit: The frontend assumes a backend API and Cognito auth, but backend contracts are not documented here.
- Symptoms at limit: Integration drift, mismatched routes, or auth claims.
- Scaling path: Define typed API contracts before building data-heavy pages.

## Dependencies at Risk

**React Router DOM `^7.0.0`:**
- Risk: v7 introduced API/package changes relative to common v6 examples.
- Impact: Copying v6-era guard or data-router examples may not fit cleanly.
- Migration plan: Use official v7 docs when implementing guards and loaders.

**ESLint `^9.0.0`:**
- Risk: ESLint 9 expects flat config; older `.eslintrc` examples may not work.
- Impact: Lint setup can fail if copied from older projects.
- Migration plan: Add an ESLint 9 flat config.

**No lockfile:**
- Risk: Dependency resolution can drift across machines and dates.
- Impact: Non-reproducible installs and unexpected minor/patch changes.
- Migration plan: Generate and commit a lockfile for the chosen package manager.

## Missing Critical Features

**Login/session bootstrap:**
- Problem: Cognito is configured, but no login page or current-user loading flow exists.
- Current workaround: None.
- Blocks: Protected routes, role-based UX, API-backed workflows.
- Implementation complexity: Medium.

**Core student workflow:**
- Problem: Student ask, answer, and history pages are placeholders.
- Current workaround: None.
- Blocks: Validation of the product's main learning loop.
- Implementation complexity: Medium to high depending on backend contract and image upload flow.

**Role dashboards:**
- Problem: Parent, teacher, and admin routes exist but are placeholders.
- Current workaround: None.
- Blocks: Multi-role platform behavior.
- Implementation complexity: Medium per role.

**Shared UI/design system:**
- Problem: No styling, layout, or component primitives exist.
- Current workaround: Raw `<div>` placeholder pages.
- Blocks: Production-grade UX and consistent implementation speed.
- Implementation complexity: Medium.

## Test Coverage Gaps

**All source code:**
- What's not tested: Route table, API client, auth behavior, stores, and all future pages.
- Risk: Auth redirects and role access can regress silently.
- Priority: High once implementation begins.
- Difficulty to test: Low to medium after adding Vitest, React Testing Library, and mocks for Amplify.

---
*Concerns audit: 2026-05-24*
*Update as issues are fixed or new ones discovered*
