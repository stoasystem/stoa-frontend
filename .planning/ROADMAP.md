# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.0 Frontend Foundation** - Phases 1-3 (shipped 2026-05-24)
- ✅ **v1.1 Frontend Development Foundation** - Phases 4-7 (shipped 2026-05-24)
- ✅ **v1.2 Core Product UI** - Phases 8-10 (shipped 2026-05-24)
- ✅ **v1.3 Phase 4 Backend Integration and Real Chat API** - Phases 11-14 (shipped 2026-05-24)
- ✅ **v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow** - Phases 15-20 (implemented 2026-05-24)
- ✅ **v1.5 Phase 6 Authentication, User Roles, and Parent Visibility** - Phases 21-27 (implemented 2026-05-24)
- ✅ **v1.6 Phase 7 Product Polishing, Analytics, and MVP Readiness** - Phases 28-34 (implemented 2026-05-25)
- ✅ **v1.7 Phase 8 Staging Deployment, QA, and Early User Testing** - Phases 35-40 (implemented 2026-05-25)
- ✅ **v1.8 Phase 9 Production Readiness, Monitoring, and Pilot Launch** - Phases 41-47 (implemented 2026-05-25)
- ✅ **v1.9 Phase 10: Pilot Iteration, Payment Preparation, and Production Launch** - Phases 48-55 (implemented 2026-05-25)
- ✅ **v1.10 Phase 11: Paid Launch Frontend, Growth Funnel, and Operational UI Scaling** - Phases 56-63 (implemented 2026-05-25)
- ✅ **v1.11 Phase 12: Frontend Platform Scaling, School Partnership UI, and Advanced Learning Intelligence Design** - Phases 64-72 (implemented 2026-05-25)
- 🚧 **v1.12 Phase 13: Information Architecture, Page Flow, and UX Optimization** - Phases 73-79 (planned)

## Phases

<details open>
<summary>🚧 v1.12 Phase 13: Information Architecture, Page Flow, and UX Optimization (Phases 73-79)</summary>

**Milestone Goal:** Organize the existing STOA frontend into a clear, role-based, maintainable product structure by documenting all pages/routes, clarifying navigation and user journeys, reducing orphan/duplicate/placeholder exposure, standardizing layout and CTA patterns, and polishing core flows without adding new product modules.

- [ ] **Phase 73: Page Inventory, Route Map, and IA Audits** - Document every current page/route, classify role/status/priority, and record orphan/duplicate/entry-exit decisions.
- [ ] **Phase 74: Route Groups, Navigation Config, and Role-Based Navigation** - Add typed route/nav configuration and refactor navigation generation for student, parent, tutor, admin, and organization modes.
- [ ] **Phase 75: User Journeys, Breadcrumbs, Back Buttons, and Page Flow Helpers** - Document core journeys and add reusable navigation helpers so deep pages have clear return/next paths.
- [ ] **Phase 76: Layout Standards, CTA Hierarchy, and Page State Guidelines** - Standardize page layout expectations, CTA hierarchy, placeholder/demo policy, and shared page-state usage.
- [ ] **Phase 77: Mobile Navigation and Responsive Flow Optimization** - Define and implement mobile navigation expectations for the major role flows and high-risk pages.
- [ ] **Phase 78: Final Demo Flow, README, Manual QA, and E2E Path Updates** - Produce the final demo flow and update docs, README, manual QA, and route smoke/E2E coverage.
- [ ] **Phase 79: Phase 13 Verification and Build Closure** - Verify install/dev/build, run manual or automated flow checks, close traceability, and prepare the milestone for execution handoff.

### Phase 73: Page Inventory, Route Map, and IA Audits

**Goal**: Make the full frontend surface understandable before changing navigation.
**Depends on**: Phase 72
**Requirements**: [IA-01, IA-02, IA-03, IA-04, IA-05, ROUTE-01, ROUTE-02, ROUTE-03, ROUTE-04, ROUTE-05, ROUTE-06, AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04, AUDIT-05]
**Success Criteria** (what must be TRUE):
  1. `docs/ia/page-inventory.md` lists all current routes and page components with role, module, purpose, entry/exit, status, priority, and notes.
  2. `docs/ia/route-map.md` groups public, student, parent, tutor, admin, organization, and demo/advanced routes and records hiding/ownership decisions.
  3. Entry/exit, orphan-page, and duplicate/overlap audit docs exist and record treatment decisions.
  4. No core route is left unclassified or undocumented.
**Plans**: 0/1

### Phase 74: Route Groups, Navigation Config, and Role-Based Navigation

**Goal**: Move navigation decisions into typed configuration and make role navigation easier to maintain.
**Depends on**: Phase 73
**Requirements**: [NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06, NAV-07, NAV-08, NAV-09, NAV-10]
**Success Criteria** (what must be TRUE):
  1. `docs/ia/navigation-architecture.md` defines student, parent, tutor, admin, and organization navigation structures.
  2. `src/app/router/routeConfig.ts` and `src/app/router/routeGroups.ts` define route/nav metadata and grouped route lists.
  3. `src/lib/navigation.ts` returns role-filtered nav items, hides hidden/demo entries by default, and detects active routes.
  4. App navigation renders from shared configuration and does not overexpose advanced/demo/placeholder pages in core role navigation.
**Plans**: 0/1

### Phase 75: User Journeys, Breadcrumbs, Back Buttons, and Page Flow Helpers

**Goal**: Remove dead ends and make primary journeys obvious for each role.
**Depends on**: Phase 74
**Requirements**: [FLOW-01, FLOW-02, FLOW-03, FLOW-04, FLOW-05, FLOW-06, FLOW-07, UX-01, UX-02, UX-03, UX-04, UX-05, UX-06]
**Success Criteria** (what must be TRUE):
  1. `docs/ia/user-journeys.md` documents student, parent, tutor, admin, and organization primary journeys.
  2. Breadcrumbs, BackButton, and PageActions shared components exist and match existing component conventions.
  3. Required deep parent, tutor, organization, and learning-intelligence pages have clear return or next-step handling.
  4. Core flow checks confirm users can move from dashboard/list pages into detail pages and back without manual URL entry.
**Plans**: 0/1

### Phase 76: Layout Standards, CTA Hierarchy, and Page State Guidelines

**Goal**: Make page structure and actions consistent across the accumulated feature surfaces.
**Depends on**: Phase 75
**Requirements**: [LAYOUT-01, LAYOUT-02, LAYOUT-03, CTA-01, CTA-02, STATE-01, STATE-02]
**Success Criteria** (what must be TRUE):
  1. `docs/ux/layout-guidelines.md` defines DashboardLayout, DetailLayout, FormLayout, SplitLayout, and MarketingLayout usage.
  2. `docs/ux/cta-guidelines.md` defines primary, secondary, tertiary, and danger action hierarchy with STOA examples.
  3. Major student, parent, tutor, billing, support, and admin surfaces have clear page titles, descriptions, primary actions, and state handling expectations.
  4. Placeholder and demo pages are visibly marked and excluded from core navigation where appropriate.
**Plans**: 0/1

### Phase 77: Mobile Navigation and Responsive Flow Optimization

**Goal**: Keep role flows usable on mobile after route and navigation cleanup.
**Depends on**: Phase 76
**Requirements**: [MOBILE-01, MOBILE-02, MOBILE-03, MOBILE-04, MOBILE-05, MOBILE-06]
**Success Criteria** (what must be TRUE):
  1. `docs/ux/mobile-navigation.md` defines mobile navigation expectations by role.
  2. Student mobile paths prioritize Dashboard, Chat, and Profile.
  3. Parent and tutor mobile paths prioritize their key overview/report/request/availability tasks.
  4. Admin and organization mobile surfaces degrade to scannable lists/cards where desktop navigation is too dense.
**Plans**: 0/1

### Phase 78: Final Demo Flow, README, Manual QA, and E2E Path Updates

**Goal**: Make the product demo and verification paths executable without manual route guessing.
**Depends on**: Phase 77
**Requirements**: [DEMO-01, DEMO-02, DEMO-03, DOC-01, DOC-02, DOC-03]
**Success Criteria** (what must be TRUE):
  1. `docs/demo/final-demo-flow.md` documents the recommended end-to-end demo path and demo data/account expectations.
  2. README includes Phase 13 purpose, non-expansion principle, IA docs, navigation cleanup, UX standards, and verification notes.
  3. Manual QA checklist includes IA, navigation, entry/exit, orphan/duplicate, breadcrumb/back, mobile, demo, and build checks.
  4. E2E or route-smoke documentation/code reflects the final core role and demo paths.
**Plans**: 0/1

### Phase 79: Phase 13 Verification and Build Closure

**Goal**: Close the milestone with verified commands and traceability evidence.
**Depends on**: Phase 78
**Requirements**: [QA-01, QA-02, QA-03, QA-04, QA-05]
**Success Criteria** (what must be TRUE):
  1. Dependency/install state is verified or documented.
  2. `npm run dev` can start the frontend locally.
  3. `npm run build` passes.
  4. Main student, parent, tutor, admin, organization, billing/support, and demo paths are manually QA'd or covered by smoke/E2E checks.
  5. Phase 13 closes with clean planning traceability and no unrelated generated artifacts committed.
**Plans**: 0/1

</details>

<details>
<summary>✅ Previous shipped milestones (Phases 1-72)</summary>

Phases 1-72 shipped the STOA frontend foundation, product UI, backend chat integration, streaming/file uploads, authenticated roles, parent/tutor/admin MVP flows, staging/QA, production/pilot readiness, pricing validation, virtual checkout, launch-ready legal drafts, paid launch frontend, parent acquisition, referrals, tutor availability, support tickets, admin analytics, UTM tracking, platform/organization demos, learning-intelligence demos, curriculum graph UI, weak-point diagnosis UI, monthly parent report, retention UI, partnership onboarding, and Phase 12 verification.

See `.planning/MILESTONES.md` and archived milestone audit files for detailed shipped scope and verification evidence.

</details>

## Progress

**Execution Order:**
Phases execute in numeric order: 73 -> 74 -> 75 -> 76 -> 77 -> 78 -> 79

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 73. Page Inventory, Route Map, and IA Audits | v1.12 | 0/1 | Pending | — |
| 74. Route Groups, Navigation Config, and Role-Based Navigation | v1.12 | 0/1 | Pending | — |
| 75. User Journeys, Breadcrumbs, Back Buttons, and Page Flow Helpers | v1.12 | 0/1 | Pending | — |
| 76. Layout Standards, CTA Hierarchy, and Page State Guidelines | v1.12 | 0/1 | Pending | — |
| 77. Mobile Navigation and Responsive Flow Optimization | v1.12 | 0/1 | Pending | — |
| 78. Final Demo Flow, README, Manual QA, and E2E Path Updates | v1.12 | 0/1 | Pending | — |
| 79. Phase 13 Verification and Build Closure | v1.12 | 0/1 | Pending | — |
