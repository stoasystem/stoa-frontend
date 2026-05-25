# Requirements: STOA Frontend v1.11 Phase 12 Frontend Platform Scaling, School Partnership UI, and Advanced Learning Intelligence Design

**Defined:** 2026-05-25
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA platform frontend workflow with organization, school partnership, learning intelligence, analytics, and demo/mock API surfaces.

## v1.11 Requirements

Phase 12 is frontend-only. It prepares platform-level organization UI, school/tutoring partnership demos, advanced learning profile UI, curriculum graph UI, weak-point diagnosis UI, tutor assignment UI, parent monthly reports, advanced analytics, retention UI, API contracts, mock data, and demo support without implementing production backend, database, real multi-tenant permissions, real AI diagnosis, or real curriculum graph computation.

### Frontend-Only Platform Boundary

- [ ] **BOUND-01**: Phase 12 docs explicitly state that production multi-tenant backend, organization database, school backend, AI diagnosis engine, curriculum graph backend, tutor matching algorithm, automated marketing backend, enterprise invoicing, and data warehouse are out of scope.
- [ ] **BOUND-02**: Demo/mock API strategy is defined for organizations, learning profiles, curriculum graph, diagnosis, tutor assignment, monthly reports, advanced analytics, retention, and partnership onboarding.
- [ ] **BOUND-03**: Organization roles and workspace concepts are documented as frontend display/demo concepts only.
- [ ] **BOUND-04**: Mock/demo data remains behind typed services or mock data modules, not embedded directly in page components.

### Organization Workspace UI

- [ ] **ORG-01**: `src/types/organization.ts` defines organization, organization type, member role, summary, student, tutor, and report overview types.
- [ ] **ORG-02**: Organization services and hooks expose `GET /organizations`, `GET /organizations/:id/summary`, `GET /organizations/:id/students`, `GET /organizations/:id/tutors`, and `GET /organizations/:id/reports` contracts.
- [ ] **ORG-03**: `OrganizationSelector` displays and switches the current workspace and triggers `organization_switched` analytics.
- [ ] **ORG-04**: `/organization` displays organization summary metrics, weak topic overview, tutor workload, and links to students/tutors/reports/analytics.
- [ ] **ORG-05**: `/organization/students` displays a student list with grade, subjects, last active, weak topic count, teacher help count, and learning profile links.
- [ ] **ORG-06**: `/organization/tutors` displays tutor subjects, availability, pending requests, resolved requests, and response time placeholder.
- [ ] **ORG-07**: `/organization/reports` displays organization-level report overview and monthly/weekly report entry points.
- [ ] **ORG-08**: Organization mock data includes at least one tutoring center, one school, multiple students, tutors, and organization analytics.

### Advanced Learning Profile

- [ ] **LEARN-01**: `src/types/learningProfile.ts` defines learning profile, active subjects, weak topics, strong topics, recent history, usage, teacher help history, and recommended actions.
- [ ] **LEARN-02**: Learning profile service/hook exposes `GET /students/:studentId/learning-profile`.
- [ ] **LEARN-03**: `/students/:studentId/learning-profile` or `/organization/students/:studentId/learning-profile` displays basic info, subjects, weak topics, strong topics, recent history, teacher help, usage, recommendations, and parent report links.
- [ ] **LEARN-04**: Learning profile components separate header, weak topics, strong topics, history, and recommendations.
- [ ] **LEARN-05**: `learning_profile_viewed` and `organization_student_opened` events are tracked with privacy-safe metadata.

### Curriculum Graph UI

- [ ] **GRAPH-01**: `src/types/curriculumGraph.ts` defines topic nodes, edges, topic status, relations, and topic detail.
- [ ] **GRAPH-02**: Curriculum graph service/hook exposes `GET /students/:studentId/curriculum-graph`.
- [ ] **GRAPH-03**: `/curriculum-graph` and/or `/students/:studentId/curriculum-graph` displays topic nodes, prerequisite/related edges, and weak/developing/stable/strong status.
- [ ] **GRAPH-04**: Clicking a topic opens a detail panel with topic detail, recent questions, and recommendations.
- [ ] **GRAPH-05**: Curriculum graph UI remains usable on mobile without severe overflow.
- [ ] **GRAPH-06**: `curriculum_graph_viewed` and `curriculum_topic_selected` events are tracked without sensitive content.

### Weak-Point Diagnosis UI

- [ ] **DIAG-01**: `src/types/diagnosis.ts` defines diagnosis summary, weak point severity, evidence, recommendations, teacher-help suggestion, and parent explanation.
- [ ] **DIAG-02**: Diagnosis service/hook exposes `GET /students/:studentId/diagnosis`.
- [ ] **DIAG-03**: `/students/:studentId/diagnosis` displays diagnosis summary, weak points, evidence list, suggested practice, teacher-help recommendation, and parent explanation.
- [ ] **DIAG-04**: Diagnosis UI clearly remains a mock/demo frontend result and does not claim real AI diagnosis.
- [ ] **DIAG-05**: `weak_point_diagnosis_viewed` is tracked with student/topic identifiers only.

### Tutor Assignment And Scheduling UI

- [ ] **ASSIGN-01**: `src/types/tutorAssignment.ts` defines pending requests, available tutors, assignment suggestions, and schedule overview data.
- [ ] **ASSIGN-02**: Tutor assignment service/hook exposes assignment board contracts for pending requests, available tutors, and suggestions.
- [ ] **ASSIGN-03**: `/organization/tutor-assignment` or `/admin/tutor-assignment` displays pending requests, available tutors, load, availability, and suggested assignment.
- [ ] **ASSIGN-04**: Manual assign button has placeholder/demo behavior without implementing a real matching algorithm.
- [ ] **ASSIGN-05**: Tutor schedule overview displays upcoming availability or coverage by subject.
- [ ] **ASSIGN-06**: `tutor_assignment_board_viewed` and `tutor_assignment_suggested_clicked` events are tracked.

### Parent Monthly Report

- [ ] **MONTH-01**: Parent monthly report types/mock data cover summary, subject breakdown, weak-point trend, teacher help summary, practice recommendations, and parent actions.
- [ ] **MONTH-02**: `/parent/children/:childId/monthly-report` displays monthly report content.
- [ ] **MONTH-03**: Monthly report includes a PDF export placeholder that does not generate a real PDF.
- [ ] **MONTH-04**: Parent monthly report links from learning profile or organization report surfaces where appropriate.
- [ ] **MONTH-05**: `parent_monthly_report_viewed` is tracked.

### Advanced Analytics And Retention UI

- [ ] **ANALYTICS-01**: Advanced analytics types/mock data cover active students/parents, questions by subject, teacher-help rate, upload rate, report view rate, retention cohort, churn risk, and conversion funnel.
- [ ] **ANALYTICS-02**: `/admin/advanced-analytics` displays advanced metrics, subject breakdown, funnel, retention table, and churn risk placeholders.
- [ ] **ANALYTICS-03**: `/organization/analytics` displays organization-specific analytics.
- [ ] **ANALYTICS-04**: Analytics components include reusable metric card, subject chart/table, funnel chart/table, and retention table.
- [ ] **ANALYTICS-05**: `/admin/retention` displays inactive students, at-risk families, suggested actions, and placeholder reminder/follow-up actions.
- [ ] **ANALYTICS-06**: `advanced_analytics_viewed` and `retention_page_viewed` are tracked.

### Partnership Onboarding

- [ ] **PARTNER-01**: `src/types/partnership.ts` defines partnership interest payload, organization type, subjects, contacts, and response.
- [ ] **PARTNER-02**: Partnership service/hook exposes `POST /partnership/interests`.
- [ ] **PARTNER-03**: `/partnership/onboarding` displays the partnership onboarding steps and interest form.
- [ ] **PARTNER-04**: `/for-schools` and `/for-tutoring-centers` are updated or retained as partnership landing entries that route to onboarding/contact.
- [ ] **PARTNER-05**: Partnership form submit uses mock/demo mutation and shows confirmation.
- [ ] **PARTNER-06**: `partnership_page_viewed` and `partnership_interest_submitted` are tracked.

### Documentation, QA, And Verification

- [ ] **DOC-01**: README documents Phase 12 frontend-only scope, main additions, route list, and mock API contracts.
- [ ] **DOC-02**: Platform docs cover organization frontend architecture and workspace navigation.
- [ ] **DOC-03**: Learning intelligence docs cover learning profile UI, curriculum graph UI, and weak-point diagnosis UI.
- [ ] **DOC-04**: Partnership docs cover school partnership frontend and tutoring center onboarding.
- [ ] **DOC-05**: Analytics docs cover advanced analytics UI and retention UI.
- [ ] **QA-01**: Manual QA checklist covers organization UI, learning profile, curriculum graph, diagnosis, tutor assignment, monthly report, partnership onboarding, analytics, retention, and build.
- [ ] **QA-02**: E2E or route smoke coverage verifies core Phase 12 demo routes where feasible.
- [ ] **QA-03**: `npm run build` passes at milestone completion.

## Future Requirements

Deferred to later milestones.

- **BACKEND-ORG-01**: Production multi-tenant organization backend and role/permission enforcement.
- **BACKEND-SCHOOL-01**: Real school/tutoring center onboarding backend and organization database.
- **AI-DIAG-01**: Real AI weak-point diagnosis engine and evaluation pipeline.
- **GRAPH-ENGINE-01**: Real curriculum graph computation and graph data backend.
- **SCHED-01**: Real tutor assignment algorithm, scheduling enforcement, and calendar integration.
- **RETENTION-AUTO-01**: Automated retention messaging and follow-up task backend.
- **ANALYTICS-WAREHOUSE-01**: Production data warehouse and advanced analytics aggregation.
- **PDF-REPORT-01**: Real monthly report PDF generation and delivery.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Production multi-tenant backend | Phase 12 is frontend-only. |
| Real organization database | Mock/demo data is enough for frontend flow validation. |
| Formal school admin backend | Future backend/platform work. |
| Real AI diagnosis engine | Phase 12 only designs UI and contracts. |
| Real curriculum graph computation | Phase 12 only shows mock graph data. |
| Tutor assignment algorithm | UI can show suggestions, not compute real matching. |
| Automated marketing/retention backend | Retention UI only. |
| Enterprise invoicing/contracting | Not needed for platform frontend demo. |
| Data warehouse/BI system | Advanced analytics UI only. |
| CRM/helpdesk integration | Outside partnership UI scope. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOUND-01 | Phase 64 | Planned |
| BOUND-02 | Phase 64 | Planned |
| BOUND-03 | Phase 64 | Planned |
| BOUND-04 | Phase 64 | Planned |
| ORG-01 | Phase 64 | Planned |
| ORG-02 | Phase 64 | Planned |
| ORG-03 | Phase 64 | Planned |
| ORG-08 | Phase 64 | Planned |
| ORG-04 | Phase 65 | Planned |
| ORG-05 | Phase 65 | Planned |
| ORG-06 | Phase 65 | Planned |
| ORG-07 | Phase 65 | Planned |
| LEARN-01 | Phase 66 | Planned |
| LEARN-02 | Phase 66 | Planned |
| LEARN-03 | Phase 66 | Planned |
| LEARN-04 | Phase 66 | Planned |
| LEARN-05 | Phase 66 | Planned |
| DIAG-01 | Phase 66 | Planned |
| DIAG-02 | Phase 66 | Planned |
| DIAG-03 | Phase 66 | Planned |
| DIAG-04 | Phase 66 | Planned |
| DIAG-05 | Phase 66 | Planned |
| GRAPH-01 | Phase 67 | Planned |
| GRAPH-02 | Phase 67 | Planned |
| GRAPH-03 | Phase 67 | Planned |
| GRAPH-04 | Phase 67 | Planned |
| GRAPH-05 | Phase 67 | Planned |
| GRAPH-06 | Phase 67 | Planned |
| ASSIGN-01 | Phase 68 | Planned |
| ASSIGN-02 | Phase 68 | Planned |
| ASSIGN-03 | Phase 68 | Planned |
| ASSIGN-04 | Phase 68 | Planned |
| ASSIGN-05 | Phase 68 | Planned |
| ASSIGN-06 | Phase 68 | Planned |
| MONTH-01 | Phase 69 | Planned |
| MONTH-02 | Phase 69 | Planned |
| MONTH-03 | Phase 69 | Planned |
| MONTH-04 | Phase 69 | Planned |
| MONTH-05 | Phase 69 | Planned |
| ANALYTICS-01 | Phase 70 | Planned |
| ANALYTICS-02 | Phase 70 | Planned |
| ANALYTICS-03 | Phase 70 | Planned |
| ANALYTICS-04 | Phase 70 | Planned |
| ANALYTICS-05 | Phase 70 | Planned |
| ANALYTICS-06 | Phase 70 | Planned |
| PARTNER-01 | Phase 71 | Planned |
| PARTNER-02 | Phase 71 | Planned |
| PARTNER-03 | Phase 71 | Planned |
| PARTNER-04 | Phase 71 | Planned |
| PARTNER-05 | Phase 71 | Planned |
| PARTNER-06 | Phase 71 | Planned |
| DOC-01 | Phase 72 | Planned |
| DOC-02 | Phase 72 | Planned |
| DOC-03 | Phase 72 | Planned |
| DOC-04 | Phase 72 | Planned |
| DOC-05 | Phase 72 | Planned |
| QA-01 | Phase 72 | Planned |
| QA-02 | Phase 72 | Planned |
| QA-03 | Phase 72 | Planned |

**Coverage:**
- v1.11 requirements: 60 total
- Mapped to phases: 60
- Planned: 60
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after v1.11 roadmap creation*
