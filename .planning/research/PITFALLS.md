# Pitfalls Research

**Domain:** Frontend information architecture, navigation, and UX optimization
**Researched:** 2026-05-25
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Treating Navigation Cleanup as a Feature Expansion

**What goes wrong:**
The milestone adds more routes, demos, and visual ideas instead of reducing confusion.

**Why it happens:**
While auditing pages, teams notice missing capabilities and start filling them in.

**How to avoid:**
Keep Phase 13 acceptance tied to inventory, route grouping, navigation, entry/exit, layout, mobile, docs, and verification. Move new product ideas to future requirements.

**Warning signs:**
New service types, new API contracts, new major pages, or new backend assumptions appear in Phase 13 plans.

**Phase to address:**
Phase 73 and every later phase.

---

### Pitfall 2: Static IA Docs That Drift from Code

**What goes wrong:**
Page inventory and route map are accurate once, then become stale as navigation changes.

**Why it happens:**
Docs are written separately from route/nav config.

**How to avoid:**
Create `routeConfig.ts`, `routeGroups.ts`, and `navigation.ts` from the inventory decisions, and make the docs reference those concepts.

**Warning signs:**
Docs say a page is hidden while `AppLayout` still links it, or a route exists in `AppRouter` but not inventory.

**Phase to address:**
Phase 73 and Phase 74.

---

### Pitfall 3: Hiding Core Pages While Reducing Navigation

**What goes wrong:**
The sidebar becomes simpler but core pages lose visible entry points.

**Why it happens:**
Teams remove links before mapping contextual cards, CTAs, and page exits.

**How to avoid:**
For every hidden or secondary route, document where it is reached from and how the user returns.

**Warning signs:**
Core pages become accessible only by typing a URL, or Playwright/manual QA requires direct navigation to start a flow.

**Phase to address:**
Phase 73, Phase 74, Phase 75.

---

### Pitfall 4: Breadcrumbs Without Accessible Semantics

**What goes wrong:**
Breadcrumbs look correct visually but are not announced as navigation or do not identify the current page.

**Why it happens:**
Breadcrumbs are implemented as generic flex rows instead of semantic navigation.

**How to avoid:**
Use `nav aria-label`, ordered lists, list items, and `aria-current="page"` semantics. This aligns with WAI-ARIA APG and USWDS guidance.

**Warning signs:**
Breadcrumb component returns only `div`/`span` wrappers, or separators are read as content.

**Phase to address:**
Phase 75.

---

### Pitfall 5: Mobile Navigation Mirrors Desktop Navigation

**What goes wrong:**
Mobile nav becomes too long, hides the chat input, or pushes users through too many layers.

**Why it happens:**
Teams compress the desktop sidebar instead of choosing mobile role priorities.

**How to avoid:**
Define mobile role subsets: student Dashboard/Chat/Profile, parent Overview/Reports/Billing, tutor Requests/Availability, and admin/org degraded list/card access.

**Warning signs:**
More than five mobile primary destinations, horizontal scrolling nav items, or bottom nav covering chat/support inputs.

**Phase to address:**
Phase 77.

---

### Pitfall 6: Inconsistent CTA Labels and Action Weight

**What goes wrong:**
Different pages use different labels for the same action, or too many primary buttons compete.

**Why it happens:**
CTA decisions are made page-by-page without a hierarchy.

**How to avoid:**
Document primary, secondary, tertiary, and danger action rules and apply them to the main student, parent, tutor, billing, support, and admin surfaces.

**Warning signs:**
Multiple primary buttons in the same header, "View" and "Open" used inconsistently, or destructive actions styled like normal links.

**Phase to address:**
Phase 76.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keeping route labels in `AppLayout` | Fast to edit | Drift from docs and route map | Not acceptable after Phase 74. |
| Inferring page status from path prefix | Low documentation work | Demo/placeholder pages leak into core UX | Never for Phase 13. |
| Adding breadcrumbs manually per page with ad hoc markup | Quick visual result | Inconsistent semantics and labels | Only as a temporary spike before shared component. |
| Updating docs without route smoke checks | Saves time | Demo flow can break silently | Not acceptable for final Phase 13 closure. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recomputing large nav structures in render | Unnecessary rerenders | Keep nav config static and filtering pure/simple | Low risk, but avoid now. |
| Rendering all desktop nav on mobile | Clutter and input overlap | Mobile-specific role subsets or drawer | Breaks immediately on chat/report pages. |
| Adding route-level lazy architecture mid-cleanup | Build complexity | Defer code splitting changes unless already needed | Breaks planning scope. |

## Security / Trust Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Presenting demo AI diagnosis as real | Misleads parents/students | Keep demo/placeholder labels and learning-intelligence boundary. |
| Presenting virtual billing as real payment | Payment trust issue | Keep virtual/mock checkout language. |
| Treating frontend route guards as authorization | Data leakage if backend trusts UI | Preserve backend-owned authorization guidance. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Overloaded admin sidebar | Operators cannot find high-frequency tasks | Group/hide advanced pages and keep support/help/analytics discoverable. |
| Parent route leakage into student chat | Parents get sent to the wrong task model | Parent flows should lead to child reports, billing, and support. |
| Advanced learning pages in student primary nav | Students see analytics instead of learning action | Link advanced pages from dashboard/report context only. |
| Dead-end detail pages | Users finish a task and do not know where to go | Add back, breadcrumb, primary CTA, or related links. |
| Placeholder pages styled as complete | Users overestimate product readiness | Mark as Coming soon, Demo preview, or hidden. |

## "Looks Done But Isn't" Checklist

- [ ] **Page inventory:** Often misses protected checkout/result routes, legal routes, and admin placeholders - verify against `AppRouter.tsx`.
- [ ] **Navigation cleanup:** Often hides routes without adding card/CTA entry points - verify entry/exit audit.
- [ ] **Breadcrumbs:** Often visual only - verify `nav`, `ol`, `li`, and `aria-current`.
- [ ] **Mobile nav:** Often passes desktop width only - verify `/chat`, `/parent`, `/parent/children/:childId/report`, `/tutor`, `/tutor/requests/:requestId`, `/pricing`, `/billing`.
- [ ] **Demo flow:** Often still uses direct URLs - verify every step is reachable from visible UI.
- [ ] **Docs:** Often mention desired final structure but not actual route names - verify route map and README use concrete paths.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Stale docs | MEDIUM | Regenerate route inventory from `AppRouter`, update docs, then update route config. |
| Hidden core page | LOW | Add contextual CTA/card or restore primary nav item. |
| Breadcrumb semantic miss | LOW | Replace markup with shared Breadcrumbs component. |
| Mobile nav overload | MEDIUM | Split desktop and mobile item sets by role priority. |
| Demo route dead end | MEDIUM | Add link/button from previous demo step and update `final-demo-flow.md`. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Feature expansion drift | Phase 73 | Requirements and docs show no new large feature modules. |
| Static docs drift | Phase 74 | Route config/nav utility matches IA docs. |
| Hidden core pages | Phase 75 | Entry/exit audit and flow checks pass. |
| Inaccessible breadcrumbs | Phase 75 | Component semantics match WAI-ARIA/APG guidance. |
| Mobile desktop mirroring | Phase 77 | Mobile QA checklist covers high-risk pages. |
| CTA inconsistency | Phase 76 | CTA guidelines and key page checks exist. |

## Sources

- WAI-ARIA APG Breadcrumb Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
- WCAG 2.2 Recommendation: https://www.w3.org/TR/WCAG22/
- U.S. Web Design System Breadcrumb: https://designsystem.digital.gov/components/breadcrumb/
- Material Design Navigation Drawer: https://m2.material.io/components/navigation-drawer
- Material Design Bottom Navigation: https://m2.material.io/develop/flutter/components/bottom-navigation/
- Atlassian navigation redesign write-up: https://www.atlassian.com/blog/design/designing-atlassians-new-navigation
- Existing STOA code: `src/app/router/AppRouter.tsx`, `src/layouts/AppLayout.tsx`

---
*Pitfalls research for: STOA Phase 13 frontend IA and UX optimization*
*Researched: 2026-05-25*
