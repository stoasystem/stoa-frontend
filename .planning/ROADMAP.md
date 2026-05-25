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

## Phases

<details open>
<summary>✅ v1.8 Phase 9 Production Readiness, Monitoring, and Pilot Launch (Phases 41-47) - IMPLEMENTED 2026-05-25</summary>

**Milestone Goal:** Upgrade STOA from a staging early-user product into a production-like pilot launch frontend that can support a small real user group with monitoring, analytics, support, privacy, and launch operations in place.

- [x] **Phase 41: Production Deployment and API Readiness** - Document production frontend/backend URLs, environment variables, SQLite boundaries, database plan coordination, and pilot API contract freeze.
- [x] **Phase 42: Monitoring and Logging Foundation** - Add frontend error monitoring service, Error Boundary reporting, logger utility, and monitoring/logging docs.
- [x] **Phase 43: Analytics Backend Delivery** - Upgrade analytics delivery to a backend endpoint and document event list, payload policy, and failure behavior.
- [x] **Phase 44: Pilot Onboarding and Support Workflow** - Add onboarding and support routes, role-specific onboarding components, support request boundary, and support workflow docs.
- [x] **Phase 45: Basic Admin Operations** - Add pilot admin usage and feedback views/placeholders, admin service/query boundaries, and admin operations scope docs.
- [x] **Phase 46: Privacy, Backup, Pricing, and Billing Preparation** - Upgrade privacy/terms drafts, add backup/restore and privacy review docs, and add pricing/billing placeholders.
- [x] **Phase 47: Launch Checklist, Pilot Plan, README, and Final Verification** - Add production readiness docs, launch checklist, pilot plan, feedback report template, README updates, and final verification record.

### Phase 41: Production Deployment and API Readiness

**Goal**: Make production-like deployment, environment configuration, database boundaries, and pilot API contracts explicit before adding operational code.
**Depends on**: Phase 40
**Requirements**: [PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, DATA-01, DATA-02, DATA-03, DATA-04]
**Success Criteria** (what must be TRUE):
  1. Production readiness docs identify frontend URL options, backend API URL expectations, and launch gate commands.
  2. `.env.example` or production documentation includes `VITE_API_BASE_URL`, `VITE_APP_ENV`, demo shortcut, analytics, feedback, and error monitoring flags.
  3. Production docs explicitly state that `VITE_*` values are public browser configuration and cannot contain secrets.
  4. SQLite is documented as local/demo/test only, with production database planning owned behind backend APIs.
  5. Pilot API contract freeze list and breaking-change coordination expectations are documented.
**Plans**: 1 plan complete

### Phase 42: Monitoring and Logging Foundation

**Goal**: Ensure pilot runtime errors can be captured without exposing sensitive student data or breaking the user experience.
**Depends on**: Phase 41
**Requirements**: [MON-01, MON-02, MON-03, MON-04, LOG-01, LOG-02]
**Success Criteria** (what must be TRUE):
  1. `src/services/monitoring/errorMonitoringApi.ts` reports sanitized frontend errors through the STOA API boundary.
  2. `AppErrorBoundary` calls monitoring in enabled environments while still showing a recovery UI.
  3. Error payload includes route and app environment.
  4. Monitoring failures are swallowed or logged safely and never create a second user-facing crash.
  5. `src/services/logging/logger.ts` exists and logging docs define allowed/disallowed production logging content.
**Plans**: 1 plan complete

### Phase 43: Analytics Backend Delivery

**Goal**: Replace development-only analytics behavior with stable backend event delivery suitable for pilot usage review.
**Depends on**: Phase 42
**Requirements**: [ANLY-01, ANLY-02, ANLY-03, ANLY-04, ANLY-05]
**Success Criteria** (what must be TRUE):
  1. Analytics client posts enabled events to `POST /analytics/events`.
  2. Disabled analytics no-ops or logs only according to environment flags.
  3. Analytics request failures do not block product actions.
  4. Docs list pilot analytics events including login, chat, upload, teacher help, parent report, tutor request, and feedback events.
  5. Payload policy clearly excludes full chat content and file contents.
**Plans**: 1 plan complete

### Phase 44: Pilot Onboarding and Support Workflow

**Goal**: Give invited pilot users clear role-specific entry paths and a reliable way to request help.
**Depends on**: Phase 43
**Requirements**: [ONB-01, ONB-02, ONB-03, ONB-04, SUP-01, SUP-02, SUP-03, SUP-04]
**Success Criteria** (what must be TRUE):
  1. `/onboarding` route renders student, parent, and tutor guidance.
  2. Student onboarding points users toward grade/subject setup and Chat.
  3. Parent onboarding explains child dashboard and report visibility.
  4. Tutor onboarding explains help request list/detail/status workflow.
  5. `/support` route explains FAQ, bug feedback, teacher help, contact, and pilot-stage expectations.
  6. Support service/hook boundary exists and support workflow docs define triage and response expectations.
**Plans**: 1 plan complete

### Phase 45: Basic Admin Operations

**Goal**: Add minimal pilot operations visibility without expanding into a full admin product.
**Depends on**: Phase 44
**Requirements**: [ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05]
**Success Criteria** (what must be TRUE):
  1. `/admin` communicates pilot operations status and environment/version basics.
  2. `/admin/usage` renders usage summary cards or a clear backend-pending placeholder.
  3. `/admin/feedback` renders feedback list contract or a clear backend-pending placeholder.
  4. Admin API service and query hooks define usage summary and feedback list boundaries.
  5. Documentation keeps full user management and complex BI dashboards out of Phase 9 scope.
**Plans**: 1 plan complete

### Phase 46: Privacy, Backup, Pricing, and Billing Preparation

**Goal**: Prepare pilot users and operators for data handling, recovery expectations, and commercial positioning without adding full compliance or payments.
**Depends on**: Phase 45
**Requirements**: [PRIV-01, PRIV-02, PRIV-03, BACKUP-01, BACKUP-02, BACKUP-03, PRICE-01, PRICE-02, PRICE-03]
**Success Criteria** (what must be TRUE):
  1. `/privacy` describes pilot data collection, use, visibility, parent access, limits, and contact path.
  2. `/terms` describes pilot nature, AI limitations, non-school-certification status, and supervision expectations.
  3. Privacy review docs cover telemetry, feedback, support, monitoring, demo data, and role visibility.
  4. Backup/restore docs identify backup data scope and distinguish SQLite pilot fallback from production database/PITR expectations.
  5. Frontend restore checks cover login, conversations, parent report, and tutor requests.
  6. `/pricing` and `/billing` routes exist as pilot-stage placeholders without payment enforcement.
**Plans**: 1 plan complete

### Phase 47: Launch Checklist, Pilot Plan, README, and Final Verification

**Goal**: Close Phase 9 with launch artifacts and verification evidence needed to start a controlled pilot.
**Depends on**: Phase 46
**Requirements**: [PROD-06, PILOT-01, PILOT-02, PILOT-03, PILOT-04, PILOT-05]
**Success Criteria** (what must be TRUE):
  1. Production readiness and launch checklist docs exist under `docs/production/`.
  2. Pilot launch plan defines goals, user counts, timeline, success metrics, test tasks, feedback path, support path, risks, and retrospective process.
  3. Post-pilot feedback report template exists.
  4. README documents Phase 9 production readiness, production env example, pilot launch goals, and before-launch gates.
  5. Final verification records build, E2E/manual QA expectations, privacy/security review status, production-like demo status, and remaining blockers.
**Plans**: 1 plan complete

</details>

## Progress

**Execution Order:**
Phases execute in numeric order: 41 -> 42 -> 43 -> 44 -> 45 -> 46 -> 47

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 41. Production Deployment and API Readiness | v1.8 | 1/1 | Complete | 2026-05-25 |
| 42. Monitoring and Logging Foundation | v1.8 | 1/1 | Complete | 2026-05-25 |
| 43. Analytics Backend Delivery | v1.8 | 1/1 | Complete | 2026-05-25 |
| 44. Pilot Onboarding and Support Workflow | v1.8 | 1/1 | Complete | 2026-05-25 |
| 45. Basic Admin Operations | v1.8 | 1/1 | Complete | 2026-05-25 |
| 46. Privacy, Backup, Pricing, and Billing Preparation | v1.8 | 1/1 | Complete | 2026-05-25 |
| 47. Launch Checklist, Pilot Plan, README, and Final Verification | v1.8 | 1/1 | Complete | 2026-05-25 |
