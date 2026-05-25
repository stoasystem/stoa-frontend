# Project Research Summary

**Project:** STOA Frontend
**Domain:** Production-facing frontend cleanup, stability hardening, and demo artifact removal
**Researched:** 2026-05-26
**Confidence:** HIGH

## Executive Summary

Phase 18 is a cleanup and hardening milestone for an existing React/Vite STOA frontend, not a product expansion or production-backend milestone. The researched app already has broad customer and operator surfaces across public pages, auth/onboarding, chat, parent, tutor, pricing, billing, support, admin, organization, and learning-intelligence routes. Experts should make this kind of app production-facing by tightening the presentation boundary: keep internal demo infrastructure available for developers and tests, but prevent demo/mock/test/provider/internal values from rendering on default user-facing paths.

The recommended approach is narrow and implementation-oriented. Keep the existing React 19, TypeScript, Vite, TailwindCSS 4, i18next, TanStack Query, React Hook Form, Zod, Sonner, and Playwright stack. Add small local utilities and components for semantic environment visibility, route gating, display-label mapping, sanitized user-facing errors, internal debug panels, and status rendering. Then update existing pages/components and EN/DE/FR/IT locale JSON so production-facing routes show product-safe copy, consistent loading/empty/error/success states, and duplicate-submit protection.

The main risks are doing either too much or too little: deleting demo mechanics that local development and E2E depend on, or doing a shallow grep cleanup that still leaks raw statuses, fallback data, route statuses, endpoint names, or "mock checkout" copy at runtime. Mitigate this with a calibrated source inventory, narrow environment flags, domain-specific display labels, localized state copy, browser-visible QA, and docs that preserve developer truth while keeping product UI clean.

## Key Findings

### Recommended Stack

Phase 18 should not add runtime or test dependencies. The current stack is sufficient for the work: cleanup should be implemented through typed local helpers, existing i18n namespaces, existing shared state components, existing route metadata, and current npm/Playwright verification. Do not introduce a CMS, translation service, feature-flag SaaS, design-system replacement, mock API expansion, or frontend model-provider/payment integration.

**Core technologies:**
- React 19 + React Router 7 + Vite 6: keep the SPA and route declaration model intact while gating demo/placeholder surfaces.
- TypeScript 5.5: use typed env flags, route metadata helpers, and domain-specific label maps instead of ad hoc string replacement.
- TailwindCSS 4 + local UI primitives: harden loading/error/empty states in place without a component-library swap.
- i18next + react-i18next: all user-facing cleanup must land in existing EN/DE/FR/IT locale files or i18n-backed components.
- TanStack Query 5: keep server-state loading/error/empty handling in page/query branches; do not duplicate server data into Zustand.
- React Hook Form + Zod: preserve validation patterns and add pending guards for duplicate-submit prevention.
- Sonner + common state components: standardize feedback, retry, empty, and success affordances without a new notification layer.
- Playwright + `rg`: provide route, locale, flag, and banned-term evidence using existing tooling.

**Stack additions/constraints:**
- Add semantic flags in `src/lib/env.ts`, such as `showDemoAccounts`, `showCheckoutPreview`, `showInternalDebug`, and `showDemoSurfaces`; default production-facing visibility to off.
- Add small local helpers/components: `demoVisibility`, `displayLabels`, `userFacingText`, `SafeStatusLabel`, `InternalDebugPanel`, and a route wrapper such as `DemoSurfaceRoute`.
- Treat `VITE_*` values as public browser configuration, never secrets or security boundaries.
- Keep demo API fallback, fixed demo accounts, and virtual checkout available for explicit local/demo contexts and E2E.

### Expected Features

**Must have (table stakes):**
- Production-facing terminology audit for P0 routes and locale files, removing or gating `demo`, `mock`, `test`, `Codex`, `development`, `sample`, `placeholder`, `virtual checkout`, and equivalent internal wording.
- EN/DE/FR/IT copy cleanup for auth, chat, parent, tutor, pricing, billing, support, admin primary surfaces, and public/high-traffic pages.
- Demo account shortcuts hidden by default and unavailable in production-facing mode.
- Mock/virtual checkout routes and CTAs hidden, redirected, or product-safely relabeled outside explicit local/demo mode.
- Demo API fallback documented and unable to silently mask staging/production failures.
- Display-label mapping for subscription plans/statuses, teacher-help statuses, support ticket values, onboarding/review statuses, attachment statuses, route statuses, and admin/learning statuses.
- Loading, empty, error, success, retry, disabled-feature, unauthorized, forbidden, and not-found states that are localized and product-safe.
- Duplicate-submit guards for login/register, chat send, teacher-help request, tutor updates, support tickets, billing/checkout actions, uploads, and partnership/support forms.
- QA evidence: banned-term scan, route x locale x environment checks, raw-status absence checks, build/lint, and release/README notes.

**Should have (differentiators):**
- Production-facing copy audit matrix by route, locale, environment, and state.
- Guard verification matrix for local demo, staging-like, production-facing preview, and production configurations.
- User-visible copy scan script, for example `npm run qa:copy`, focused on rendered source and locale values.
- Cross-locale state QA for loading/error/empty/success states, not only happy-path copy.
- Internal-only debug panel for env/API/endpoint details that developers still need.

**Defer (v2+):**
- New business modules, organization/learning-intelligence polish, real payment collection, production backend/payment/auth changes, direct model-provider integration, new languages, legal finalization, formal visual regression infrastructure, and broad visual redesign.

### Architecture Approach

Phase 18 should integrate as a thin safety and presentation layer over the existing architecture. Keep route ownership in `AppRouter`/route metadata, server state in TanStack Query, copy in i18n locale files, feature form state in local forms/mutations, and shared loading/error/empty presentation in the existing common components. Add only focused helpers at render boundaries so internal identifiers, fallback data, API errors, and route metadata do not leak into user-facing UI.

**Major components:**
1. `src/lib/env.ts` and `src/lib/demoVisibility.ts` - semantic public-config flags and visibility decisions for demo accounts, demo routes, checkout previews, and debug surfaces.
2. `src/app/router/{AppRouter,routeConfig,routeGroups}.ts(x)` plus `src/lib/navigation.ts` - hide demo/placeholder/duplicate/deprecated routes from default navigation and route direct access to a production-facing fallback.
3. `src/lib/displayLabels.ts` and `src/components/common/SafeStatusLabel.tsx` - map internal enum/API values to localized domain labels before rendering.
4. `src/lib/userFacingText.ts` - sanitize backend/dynamic errors and prevent raw endpoint, code, provider, env, or internal status leakage.
5. `src/components/common/InternalDebugPanel.tsx` - preserve useful diagnostics behind an explicit non-production debug gate.
6. `src/components/common/{LoadingState,ErrorState,EmptyState,PageSkeleton}.tsx` and page-specific skeletons - standardize localized state rendering and retry/action affordances.
7. `src/i18n/locales/{en,de,fr,it}` - source of all customer-facing cleanup copy across existing namespaces.
8. `scripts/scan-user-facing-copy.mjs` or documented `rg`/Playwright checks - repeatable Phase 18 evidence.

### Critical Pitfalls

1. **Uncalibrated cleanup scans** - classify matches as rendered UI, developer-only UI, internal identifier, test fixture, docs, or API/analytics contract. Clean rendered copy; preserve internal names unless they leak.
2. **Breaking demo workflows** - keep demo accounts, demo fallback, virtual checkout, reset helpers, and E2E flags for local/demo contexts; hide or relabel their UI exposure instead of deleting mechanics.
3. **Overbroad feature flags** - keep narrow flags for demo shortcuts, mock checkout, demo API fallback, payment, support, teacher help, and debug UI. Frontend flags are presentation/config only, not security controls.
4. **Raw status and enum leakage** - never render `{status}`, `.replace('_', ' ')`, route statuses, plan IDs, ticket categories, or attachment statuses directly. Use domain-specific label maps and localized fallbacks.
5. **i18n drift** - update EN/DE/FR/IT together, avoid English-only fixes, and make fallback English/raw keys a QA failure on P0/P1 changed routes.
6. **Error states without recovery** - polished copy still needs retry, return, contact, sign-in, or saved/not-saved guidance.
7. **Duplicate-submit regressions** - guard at handler entry and disable controls while pending; reset forms only on success.
8. **Payment copy overclaims** - removing "mock/demo" must not imply live payment collection or subscription enforcement. Keep hosted-checkout boundaries clear.

## Implications for Roadmap

Based on research, suggested Phase 18 implementation structure:

### Phase 1: Audit Calibration and Source Inventory
**Rationale:** The cleanup must distinguish rendered product copy from useful internal identifiers before edits begin.
**Delivers:** User-facing source inventory, P0/P1/P2 route classification, banned-term scan baseline, allowlist categories, scope lock for what remains developer-only.
**Addresses:** Production-facing terminology audit, P0/P1 surface prioritization, QA evidence baseline.
**Avoids:** Renaming API/test/analytics contracts for no user benefit, while missing visible fallback strings or route metadata.

### Phase 2: Environment Guards and Demo Flow Preservation
**Rationale:** Production-facing mode should fail closed before broad copy work, but local demo/E2E flows must keep working.
**Delivers:** Semantic flags in `env.ts`, `demoVisibility` helpers, route/nav gating, `DemoSurfaceRoute`, demo shortcut gating, checkout preview gating, internal debug visibility, environment matrix docs.
**Addresses:** Demo-account guard, mock checkout guard, demo API fallback guard, route fallback behavior.
**Avoids:** Broken demo backend workflows, overbroad feature flags, route status leakage, virtual checkout deletion.

### Phase 3: Display Labels, User-Facing Text, and i18n Cleanup
**Rationale:** Once route visibility is controlled, render boundaries need reusable mappings so raw API/internal values cannot reappear.
**Delivers:** `displayLabels.ts`, `SafeStatusLabel`, `userFacingText.ts`, localized label keys, sanitized dynamic errors, cleaned copy across EN/DE/FR/IT P0 namespaces and hardcoded P0/P1 component text.
**Addresses:** Internal status labels, payment/billing copy, support/admin/tutor/chat status mapping, multilingual parity.
**Avoids:** Raw snake_case/kebab-case values, English-only status badges, backend/provider/endpoint errors in UI, payment overclaiming.

### Phase 4: State Hardening and Duplicate-Submit Controls
**Rationale:** Production-facing copy is incomplete if slow, empty, failing, or repeated-submit states still feel broken.
**Delivers:** Expanded shared `LoadingState`, `ErrorState`, `EmptyState`, and page skeleton usage; localized retry/empty/success states; pending guards at mutation handlers; preserved input on failure; reset-on-success behavior.
**Addresses:** Loading/empty/error/success states for auth, chat, parent, tutor, pricing, billing, support, and admin; duplicate-submit prevention.
**Avoids:** Dead-end friendly errors, duplicate tickets/messages/checkout starts, lost form content, accessibility regressions from copy-only edits.

### Phase 5: Production-Facing QA Evidence and Docs
**Rationale:** This milestone is regression-prone; it needs durable evidence, not just a source grep.
**Delivers:** `qa:copy` or documented scan, browser-visible route/state checks, route x locale x environment matrix, raw-status absence evidence, demo preservation checks, updated README/release checklist, `npm run lint`, `npm run build`, and relevant Playwright results.
**Addresses:** QA evidence, README/release checklist update, future guardrails for demo/production boundary.
**Avoids:** Grep-only closure, English-only QA, lost developer setup truth, brittle E2E selectors after copy changes.

### Phase Ordering Rationale

- Inventory first prevents false-positive churn and establishes which routes/states are in scope.
- Environment and route guards come before copy work so demo/placeholder surfaces stop leaking while cleanup proceeds.
- Display labels and i18n mappings come before broad page edits because many pages share the same raw status/copy risks.
- State hardening follows label/copy cleanup so loading, error, empty, and success states use final production-facing language.
- QA and docs close last because they need the final environment, route, copy, and state behavior.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Needs code-level source inventory and visible-text scan calibration so allowlists do not hide rendered leaks.
- **Phase 2:** Needs exact env matrix validation against current Playwright config, demo backend flow, and checkout/billing route behavior.
- **Phase 3:** Needs detailed call-site audit for every raw status, hardcoded string, locale key, fallback data value, and billing/support/admin label.
- **Phase 5:** Needs route/state/locale matrix definition and possibly selector updates where E2E currently asserts English copy.

Phases with standard patterns (skip research-phase):
- **Phase 4:** Uses established TanStack Query, React Hook Form, mutation pending, and shared state-component patterns; plan from code inspection rather than external research.
- **Build/lint/grep closure in Phase 5:** Standard local verification with existing npm and `rg` commands.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Stack research and codebase fit both support no new dependencies; existing tools cover env gating, i18n, state presentation, and QA. |
| Features | HIGH | P0/P1/P2 cleanup scope, table stakes, anti-features, and acceptance criteria are specific and grounded in current routes/locales/components. |
| Architecture | HIGH | Integration points are concrete: `env.ts`, router metadata, navigation, i18n namespaces, common state components, status badges, billing/support/chat/tutor/admin call sites. |
| Pitfalls | HIGH | Risks are grounded in current demo fallback, virtual checkout, route statuses, locale fallback behavior, raw status rendering, and E2E dependencies. |

**Overall confidence:** HIGH

### Gaps to Address

- Exact visible-copy hit list: run the calibrated scan and browser-visible checks during Phase 1 before deciding final allowlists.
- Final wording quality: EN/DE/FR/IT copy should be reviewed in implementation, especially payment, support, teacher-help, onboarding, legal-sensitive, and admin wording.
- Production env matrix: confirm intended values for local demo, staging-like, production-facing preview, and production before wiring final guards.
- E2E dependency map: identify tests and fixtures that require demo accounts, demo fallback, or virtual checkout so cleanup does not remove coverage.
- Raw fallback data: inspect demo service/data responses and API fallback plan/status strings that may render at runtime.
- Accessibility coverage: ensure changed loading/error/pending states retain labels, roles, focus behavior, and accessible names.

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` - stack constraints, no-new-dependency recommendation, env flags, implementation file map, verification commands.
- `.planning/research/FEATURES.md` - P0/P1/P2 cleanup categories, table stakes, anti-features, feature dependencies, acceptance criteria.
- `.planning/research/ARCHITECTURE.md` - integration points, new helper/component recommendations, build order, data-flow rules, modified file map.
- `.planning/research/PITFALLS.md` - critical/moderate/minor pitfalls, phase-specific warnings, roadmap slices, acceptance evidence.
- `.planning/PROJECT.md` and `.planning/MILESTONES.md` - Phase 18 scope, milestone boundaries, prior Phase 17 QA context.

### Supporting Implementation Context
- `src/lib/env.ts` - current environment/API/demo flags and fallback behavior.
- `src/app/router/AppRouter.tsx`, `src/app/router/routeConfig.ts`, `src/app/router/routeGroups.ts`, `src/lib/navigation.ts` - route and navigation visibility integration.
- `src/i18n/locales/{en,de,fr,it}` - current multilingual copy surface.
- `src/components/common/{LoadingState,ErrorState,EmptyState,PageSkeleton}.tsx` - shared state primitives.
- Auth, chat, billing, support, tutor, parent, admin, and learning components cited in the four research files - current hardcoded copy, raw status, and duplicate-submit risks.
- `tests/e2e/*.spec.ts` and `playwright.config.ts` - demo/E2E workflow preservation and QA evidence requirements.

### Official References
- Vite env variables and modes: https://vite.dev/guide/env-and-mode/
- React Router declarative routing and route objects: https://reactrouter.com/start/declarative/routing
- TanStack Query query-state guidance: https://tanstack.com/query/latest/docs/react/guides/disabling-queries
- react-i18next namespaces: https://react.i18next.com/guides/multiple-translation-files
- i18next fallback behavior: https://www.i18next.com/principles/fallback
- Playwright assertions and screenshots: https://playwright.dev/docs/test-assertions
- React Hook Form: https://www.react-hook-form.com/
- Zod: https://zod.dev/

---
*Research completed: 2026-05-26*
*Ready for roadmap: yes*
