# Requirements: STOA Frontend

**Defined:** 2026-05-25
**Milestone:** v1.12 Phase 13: Information Architecture, Page Flow, and UX Optimization
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, documented page structure, coherent demo flows, and frontend-only mock/API-contract support.

## v1.12 Requirements

Requirements for Phase 13. Each requirement maps to exactly one roadmap phase.

### Information Architecture

- [ ] **IA-01**: Team can review a complete `docs/ia/page-inventory.md` covering all current app routes and page components.
- [ ] **IA-02**: Each page inventory entry records route, page name, role, module, purpose, entry points, exit points, status, priority, and notes.
- [ ] **IA-03**: Page statuses include `core`, `demo`, `placeholder`, `duplicate`, `hidden`, and `deprecated` where applicable.
- [ ] **IA-04**: Page priorities include P0, P1, P2, and P3 with core user paths clearly marked.
- [ ] **IA-05**: Team can identify which pages belong to student, parent, tutor, admin, organization, public, billing, support, and demo/advanced surfaces.

### Route Map and Page Audits

- [ ] **ROUTE-01**: Team can review `docs/ia/route-map.md` with public, student, parent, tutor, admin, organization, and demo/advanced route groups.
- [ ] **ROUTE-02**: Public routes are classified as app-owned, marketing-site candidates, hidden, or required legal/support routes.
- [ ] **ROUTE-03**: Student advanced pages are classified as dashboard/report-linked surfaces rather than primary sidebar items.
- [ ] **ROUTE-04**: Parent report/history/monthly report overlap is documented with a merge or tab strategy.
- [ ] **ROUTE-05**: Admin usage/analytics and feedback/support overlap is documented with a consolidation or hiding strategy.
- [ ] **ROUTE-06**: Organization routes are classified as organization-mode/demo surfaces and checked against admin overlap.
- [ ] **AUDIT-01**: Team can review `docs/ia/page-entry-exit-audit.md` for required core and deep pages.
- [ ] **AUDIT-02**: Every audited page records where users enter, what the primary action is, where users go next, and whether a return path exists.
- [ ] **AUDIT-03**: Team can review `docs/ia/orphan-page-audit.md` listing orphan pages and treatment decisions.
- [ ] **AUDIT-04**: No core orphan page remains undocumented or without a planned entry point.
- [ ] **AUDIT-05**: Team can review `docs/ia/duplicate-page-audit.md` listing duplicate or overlapping routes and disposition decisions.

### Role-Based Navigation

- [ ] **NAV-01**: Team can review `docs/ia/navigation-architecture.md` defining student, parent, tutor, admin, and organization navigation.
- [ ] **NAV-02**: Student navigation prioritizes Dashboard, Chat, Learning History, and Profile.
- [ ] **NAV-03**: Parent navigation prioritizes Overview, Children, Reports, Billing, Referrals, and Support.
- [ ] **NAV-04**: Tutor navigation prioritizes Requests, Availability, History, and Support.
- [ ] **NAV-05**: Admin navigation is grouped and avoids overexposing retention, system, advanced analytics, and tutor assignment placeholders.
- [ ] **NAV-06**: Organization navigation is shown only in organization/demo mode and keeps tutor assignment subordinate to tutor management.
- [ ] **NAV-07**: `src/app/router/routeConfig.ts` defines typed nav items with role, priority, status, and route metadata.
- [ ] **NAV-08**: `src/app/router/routeGroups.ts` defines public, student, parent, tutor, admin, organization, and demo/advanced route groups.
- [ ] **NAV-09**: `src/lib/navigation.ts` can return navigation items by role, hide hidden/demo items by default, and identify active routes.
- [ ] **NAV-10**: App navigation renders from configuration rather than duplicating route labels in separate role-specific link lists.

### User Journeys and Page Flow

- [ ] **FLOW-01**: Team can review `docs/ia/user-journeys.md` for student, parent, tutor, admin, and organization primary journeys.
- [ ] **FLOW-02**: Student journey supports dashboard to chat, chat to dashboard/history, and teacher-help status visibility.
- [ ] **FLOW-03**: Parent journey supports overview to child detail/report, then pricing/billing/support without exposing student chat as a parent path.
- [ ] **FLOW-04**: Tutor journey supports request list to request detail, status update, note entry, and return to requests.
- [ ] **FLOW-05**: Admin journey supports overview to analytics/support/help-request surfaces without turning overview into a dense route directory.
- [ ] **FLOW-06**: Organization journey supports overview to students/tutors/reports/analytics and back to organization overview.
- [ ] **FLOW-07**: Deep pages that can become dead ends receive breadcrumb, back button, primary CTA, related link, or return-to-dashboard handling.

### Breadcrumbs, Back Buttons, and Page Actions

- [ ] **UX-01**: `src/components/common/Breadcrumbs.tsx` provides a reusable breadcrumb component for second-level and deeper pages.
- [ ] **UX-02**: `src/components/common/BackButton.tsx` provides consistent back navigation for detail pages.
- [ ] **UX-03**: `src/components/common/PageActions.tsx` provides a consistent page action grouping for primary, secondary, tertiary, and danger actions.
- [ ] **UX-04**: Parent child/detail/report pages can show breadcrumb or back navigation.
- [ ] **UX-05**: Tutor request detail can return to the request list.
- [ ] **UX-06**: Organization student learning-profile and student learning intelligence pages can return to their parent context.

### Layout and CTA Standards

- [ ] **LAYOUT-01**: Team can review `docs/ux/layout-guidelines.md` defining DashboardLayout, DetailLayout, FormLayout, SplitLayout, and MarketingLayout usage.
- [ ] **LAYOUT-02**: Existing page primitives are used consistently for page container, page header, section header, state, badge, and role markers.
- [ ] **LAYOUT-03**: Pages have a clear h1 title, optional description, and primary action where applicable.
- [ ] **CTA-01**: Team can review `docs/ux/cta-guidelines.md` defining primary, secondary, tertiary, and danger action hierarchy.
- [ ] **CTA-02**: Student dashboard, parent report, tutor request detail, billing, support, and admin overview surfaces have clear primary and secondary actions.
- [ ] **STATE-01**: Empty, loading, error, and success state usage is documented and checked against major role flows.
- [ ] **STATE-02**: Placeholder/demo pages are clearly marked and do not imply production-ready backend, AI, payment, or organization functionality.

### Mobile Navigation and Responsive Flow

- [ ] **MOBILE-01**: Team can review `docs/ux/mobile-navigation.md` defining mobile navigation expectations for student, parent, tutor, admin, and organization surfaces.
- [ ] **MOBILE-02**: Student mobile navigation emphasizes Dashboard, Chat, and Profile.
- [ ] **MOBILE-03**: Parent mobile navigation emphasizes Overview, Reports, and Billing.
- [ ] **MOBILE-04**: Tutor mobile navigation emphasizes Requests and Availability.
- [ ] **MOBILE-05**: Admin and organization mobile experiences degrade to scan-friendly cards/lists where full desktop navigation is too dense.
- [ ] **MOBILE-06**: Mobile QA covers chat, dashboard, parent overview/report, tutor list/detail, pricing, and billing.

### Demo Flow and Documentation

- [ ] **DEMO-01**: Team can review `docs/demo/final-demo-flow.md` with a complete demo path that does not depend on manual URL entry.
- [ ] **DEMO-02**: Demo flow covers landing/parents, pricing, student dashboard/chat/upload/teacher request, tutor resolution, parent report/billing, and admin analytics.
- [ ] **DEMO-03**: Demo flow avoids complex placeholder pages and documents demo account/data expectations.
- [ ] **DOC-01**: README documents Phase 13 scope, route/page organization goals, navigation refactor, UX guidelines, demo flow, and build verification.
- [ ] **DOC-02**: Manual QA checklist is updated with Phase 13 IA, navigation, flow, mobile, orphan/duplicate, breadcrumb/back, demo, and build checks.
- [ ] **DOC-03**: E2E or route-smoke documentation is updated for the core Phase 13 paths.

### Verification

- [ ] **QA-01**: `npm install` or the existing installed dependency state is verified for the milestone.
- [ ] **QA-02**: `npm run dev` can start the frontend on the expected local dev server.
- [ ] **QA-03**: `npm run build` passes after Phase 13 changes.
- [ ] **QA-04**: Main student, parent, tutor, admin, and demo paths are manually QA'd or covered by route smoke/E2E checks.
- [ ] **QA-05**: Phase 13 closes with a clear commit history and no committed `node_modules/`, `dist/`, local env files, or unrelated generated artifacts.

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Design System Hardening

- **DS-01**: Team can review component documentation for Button, Card, Form, Table, Badge, layout primitives, and shared state components.
- **DS-02**: Team can review a consolidated token system for colors, typography, spacing, borders, shadows, and motion.
- **DS-03**: App has accessibility audit coverage for keyboard navigation, screen reader labels, focus states, and color contrast.
- **DS-04**: App has visual regression or screenshot comparison coverage for major route surfaces.

## Out of Scope

Explicitly excluded from v1.12 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| New large product modules | Phase 13 is an organization and UX optimization milestone, not a feature expansion milestone. |
| Formal backend implementation | This repository remains frontend-only for Phase 13; backend behavior stays behind existing APIs/contracts/demo data. |
| Complex database work | Page IA and navigation cleanup do not require persistence changes. |
| New AI features or AI provider integration | Learning intelligence remains existing frontend demo UI; provider integration belongs behind backend APIs. |
| New payment features | Billing/pricing paths may be reorganized, but payment implementation remains out of scope. |
| New admin backend | Admin pages can be grouped or hidden, but backend admin capabilities are not implemented here. |
| Production infrastructure | Phase 13 verifies local/frontend build and route flows only. |
| Full visual redesign | Phase 13 can polish layout consistency, but does not redesign the entire STOA brand or component system. |
| Large-scale component library rewrite | Reuse existing primitives and add only narrow helpers needed for navigation and page flow. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| IA-01 | TBD | Pending |
| IA-02 | TBD | Pending |
| IA-03 | TBD | Pending |
| IA-04 | TBD | Pending |
| IA-05 | TBD | Pending |
| ROUTE-01 | TBD | Pending |
| ROUTE-02 | TBD | Pending |
| ROUTE-03 | TBD | Pending |
| ROUTE-04 | TBD | Pending |
| ROUTE-05 | TBD | Pending |
| ROUTE-06 | TBD | Pending |
| AUDIT-01 | TBD | Pending |
| AUDIT-02 | TBD | Pending |
| AUDIT-03 | TBD | Pending |
| AUDIT-04 | TBD | Pending |
| AUDIT-05 | TBD | Pending |
| NAV-01 | TBD | Pending |
| NAV-02 | TBD | Pending |
| NAV-03 | TBD | Pending |
| NAV-04 | TBD | Pending |
| NAV-05 | TBD | Pending |
| NAV-06 | TBD | Pending |
| NAV-07 | TBD | Pending |
| NAV-08 | TBD | Pending |
| NAV-09 | TBD | Pending |
| NAV-10 | TBD | Pending |
| FLOW-01 | TBD | Pending |
| FLOW-02 | TBD | Pending |
| FLOW-03 | TBD | Pending |
| FLOW-04 | TBD | Pending |
| FLOW-05 | TBD | Pending |
| FLOW-06 | TBD | Pending |
| FLOW-07 | TBD | Pending |
| UX-01 | TBD | Pending |
| UX-02 | TBD | Pending |
| UX-03 | TBD | Pending |
| UX-04 | TBD | Pending |
| UX-05 | TBD | Pending |
| UX-06 | TBD | Pending |
| LAYOUT-01 | TBD | Pending |
| LAYOUT-02 | TBD | Pending |
| LAYOUT-03 | TBD | Pending |
| CTA-01 | TBD | Pending |
| CTA-02 | TBD | Pending |
| STATE-01 | TBD | Pending |
| STATE-02 | TBD | Pending |
| MOBILE-01 | TBD | Pending |
| MOBILE-02 | TBD | Pending |
| MOBILE-03 | TBD | Pending |
| MOBILE-04 | TBD | Pending |
| MOBILE-05 | TBD | Pending |
| MOBILE-06 | TBD | Pending |
| DEMO-01 | TBD | Pending |
| DEMO-02 | TBD | Pending |
| DEMO-03 | TBD | Pending |
| DOC-01 | TBD | Pending |
| DOC-02 | TBD | Pending |
| DOC-03 | TBD | Pending |
| QA-01 | TBD | Pending |
| QA-02 | TBD | Pending |
| QA-03 | TBD | Pending |
| QA-04 | TBD | Pending |
| QA-05 | TBD | Pending |

**Coverage:**
- v1.12 requirements: 62 total
- Mapped to phases: 0
- Unmapped: 62

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after v1.12 requirements definition*
