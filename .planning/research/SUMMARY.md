# Project Research Summary

**Project:** STOA Frontend
**Domain:** Frontend information architecture, role navigation, page flow, and UX optimization
**Researched:** 2026-05-25
**Confidence:** HIGH

## Executive Summary

Phase 13 should be treated as a product-structure milestone, not a feature milestone. The research supports the user's stated direction: inventory the accumulated frontend pages, classify routes by role/status/priority, move navigation into typed configuration, and make every core page reachable through visible role flows rather than direct URLs.

The existing React + TypeScript + Vite stack is sufficient. No new package is required. React Router's `NavLink` can handle active navigation states, and its route metadata patterns are a useful reference, but a full router migration is not justified for this milestone. Breadcrumbs, back buttons, page actions, CTA rules, state guidelines, and mobile navigation can be implemented using existing STOA primitives plus a few narrow common components.

The main risk is creating static documentation that does not change the app. Phase 13 should therefore couple docs to implementation: first inventory and audit, then route/nav config, then role navigation rendering, then breadcrumbs/back/page actions, then layout/mobile/demo QA.

## Key Findings

### Recommended Stack

No stack additions are recommended.

**Core technologies:**
- React: existing component framework.
- React Router DOM: existing routing and navigation state layer.
- TypeScript: route/nav metadata should be typed.
- TailwindCSS and existing UI primitives: sufficient for layout, state, and mobile nav polish.
- Playwright: existing route/demo flow verification path.

### Expected Features

**Must have:**
- Complete page inventory and route map.
- Role-based route grouping and navigation architecture.
- Core/demo/placeholder/hidden/deprecated classification.
- Entry/exit, orphan, and duplicate/overlap audits.
- Typed `routeConfig.ts`, `routeGroups.ts`, and navigation utility.
- Breadcrumbs, BackButton, and PageActions for deep/detail flows.
- CTA/layout/state/mobile guidelines.
- Final demo flow and verification updates.

**Should have:**
- Demo/advanced route gating.
- Contextual card/CTA entries for hidden advanced pages.
- Mobile role-specific destination subsets.
- Clear placeholder/demo language.

**Defer:**
- Full data-router migration.
- New routing framework.
- Full visual redesign.
- Component documentation and accessibility hardening beyond Phase 13 scope; those belong naturally in Phase 14.

### Architecture Approach

Use a documentation-driven IA process followed by typed route/nav config. The route renderer remains `AppRouter.tsx`; route metadata lives in `src/app/router/routeConfig.ts`; grouped route lists live in `src/app/router/routeGroups.ts`; pure filtering helpers live in `src/lib/navigation.ts`; UI helpers live in `src/components/common/`.

**Major components:**
1. Page inventory and IA docs - establish truth before edits.
2. Route/nav config - encode status, priority, role, and path decisions.
3. Navigation utility - filter by role, show/hide demo routes, and detect active states.
4. Breadcrumbs/BackButton/PageActions - make deep/detail pages navigable.
5. QA/demo docs - verify users do not need manual URLs for core and demo paths.

### Critical Pitfalls

1. **Feature expansion drift** - avoid by keeping Phase 13 limited to IA, nav, page flow, docs, and verification.
2. **Docs drift from code** - avoid by turning inventory decisions into route/nav config.
3. **Hidden core pages** - avoid by documenting entry/exit for every hidden/secondary route.
4. **Inaccessible breadcrumbs** - avoid by following WAI-ARIA APG semantics.
5. **Mobile desktop mirroring** - avoid by defining mobile role subsets.
6. **CTA inconsistency** - avoid by documenting action hierarchy and checking major pages.

## Implications for Roadmap

The existing v1.12 roadmap remains structurally correct, but research clarifies the execution emphasis inside each phase.

### Phase 73: Page Inventory, Route Map, and IA Audits

**Rationale:** All later config and UX changes need an accurate map of what exists.
**Delivers:** `docs/ia/page-inventory.md`, route map, entry/exit audit, orphan audit, duplicate audit.
**Addresses:** IA-01 through IA-05, ROUTE-01 through ROUTE-06, AUDIT-01 through AUDIT-05.
**Avoids:** Static docs drift and hidden core pages.

### Phase 74: Route Groups, Navigation Config, and Role-Based Navigation

**Rationale:** Navigation should be generated from metadata, not hard-coded arrays in layout.
**Delivers:** `routeConfig.ts`, `routeGroups.ts`, `navigation.ts`, refactored `AppLayout`.
**Uses:** TypeScript, React Router `NavLink`, existing role store.
**Avoids:** Scattered navigation arrays and demo-page overexposure.

### Phase 75: User Journeys, Breadcrumbs, Back Buttons, and Page Flow Helpers

**Rationale:** Once nav is configured, deep/detail pages need orientation and return paths.
**Delivers:** `user-journeys.md`, Breadcrumbs, BackButton, PageActions, targeted page updates.
**Uses:** WAI-ARIA/APG and USWDS breadcrumb semantics.
**Avoids:** Dead-end details and inaccessible breadcrumbs.

### Phase 76: Layout Standards, CTA Hierarchy, and Page State Guidelines

**Rationale:** Page hierarchy and actions need consistent rules before final demo/mobile verification.
**Delivers:** layout guidelines, CTA guidelines, state guidance, placeholder/demo policy.
**Avoids:** Pages with multiple competing primary CTAs or misleading placeholders.

### Phase 77: Mobile Navigation and Responsive Flow Optimization

**Rationale:** Mobile IA should be a role-prioritized subset, not a compressed desktop sidebar.
**Delivers:** mobile navigation docs and targeted mobile flow cleanup.
**Uses:** Existing responsive CSS/layout primitives; no new package.
**Avoids:** Overloaded mobile nav and chat/report input obstruction.

### Phase 78: Final Demo Flow, README, Manual QA, and E2E Path Updates

**Rationale:** The demo path should prove the new IA works without manual URLs.
**Delivers:** final demo flow, README section, manual QA updates, E2E/route-smoke updates.
**Avoids:** Demo path drift and undocumented route assumptions.

### Phase 79: Phase 13 Verification and Build Closure

**Rationale:** Phase 13 touches navigation and app structure; it must close with command and flow evidence.
**Delivers:** install/dev/build verification, manual/E2E path checks, traceability closure.
**Avoids:** "Looks organized" without runnable proof.

### Phase Ordering Rationale

- Inventory must precede route config.
- Route config must precede navigation rendering cleanup.
- Navigation cleanup must precede page-flow helpers.
- Layout/CTA/state rules must precede mobile and demo verification.
- Final build/QA should close after docs and route smoke updates.

### Research Flags

Phases likely needing deeper local code investigation during planning:
- **Phase 73:** must reconcile every route in `AppRouter.tsx`, `src/pages/**`, and docs.
- **Phase 74:** must normalize organization roles (`organization_admin`, `school_teacher`, `school_viewer`) against the requested `organization` role category.
- **Phase 75:** must inspect individual deep pages to avoid adding generic breadcrumbs with poor labels.
- **Phase 77:** must test mobile layouts around chat input, parent reports, billing, and tutor detail pages.

Phases with standard patterns:
- **Phase 76:** layout/CTA/state docs can follow established STOA primitives and public design-system guidance.
- **Phase 78:** demo flow and README updates are straightforward once navigation is settled.
- **Phase 79:** command verification follows existing npm scripts.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack is enough; official React Router docs cover nav active state and route metadata patterns. |
| Features | HIGH | User supplied detailed scope and code confirms accumulated route complexity. |
| Architecture | HIGH | Typed config plus pure helpers fits current codebase and avoids a routing migration. |
| Pitfalls | HIGH | Risks are directly visible in current `AppLayout` hard-coded role arrays and route volume. |

**Overall confidence:** HIGH

### Gaps to Address

- **Route inventory completeness:** Phase 73 should mechanically verify route list against `AppRouter.tsx`.
- **Dynamic breadcrumb labels:** Phase 75 should use page data for names rather than URL ids where possible.
- **Demo account assumptions:** Phase 78 must verify existing seed/demo account docs before claiming the final demo flow is executable.
- **Mobile nav implementation choice:** Phase 77 should inspect existing CSS/layout constraints before choosing drawer, bottom nav, or hybrid.

## Sources

### Primary (HIGH confidence)

- React Router NavLink docs: https://reactrouter.com/api/components/NavLink
- React Router handle/useMatches docs: https://reactrouter.com/how-to/using-handle
- WAI-ARIA APG Breadcrumb Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
- WCAG 2.2 Recommendation: https://www.w3.org/TR/WCAG22/
- U.S. Web Design System Breadcrumb: https://designsystem.digital.gov/components/breadcrumb/
- Material Design Navigation Drawer: https://m2.material.io/components/navigation-drawer
- Material Design Bottom Navigation: https://m2.material.io/develop/flutter/components/bottom-navigation/

### Secondary (MEDIUM confidence)

- Atlassian navigation redesign write-up: https://www.atlassian.com/blog/design/designing-atlassians-new-navigation

### Local Project Evidence (HIGH confidence)

- `package.json`
- `src/app/router/AppRouter.tsx`
- `src/layouts/AppLayout.tsx`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`

---
*Research completed: 2026-05-25*
*Ready for roadmap: yes*
