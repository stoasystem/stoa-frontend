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
- 🚧 **v1.11 Phase 12: Frontend Platform Scaling, School Partnership UI, and Advanced Learning Intelligence Design** - Phases 64-72 (planned)

## Phases

<details open>
<summary>🚧 v1.11 Phase 12: Frontend Platform Scaling, School Partnership UI, and Advanced Learning Intelligence Design (Phases 64-72)</summary>

**Milestone Goal:** Build frontend-only platform expansion, organization management, school/tutoring partnership, advanced learning intelligence, parent monthly reporting, retention, and advanced analytics demo surfaces so STOA can demonstrate platform potential without implementing production multi-tenant, organization database, AI diagnosis, curriculum graph, tutor matching, or partnership backend systems.

- [ ] **Phase 64: Platform Boundary, Organization Contracts, and Workspace Foundation** - Establish Phase 12 frontend-only boundaries, organization/workspace types, services, hooks, selector, feature/mock strategy, and analytics event taxonomy.
- [ ] **Phase 65: Organization Dashboard, Students, Tutors, and Reports UI** - Build organization dashboard, student list, tutor list, reports overview, and organization navigation.
- [ ] **Phase 66: Advanced Learning Profile and Weak-Point Diagnosis UI** - Build advanced student learning profile plus weak-point diagnosis surfaces with mock evidence and recommendations.
- [ ] **Phase 67: Curriculum Graph and Topic Detail UI** - Build curriculum/topic graph visualization, status nodes, prerequisite/related edges, and topic detail panel.
- [ ] **Phase 68: Tutor Assignment Board and Schedule Overview UI** - Build tutor assignment board, available tutor list, suggested assignment placeholder, manual assign placeholder, and schedule overview.
- [ ] **Phase 69: Parent Monthly Report and Report Integration UI** - Build parent monthly report page, PDF placeholder, report links, and monthly value presentation.
- [ ] **Phase 70: Advanced Analytics and Retention UI** - Build advanced analytics dashboards, organization analytics, retention page, metric/chart/table components, and churn-risk placeholders.
- [ ] **Phase 71: Partnership Onboarding and School/Tutoring Landing Flow** - Build partnership onboarding form/workflow, update partner landing routes, and mock interest submission.
- [ ] **Phase 72: Docs, QA, E2E, and Phase 12 Verification** - Update README, platform/learning/partnership/analytics docs, QA checklist, route smoke/E2E coverage, and final build verification.

### Phase 64: Platform Boundary, Organization Contracts, and Workspace Foundation

**Goal**: Establish the frontend-only platform boundary and shared organization/workspace foundation.
**Depends on**: Phase 63
**Requirements**: [BOUND-01, BOUND-02, BOUND-03, BOUND-04, ORG-01, ORG-02, ORG-03, ORG-08]
**Success Criteria** (what must be TRUE):
  1. Docs state Phase 12 platform, organization, AI diagnosis, graph, scheduling, analytics, and partnership backend systems are out of scope.
  2. Organization types, services, hooks, mock data, and selector exist.
  3. Organization selector can display and switch a mock workspace.
  4. Organization events and mock/demo data strategy are defined.
**Plans**: 0/1

### Phase 65: Organization Dashboard, Students, Tutors, and Reports UI

**Goal**: Make the organization workspace demonstrable for school/tutoring center operators.
**Depends on**: Phase 64
**Requirements**: [ORG-04, ORG-05, ORG-06, ORG-07]
**Success Criteria** (what must be TRUE):
  1. `/organization` displays summary metrics, weak topics, tutor workload, and navigation.
  2. `/organization/students` displays student list and learning profile links.
  3. `/organization/tutors` displays tutor coverage, availability, load, and response-time placeholder.
  4. `/organization/reports` displays report overview and monthly/weekly report entry points.
**Plans**: 0/1

### Phase 66: Advanced Learning Profile and Weak-Point Diagnosis UI

**Goal**: Show richer student learning intelligence without implementing a real AI diagnosis engine.
**Depends on**: Phase 64, Phase 65
**Requirements**: [LEARN-01, LEARN-02, LEARN-03, LEARN-04, LEARN-05, DIAG-01, DIAG-02, DIAG-03, DIAG-04, DIAG-05]
**Success Criteria** (what must be TRUE):
  1. Learning profile and diagnosis types/services/hooks exist with demo fallback data.
  2. Learning profile page shows student info, subjects, weak/strong topics, history, usage, teacher help, recommendations, and report links.
  3. Diagnosis page shows summary, weak points, evidence, practice suggestions, teacher-help recommendation, and parent explanation.
  4. UI and docs preserve the mock/demo learning-intelligence boundary.
**Plans**: 0/1

### Phase 67: Curriculum Graph and Topic Detail UI

**Goal**: Visualize topic relationships and learning status with frontend mock graph data.
**Depends on**: Phase 66
**Requirements**: [GRAPH-01, GRAPH-02, GRAPH-03, GRAPH-04, GRAPH-05, GRAPH-06]
**Success Criteria** (what must be TRUE):
  1. Curriculum graph types/services/hooks exist.
  2. Graph page displays topic nodes, edges, subject labels, and status.
  3. Selecting a topic shows topic detail, recent questions, and recommendations.
  4. Graph UI remains usable on mobile and tracks graph/topic events.
**Plans**: 0/1

### Phase 68: Tutor Assignment Board and Schedule Overview UI

**Goal**: Demonstrate a more systematic tutor operations view without real matching logic.
**Depends on**: Phase 64, Phase 65
**Requirements**: [ASSIGN-01, ASSIGN-02, ASSIGN-03, ASSIGN-04, ASSIGN-05, ASSIGN-06]
**Success Criteria** (what must be TRUE):
  1. Tutor assignment types/services/hooks and mock data exist.
  2. Assignment board displays pending requests, available tutors, load, and suggestions.
  3. Manual assign action has clear placeholder/demo behavior.
  4. Schedule overview displays upcoming availability or coverage by subject.
**Plans**: 0/1

### Phase 69: Parent Monthly Report and Report Integration UI

**Goal**: Add higher-value parent monthly reporting that connects learning intelligence to parent-visible progress.
**Depends on**: Phase 66
**Requirements**: [MONTH-01, MONTH-02, MONTH-03, MONTH-04, MONTH-05]
**Success Criteria** (what must be TRUE):
  1. Monthly report types/mock data exist.
  2. `/parent/children/:childId/monthly-report` displays monthly summary, subject breakdown, weak-point trend, teacher-help summary, recommendations, and parent actions.
  3. PDF export placeholder behaves clearly without real PDF generation.
  4. Monthly report is linked from relevant report/profile surfaces and tracked.
**Plans**: 0/1

### Phase 70: Advanced Analytics and Retention UI

**Goal**: Demonstrate platform-level analytics and retention operations without production BI or automation systems.
**Depends on**: Phase 64, Phase 65
**Requirements**: [ANALYTICS-01, ANALYTICS-02, ANALYTICS-03, ANALYTICS-04, ANALYTICS-05, ANALYTICS-06]
**Success Criteria** (what must be TRUE):
  1. Advanced analytics types/mock data exist.
  2. `/admin/advanced-analytics` shows platform metrics, subject breakdown, funnel, retention, and churn risk.
  3. `/organization/analytics` shows organization-specific analytics.
  4. `/admin/retention` shows inactive/at-risk users and placeholder actions.
**Plans**: 0/1

### Phase 71: Partnership Onboarding and School/Tutoring Landing Flow

**Goal**: Make school and tutoring center partnership onboarding presentable as a frontend demo.
**Depends on**: Phase 64
**Requirements**: [PARTNER-01, PARTNER-02, PARTNER-03, PARTNER-04, PARTNER-05, PARTNER-06]
**Success Criteria** (what must be TRUE):
  1. Partnership types/services/hooks and mock submit behavior exist.
  2. `/partnership/onboarding` shows onboarding steps and form.
  3. `/for-schools` and `/for-tutoring-centers` route to onboarding/contact.
  4. Submission shows confirmation and tracks events.
**Plans**: 0/1

### Phase 72: Docs, QA, E2E, and Phase 12 Verification

**Goal**: Close Phase 12 with documentation and verification evidence for platform frontend demo readiness.
**Depends on**: Phase 71
**Requirements**: [DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, QA-01, QA-02, QA-03]
**Success Criteria** (what must be TRUE):
  1. README documents Phase 12 frontend-only scope, routes, contracts, and mock/demo behavior.
  2. Platform, learning intelligence, partnership, analytics, and retention docs exist.
  3. Manual QA checklist covers all Phase 12 flows.
  4. E2E or route smoke coverage verifies core demo routes where feasible.
  5. `npm run build` passes.
**Plans**: 0/1

</details>

<details>
<summary>✅ Previous shipped milestones (Phases 1-63)</summary>

Phases 1-63 shipped the STOA frontend foundation, product UI, backend chat integration, streaming/file uploads, authenticated roles, parent/tutor/admin MVP flows, staging/QA, production/pilot readiness, pricing validation, virtual checkout, launch-ready legal drafts, paid launch frontend, parent acquisition, referrals, tutor availability, support tickets, admin analytics, UTM tracking, and Phase 11 verification.

See `.planning/MILESTONES.md` and archived milestone audit files for detailed shipped scope and verification evidence.

</details>

## Progress

**Execution Order:**
Phases execute in numeric order: 64 -> 65 -> 66 -> 67 -> 68 -> 69 -> 70 -> 71 -> 72

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 64. Platform Boundary, Organization Contracts, and Workspace Foundation | v1.11 | 0/1 | Planned | — |
| 65. Organization Dashboard, Students, Tutors, and Reports UI | v1.11 | 0/1 | Planned | — |
| 66. Advanced Learning Profile and Weak-Point Diagnosis UI | v1.11 | 0/1 | Planned | — |
| 67. Curriculum Graph and Topic Detail UI | v1.11 | 0/1 | Planned | — |
| 68. Tutor Assignment Board and Schedule Overview UI | v1.11 | 0/1 | Planned | — |
| 69. Parent Monthly Report and Report Integration UI | v1.11 | 0/1 | Planned | — |
| 70. Advanced Analytics and Retention UI | v1.11 | 0/1 | Planned | — |
| 71. Partnership Onboarding and School/Tutoring Landing Flow | v1.11 | 0/1 | Planned | — |
| 72. Docs, QA, E2E, and Phase 12 Verification | v1.11 | 0/1 | Planned | — |
