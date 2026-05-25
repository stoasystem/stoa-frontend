# Architecture Research

**Domain:** Frontend route, navigation, and page-flow architecture for a React SPA
**Researched:** 2026-05-25
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
src/app/router/AppRouter.tsx
  -> defines renderable routes and role guards

src/app/router/routeConfig.ts
  -> defines route metadata, nav labels, role ownership, status, priority

src/app/router/routeGroups.ts
  -> defines public/student/parent/tutor/admin/organization/demo route groups

src/lib/navigation.ts
  -> filters nav items by role, demo mode, status, active route

src/layouts/AppLayout.tsx
  -> renders role navigation from config, not local hard-coded arrays

src/components/common/
  -> Breadcrumbs, BackButton, PageActions, existing PageContainer/PageHeader/state components

docs/ia and docs/ux
  -> source-of-truth rationale, audits, journeys, layout/CTA/mobile/demo policy
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `routeConfig.ts` | Route/nav metadata source | Typed array of `AppNavItem` and page metadata. |
| `routeGroups.ts` | Route grouping and route ownership | Literal route arrays by role and visibility. |
| `navigation.ts` | Role/demo/active filtering | Pure functions over route/nav config. |
| `AppLayout` | Role navigation rendering | Uses current user role and `getNavItemsForRole`. |
| `Breadcrumbs` | Hierarchical page orientation | `nav aria-label`, `ol/li`, current item semantics. |
| `BackButton` | Detail-page return action | Link or navigate fallback with consistent label/icon. |
| `PageActions` | CTA grouping | Renders primary, secondary, tertiary, danger actions consistently. |
| IA docs | Audit and product decisions | Markdown artifacts under `docs/ia/`. |

## Recommended Project Structure

```text
src/
├── app/
│   └── router/
│       ├── AppRouter.tsx
│       ├── routeConfig.ts
│       └── routeGroups.ts
├── components/
│   └── common/
│       ├── Breadcrumbs.tsx
│       ├── BackButton.tsx
│       └── PageActions.tsx
├── layouts/
│   ├── AppLayout.tsx
│   ├── DashboardLayout.tsx
│   └── MarketingLayout.tsx
└── lib/
    └── navigation.ts

docs/
├── ia/
│   ├── page-inventory.md
│   ├── route-map.md
│   ├── navigation-architecture.md
│   ├── user-journeys.md
│   ├── page-entry-exit-audit.md
│   ├── orphan-page-audit.md
│   └── duplicate-page-audit.md
├── ux/
│   ├── cta-guidelines.md
│   ├── layout-guidelines.md
│   └── mobile-navigation.md
└── demo/
    └── final-demo-flow.md
```

### Structure Rationale

- **`src/app/router/`:** route decisions belong near `AppRouter.tsx`, but config should be separate from component rendering.
- **`src/lib/navigation.ts`:** pure nav helpers should be usable by layout, tests, and future docs checks.
- **`src/components/common/`:** Breadcrumbs, BackButton, and PageActions are cross-role helpers, not role-specific features.
- **`docs/ia/` and `docs/ux/`:** route/page decisions need written rationale because many choices are product hierarchy decisions, not just code decisions.

## Architectural Patterns

### Pattern 1: Typed Navigation Metadata

**What:** Define route/nav entries once with role, path, label, priority, status, and optional grouping.
**When to use:** When role navigation has grown beyond a few static links.
**Trade-offs:** Adds metadata maintenance, but prevents hard-coded sidebar drift.

```typescript
export type AppRouteRole = 'student' | 'parent' | 'tutor' | 'admin' | 'organization'
export type AppRoutePriority = 'primary' | 'secondary' | 'hidden'
export type AppRouteStatus = 'core' | 'demo' | 'placeholder' | 'duplicate' | 'deprecated'

export type AppNavItem = {
  label: string
  path: string
  role: AppRouteRole
  priority: AppRoutePriority
  status: AppRouteStatus
}
```

### Pattern 2: Role-Filtered Navigation

**What:** Layout asks a helper for nav items based on current role and demo visibility.
**When to use:** Always in `AppLayout`; page code should not rebuild role nav.
**Trade-offs:** Requires clear role mapping for organization admin/school roles.

```typescript
export function getNavItemsForRole(
  role: AppRouteRole,
  options: { showDemo?: boolean } = {},
) {
  return navItems.filter((item) => {
    if (item.role !== role) return false
    if (item.priority === 'hidden' && !options.showDemo) return false
    if (item.status === 'demo' && !options.showDemo) return false
    return item.status !== 'deprecated'
  })
}
```

### Pattern 3: Explicit Deep-Page Orientation

**What:** Deep pages receive breadcrumb/back metadata from route config or page context.
**When to use:** Parent child detail/report, tutor request detail, admin ticket detail, organization student learning profile, learning profile/graph/diagnosis.
**Trade-offs:** Explicit metadata is less automatic but avoids poor dynamic labels.

### Pattern 4: Documentation-Driven IA

**What:** Phase 73 creates a full inventory and audit before Phase 74 edits navigation.
**When to use:** Brownfield product with accumulated routes and demo pages.
**Trade-offs:** Slower start, but reduces risk of deleting or hiding a needed path.

## Data Flow

### Navigation Flow

```text
current user role
  -> role normalization
  -> getNavItemsForRole(role, { showDemo })
  -> AppLayout nav
  -> NavLink active state / custom active matcher
  -> visible role navigation
```

### Page-Flow Audit Flow

```text
AppRouter route list
  -> page inventory
  -> route map
  -> entry/exit audit
  -> orphan/duplicate decisions
  -> routeConfig status/priority
  -> navigation and page helper changes
  -> QA/demo/E2E verification
```

## Anti-Patterns

### Anti-Pattern 1: Navigation as Scattered Arrays

**What people do:** Keep role navigation hard-coded in `AppLayout` and add links whenever pages appear.
**Why it's wrong:** Navigation drifts from route map and exposes low-priority demo pages.
**Do this instead:** Use typed route/nav config and pure filtering helpers.

### Anti-Pattern 2: URL-Derived IA

**What people do:** Treat URL prefixes as the product structure.
**Why it's wrong:** URLs often preserve implementation history, not user mental models.
**Do this instead:** Use route map plus role journeys to decide visible hierarchy.

### Anti-Pattern 3: Breadcrumbs as Back Buttons

**What people do:** Add breadcrumbs and remove local return actions.
**Why it's wrong:** Breadcrumbs express hierarchy; Back buttons express task return.
**Do this instead:** Use both on complex detail pages when they answer different user questions.

### Anti-Pattern 4: Demo Pages in Core Navigation

**What people do:** Expose all high-value demo surfaces in primary nav.
**Why it's wrong:** Students/parents/tutors lose the main task path.
**Do this instead:** Use hidden/demo priority and contextual cards from dashboards/reports.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `AppRouter` to `routeConfig` | Same path constants or explicit sync | Avoid route paths diverging between render and nav metadata. |
| `AppLayout` to `navigation.ts` | Function calls | Layout owns rendering, helper owns filtering. |
| Page components to Breadcrumbs | Props/context | Dynamic labels such as child/student/request names come from page data. |
| Docs to code | Manual verification and future tests | Phase 13 can add simple tests later if useful, but docs are first. |

## Sources

- React Router NavLink docs: https://reactrouter.com/api/components/NavLink
- React Router handle/useMatches docs: https://reactrouter.com/how-to/using-handle
- WAI-ARIA APG Breadcrumb Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
- WCAG 2.2 Recommendation: https://www.w3.org/TR/WCAG22/
- U.S. Web Design System Breadcrumb: https://designsystem.digital.gov/components/breadcrumb/
- Atlassian navigation redesign write-up: https://www.atlassian.com/blog/design/designing-atlassians-new-navigation
- Existing STOA code: `src/app/router/AppRouter.tsx`, `src/layouts/AppLayout.tsx`

---
*Architecture research for: STOA Phase 13 frontend IA and UX optimization*
*Researched: 2026-05-25*
