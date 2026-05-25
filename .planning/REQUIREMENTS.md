# Requirements: STOA Frontend

**Defined:** 2026-05-25
**Milestone:** v1.12 Phase 13: Information Architecture, Page Flow, and UX Optimization
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, documented page structure, coherent demo flows, and frontend-only mock/API-contract support.

## v1.12 Requirements

Requirements for Phase 13. Each requirement maps to exactly one roadmap phase.

### Information Architecture

- [x] **IA-01**: Team can review a complete `docs/ia/page-inventory.md` covering all current app routes and page components.
- [x] **IA-02**: Each page inventory entry records route, page name, role, module, purpose, entry points, exit points, status, priority, and notes.
- [x] **IA-03**: Page statuses include `core`, `demo`, `placeholder`, `duplicate`, `hidden`, and `deprecated` where applicable.
- [x] **IA-04**: Page priorities include P0, P1, P2, and P3 with core user paths clearly marked.
- [x] **IA-05**: Team can identify which pages belong to student, parent, tutor, admin, organization, public, billing, support, and demo/advanced surfaces.

### Route Map and Page Audits

- [x] **ROUTE-01**: Team can review `docs/ia/route-map.md` with public, student, parent, tutor, admin, organization, and demo/advanced route groups.
- [x] **ROUTE-02**: Public routes are classified as app-owned, marketing-site candidates, hidden, or required legal/support routes.
- [x] **ROUTE-03**: Student advanced pages are classified as dashboard/report-linked surfaces rather than primary sidebar items.
- [x] **ROUTE-04**: Parent report/history/monthly report overlap is documented with a merge or tab strategy.
- [x] **ROUTE-05**: Admin usage/analytics and feedback/support overlap is documented with a consolidation or hiding strategy.
- [x] **ROUTE-06**: Organization routes are classified as organization-mode/demo surfaces and checked against admin overlap.
- [x] **AUDIT-01**: Team can review `docs/ia/page-entry-exit-audit.md` for required core and deep pages.
- [x] **AUDIT-02**: Every audited page records where users enter, what the primary action is, where users go next, and whether a return path exists.
- [x] **AUDIT-03**: Team can review `docs/ia/orphan-page-audit.md` listing orphan pages and treatment decisions.
- [x] **AUDIT-04**: No core orphan page remains undocumented or without a planned entry point.
- [x] **AUDIT-05**: Team can review `docs/ia/duplicate-page-audit.md` listing duplicate or overlapping routes and disposition decisions.

### Role-Based Navigation

- [x] **NAV-01**: Team can review `docs/ia/navigation-architecture.md` defining student, parent, tutor, admin, and organization navigation.
- [x] **NAV-02**: Student navigation prioritizes Dashboard, Chat, Learning History, and Profile.
- [x] **NAV-03**: Parent navigation prioritizes Overview, Children, Reports, Billing, Referrals, and Support.
- [x] **NAV-04**: Tutor navigation prioritizes Requests, Availability, History, and Support.
- [x] **NAV-05**: Admin navigation is grouped and avoids overexposing retention, system, advanced analytics, and tutor assignment placeholders.
- [x] **NAV-06**: Organization navigation is shown only in organization/demo mode and keeps tutor assignment subordinate to tutor management.
- [x] **NAV-07**: `src/app/router/routeConfig.ts` defines typed nav items with role, priority, status, and route metadata.
- [x] **NAV-08**: `src/app/router/routeGroups.ts` defines public, student, parent, tutor, admin, organization, and demo/advanced route groups.
- [x] **NAV-09**: `src/lib/navigation.ts` can return navigation items by role, hide hidden/demo items by default, and identify active routes.
- [x] **NAV-10**: App navigation renders from configuration rather than duplicating route labels in separate role-specific link lists.

### User Journeys and Page Flow

- [x] **FLOW-01**: Team can review `docs/ia/user-journeys.md` for student, parent, tutor, admin, and organization primary journeys.
- [x] **FLOW-02**: Student journey supports dashboard to chat, chat to dashboard/history, and teacher-help status visibility.
- [x] **FLOW-03**: Parent journey supports overview to child detail/report, then pricing/billing/support without exposing student chat as a parent path.
- [x] **FLOW-04**: Tutor journey supports request list to request detail, status update, note entry, and return to requests.
- [x] **FLOW-05**: Admin journey supports overview to analytics/support/help-request surfaces without turning overview into a dense route directory.
- [x] **FLOW-06**: Organization journey supports overview to students/tutors/reports/analytics and back to organization overview.
- [x] **FLOW-07**: Deep pages that can become dead ends receive breadcrumb, back button, primary CTA, related link, or return-to-dashboard handling.

### Breadcrumbs, Back Buttons, and Page Actions

- [x] **UX-01**: `src/components/common/Breadcrumbs.tsx` provides a reusable breadcrumb component for second-level and deeper pages.
- [x] **UX-02**: `src/components/common/BackButton.tsx` provides consistent back navigation for detail pages.
- [x] **UX-03**: `src/components/common/PageActions.tsx` provides a consistent page action grouping for primary, secondary, tertiary, and danger actions.
- [x] **UX-04**: Parent child/detail/report pages can show breadcrumb or back navigation.
- [x] **UX-05**: Tutor request detail can return to the request list.
- [x] **UX-06**: Organization student learning-profile and student learning intelligence pages can return to their parent context.

### Layout and CTA Standards

- [x] **LAYOUT-01**: Team can review `docs/ux/layout-guidelines.md` defining DashboardLayout, DetailLayout, FormLayout, SplitLayout, and MarketingLayout usage.
- [x] **LAYOUT-02**: Existing page primitives are used consistently for page container, page header, section header, state, badge, and role markers.
- [x] **LAYOUT-03**: Pages have a clear h1 title, optional description, and primary action where applicable.
- [x] **CTA-01**: Team can review `docs/ux/cta-guidelines.md` defining primary, secondary, tertiary, and danger action hierarchy.
- [x] **CTA-02**: Student dashboard, parent report, tutor request detail, billing, support, and admin overview surfaces have clear primary and secondary actions.
- [x] **STATE-01**: Empty, loading, error, and success state usage is documented and checked against major role flows.
- [x] **STATE-02**: Placeholder/demo pages are clearly marked and do not imply production-ready backend, AI, payment, or organization functionality.

### Mobile Navigation and Responsive Flow

- [x] **MOBILE-01**: Team can review `docs/ux/mobile-navigation.md` defining mobile navigation expectations for student, parent, tutor, admin, and organization surfaces.
- [x] **MOBILE-02**: Student mobile navigation emphasizes Dashboard, Chat, and Profile.
- [x] **MOBILE-03**: Parent mobile navigation emphasizes Overview, Reports, and Billing.
- [x] **MOBILE-04**: Tutor mobile navigation emphasizes Requests and Availability.
- [x] **MOBILE-05**: Admin and organization mobile experiences degrade to scan-friendly cards/lists where full desktop navigation is too dense.
- [x] **MOBILE-06**: Mobile QA covers chat, dashboard, parent overview/report, tutor list/detail, pricing, and billing.

### Demo Flow and Documentation

- [x] **DEMO-01**: Team can review `docs/demo/final-demo-flow.md` with a complete demo path that does not depend on manual URL entry.
- [x] **DEMO-02**: Demo flow covers landing/parents, pricing, student dashboard/chat/upload/teacher request, tutor resolution, parent report/billing, and admin analytics.
- [x] **DEMO-03**: Demo flow avoids complex placeholder pages and documents demo account/data expectations.
- [x] **DOC-01**: README documents Phase 13 scope, route/page organization goals, navigation refactor, UX guidelines, demo flow, and build verification.
- [x] **DOC-02**: Manual QA checklist is updated with Phase 13 IA, navigation, flow, mobile, orphan/duplicate, breadcrumb/back, demo, and build checks.
- [x] **DOC-03**: E2E or route-smoke documentation is updated for the core Phase 13 paths.

### Verification

- [x] **QA-01**: `npm install` or the existing installed dependency state is verified for the milestone.
- [x] **QA-02**: `npm run dev` can start the frontend on the expected local dev server.
- [x] **QA-03**: `npm run build` passes after Phase 13 changes.
- [x] **QA-04**: Main student, parent, tutor, admin, and demo paths are manually QA'd or covered by route smoke/E2E checks.
- [x] **QA-05**: Phase 13 closes with a clear commit history and no committed `node_modules/`, `dist/`, local env files, or unrelated generated artifacts.

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
| IA-01 | Phase 73 | Complete |
| IA-02 | Phase 73 | Complete |
| IA-03 | Phase 73 | Complete |
| IA-04 | Phase 73 | Complete |
| IA-05 | Phase 73 | Complete |
| ROUTE-01 | Phase 73 | Complete |
| ROUTE-02 | Phase 73 | Complete |
| ROUTE-03 | Phase 73 | Complete |
| ROUTE-04 | Phase 73 | Complete |
| ROUTE-05 | Phase 73 | Complete |
| ROUTE-06 | Phase 73 | Complete |
| AUDIT-01 | Phase 73 | Complete |
| AUDIT-02 | Phase 73 | Complete |
| AUDIT-03 | Phase 73 | Complete |
| AUDIT-04 | Phase 73 | Complete |
| AUDIT-05 | Phase 73 | Complete |
| NAV-01 | Phase 74 | Complete |
| NAV-02 | Phase 74 | Complete |
| NAV-03 | Phase 74 | Complete |
| NAV-04 | Phase 74 | Complete |
| NAV-05 | Phase 74 | Complete |
| NAV-06 | Phase 74 | Complete |
| NAV-07 | Phase 74 | Complete |
| NAV-08 | Phase 74 | Complete |
| NAV-09 | Phase 74 | Complete |
| NAV-10 | Phase 74 | Complete |
| FLOW-01 | Phase 75 | Complete |
| FLOW-02 | Phase 75 | Complete |
| FLOW-03 | Phase 75 | Complete |
| FLOW-04 | Phase 75 | Complete |
| FLOW-05 | Phase 75 | Complete |
| FLOW-06 | Phase 75 | Complete |
| FLOW-07 | Phase 75 | Complete |
| UX-01 | Phase 75 | Complete |
| UX-02 | Phase 75 | Complete |
| UX-03 | Phase 75 | Complete |
| UX-04 | Phase 75 | Complete |
| UX-05 | Phase 75 | Complete |
| UX-06 | Phase 75 | Complete |
| LAYOUT-01 | Phase 76 | Complete |
| LAYOUT-02 | Phase 76 | Complete |
| LAYOUT-03 | Phase 76 | Complete |
| CTA-01 | Phase 76 | Complete |
| CTA-02 | Phase 76 | Complete |
| STATE-01 | Phase 76 | Complete |
| STATE-02 | Phase 76 | Complete |
| MOBILE-01 | Phase 77 | Complete |
| MOBILE-02 | Phase 77 | Complete |
| MOBILE-03 | Phase 77 | Complete |
| MOBILE-04 | Phase 77 | Complete |
| MOBILE-05 | Phase 77 | Complete |
| MOBILE-06 | Phase 77 | Complete |
| DEMO-01 | Phase 78 | Complete |
| DEMO-02 | Phase 78 | Complete |
| DEMO-03 | Phase 78 | Complete |
| DOC-01 | Phase 78 | Complete |
| DOC-02 | Phase 78 | Complete |
| DOC-03 | Phase 78 | Complete |
| QA-01 | Phase 79 | Complete |
| QA-02 | Phase 79 | Complete |
| QA-03 | Phase 79 | Complete |
| QA-04 | Phase 79 | Complete |
| QA-05 | Phase 79 | Complete |

**Coverage:**
- v1.12 requirements: 63 total
- Mapped to phases: 63
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after Phase 13 verification*
