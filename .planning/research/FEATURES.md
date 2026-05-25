# Feature Research

**Domain:** Frontend information architecture, page flow, and UX optimization
**Researched:** 2026-05-25
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Complete page inventory | Teams cannot improve IA without knowing every page and route. | MEDIUM | Must reconcile `AppRouter.tsx`, `src/pages/**`, docs, and role guards. |
| Route map by role and visibility | Users expect navigation to match their role and task. | MEDIUM | Include public, student, parent, tutor, admin, organization, billing/support, and demo routes. |
| Core/secondary/hidden/demo classification | Prevents placeholder and demo pages from crowding main nav. | LOW | Use status and priority fields in route config and docs. |
| Role-based primary navigation | Users expect stable navigation within their role. | MEDIUM | Student/parent/tutor/admin/organization should each have distinct top-level priorities. |
| Active nav state | Users need to know where they are. | LOW | React Router NavLink supports active state and applies `aria-current`. |
| Breadcrumbs on deep pages | Interior pages need hierarchy and orientation. | LOW | WAI-ARIA APG and USWDS both support breadcrumb use for hierarchical pages. |
| Back/return paths on detail pages | Detail pages should not dead-end after task completion. | LOW | Parent child/report, tutor request detail, admin ticket detail, organization student profile are required targets. |
| CTA hierarchy | Users need one obvious next action per page. | MEDIUM | Primary/secondary/tertiary/danger should be documented and reflected in major pages. |
| Empty/loading/error/success state guidance | State handling must remain predictable across many modules. | MEDIUM | Use existing `EmptyState`, `LoadingState`, `ErrorState`, skeletons, and toast patterns. |
| Mobile nav path rules | Sidebar-heavy IA fails on small screens. | MEDIUM | Student/parent/tutor require concise mobile destinations; admin/org can degrade. |
| Demo flow | STOA needs an executable investor/tester path without manual URLs. | MEDIUM | Final demo should use only visible entry points and stable demo data. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Page inventory linked to route config | Makes IA docs actionable instead of static paperwork. | MEDIUM | Keep docs and config aligned during Phase 73/74. |
| Role journey maps tied to CTAs | Helps STOA show "what should I do next?" for every role. | MEDIUM | Especially important after Phase 12 platform expansion. |
| Demo/advanced route gating | Lets STOA preserve rich demos without confusing normal users. | MEDIUM | Use `priority: hidden` and `status: demo/placeholder`. |
| Duplicate/overlap disposition | Prevents route bloat from becoming permanent product debt. | MEDIUM | Report/monthly report/history, admin usage/analytics, feedback/support are key overlaps. |
| Mobile-first role subset | Improves usability without forcing full desktop admin parity on phones. | LOW | Keep mobile nav intentionally smaller than desktop nav. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Put every route in the sidebar | Makes everything "discoverable." | Creates cognitive overload and hides core actions. | Only primary role paths in nav; contextual entry cards for advanced pages. |
| Breadcrumb every page | Seems consistent. | Redundant on top-level pages and can add clutter. | Use breadcrumbs for second-level/deep hierarchical pages. |
| Merge all admin pages immediately | Reduces nav length. | Risky without understanding operational distinctions. | Document overlap first, hide or group low-priority pages, merge later if verified. |
| Full route architecture migration | Feels cleaner. | Too much scope for Phase 13. | Add typed config around existing router. |
| Rebrand/redesign all pages | May make the product feel new. | Distracts from IA cleanup and risks inconsistent partial redesign. | Polish layout, CTA, and navigation within current visual system. |

## Feature Dependencies

```text
Page inventory
  -> route map
  -> orphan/duplicate/entry-exit audits
  -> routeConfig and routeGroups
  -> role-based navigation rendering
  -> breadcrumbs/back/page actions
  -> mobile nav and demo flow
  -> QA/E2E/build closure
```

### Dependency Notes

- **Inventory before nav refactor:** Navigation config needs complete route/status/priority facts.
- **Route map before breadcrumbs:** Deep-page breadcrumb hierarchy depends on route grouping and role context.
- **CTA/state guidelines before final QA:** Manual QA needs stable page action and state expectations.
- **Mobile nav after desktop role nav:** Mobile should reduce the already clarified role model, not invent a separate IA.

## MVP Definition

### Launch With (v1.12)

- [ ] Page inventory and route map.
- [ ] Entry/exit, orphan, and duplicate audits.
- [ ] Role navigation architecture and typed config.
- [ ] Navigation utility and role-filtered nav rendering.
- [ ] Breadcrumbs, BackButton, PageActions for deep/detail flows.
- [ ] Layout, CTA, state, mobile navigation guidelines.
- [ ] Final demo flow, README, manual QA, E2E/route smoke updates.
- [ ] Build verification.

### Add After Validation (v1.13/v1.14)

- [ ] Component documentation and visual regression coverage.
- [ ] Accessibility audit and keyboard/screen reader hardening.
- [ ] Full design token hardening and component consistency pass.

### Future Consideration (v2+)

- [ ] Data-router route handles for dynamic breadcrumbs if STOA migrates routing style.
- [ ] Product analytics for navigation usage and route drop-off once real user telemetry is available.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Page inventory and route map | HIGH | MEDIUM | P1 |
| Role navigation config | HIGH | MEDIUM | P1 |
| Entry/exit and orphan audit | HIGH | MEDIUM | P1 |
| Breadcrumbs/back/page actions | HIGH | LOW | P1 |
| CTA/layout/state guidelines | MEDIUM | LOW | P1 |
| Mobile nav rules | MEDIUM | MEDIUM | P2 |
| Final demo flow | HIGH | LOW | P1 |
| E2E/route smoke updates | MEDIUM | MEDIUM | P2 |
| Full data-router migration | LOW | HIGH | P3 |

## Competitor / Pattern Analysis

| Pattern | Observed Source | STOA Approach |
|---------|-----------------|---------------|
| Single source of truth for navigation | Atlassian described a shared navigation library and usage guidelines to reduce inconsistent navigation. | Use local typed route/nav config and docs; avoid adding a package. |
| Breadcrumbs for hierarchy | WAI-ARIA APG and USWDS define breadcrumbs as orientation for interior hierarchical pages. | Add Breadcrumbs to deep pages; omit from first-level pages. |
| Bottom nav limits | Material Design recommends bottom nav for a small set of top-level destinations. | Student/parent/tutor mobile nav should be intentionally short. |
| Consistent navigation/identification | WCAG 2.2 includes consistent navigation and consistent identification success criteria. | Keep nav order, labels, icons, and action meanings stable across role surfaces. |

## Sources

- React Router NavLink docs: https://reactrouter.com/api/components/NavLink
- React Router handle/useMatches docs: https://reactrouter.com/how-to/using-handle
- WAI-ARIA APG Breadcrumb Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
- WCAG 2.2 Recommendation: https://www.w3.org/TR/WCAG22/
- U.S. Web Design System Breadcrumb: https://designsystem.digital.gov/components/breadcrumb/
- Material Design Navigation Drawer: https://m2.material.io/components/navigation-drawer
- Material Design Bottom Navigation: https://m2.material.io/develop/flutter/components/bottom-navigation/
- Atlassian navigation redesign write-up: https://www.atlassian.com/blog/design/designing-atlassians-new-navigation
- Existing STOA code: `src/app/router/AppRouter.tsx`, `src/layouts/AppLayout.tsx`

---
*Feature research for: STOA Phase 13 frontend IA and UX optimization*
*Researched: 2026-05-25*
