# Requirements: STOA Frontend v1.8 Phase 9 Production Readiness, Monitoring, and Pilot Launch

**Defined:** 2026-05-25
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries backed only by the unified STOA backend API contract.

## v1.8 Requirements

Requirements for the ninth-stage production readiness and controlled pilot launch milestone. Each maps to roadmap phases after approval.

### Production Readiness

- [x] **PROD-01**: Production frontend URL options and the preferred stable pilot URL are documented.
- [x] **PROD-02**: Production backend API URL and frontend connection expectations are documented.
- [x] **PROD-03**: Production environment variables are documented, including API base URL, app env, demo shortcuts, analytics, feedback, and error monitoring flags.
- [x] **PROD-04**: Production configuration explicitly disables demo shortcuts and avoids localhost APIs.
- [x] **PROD-05**: Build and preview launch gate commands are documented as `npm run build` and `npm run preview`.
- [x] **PROD-06**: README documents Phase 9 production readiness and pilot launch setup.

### Database and API Contract

- [x] **DATA-01**: SQLite is documented as local development, demo, and functional-test infrastructure only.
- [x] **DATA-02**: Backend production database options and migration boundaries are documented without coupling frontend code to a database implementation.
- [x] **DATA-03**: Pilot API contract freeze list is documented for auth, conversations, files, teacher help, parent reports, tutor workflows, feedback, and analytics.
- [x] **DATA-04**: Breaking API change coordination expectations are documented for frontend/backend work.

### Monitoring and Logging

- [x] **MON-01**: Frontend error monitoring service exists for reporting sanitized runtime errors.
- [x] **MON-02**: `AppErrorBoundary` reports production runtime errors without causing a secondary crash.
- [x] **MON-03**: Error payload includes message, optional stack, route, user role/id when available, app environment, and timestamp.
- [x] **MON-04**: Error monitoring policy excludes passwords, tokens, file contents, and full private chat content.
- [x] **LOG-01**: Frontend logger utility exists with development-only debug/info behavior and production-safe warn/error behavior.
- [x] **LOG-02**: Logging strategy documentation defines debug, info, warn, and error usage for pilot and production.

### Analytics

- [x] **ANLY-01**: Analytics client sends enabled events to `POST /analytics/events`.
- [x] **ANLY-02**: Analytics client no-ops or logs only in disabled/development modes according to environment flags.
- [x] **ANLY-03**: Analytics failures do not block chat, upload, report, tutor, feedback, support, or navigation flows.
- [x] **ANLY-04**: Pilot analytics event list is documented.
- [x] **ANLY-05**: Analytics payload policy excludes full chat content and file contents.

### Pilot Onboarding and Support

- [x] **ONB-01**: `/onboarding` route exists for pilot onboarding.
- [x] **ONB-02**: Student onboarding explains grade/subject setup and entry into Chat.
- [x] **ONB-03**: Parent onboarding explains child dashboard and report visibility.
- [x] **ONB-04**: Tutor onboarding explains help request list/detail/status workflow.
- [x] **SUP-01**: `/support` route exists and is reachable from the app navigation or user menu.
- [x] **SUP-02**: Support page explains FAQ, bug feedback, teacher-help distinction, contact path, and pilot-stage expectations.
- [x] **SUP-03**: Support request service and mutation hook exist for typed support submissions or a documented feedback-compatible backend path.
- [x] **SUP-04**: Support workflow documentation explains triage, severity, ownership, and response expectations.

### Admin Operations

- [x] **ADMIN-01**: `/admin` route communicates pilot operations status and environment/version basics.
- [x] **ADMIN-02**: `/admin/usage` route shows usage summary cards or a backend-pending placeholder for active users, role counts, messages, help requests, uploads, and feedback.
- [x] **ADMIN-03**: `/admin/feedback` route shows feedback list contract or backend-pending placeholder.
- [x] **ADMIN-04**: Admin API service and query hooks exist for usage summary and feedback list boundaries.
- [x] **ADMIN-05**: Full admin user management remains explicitly deferred.

### Privacy, Legal, Backup, and Commercial Preparation

- [x] **PRIV-01**: `/privacy` page is upgraded from placeholder to pilot draft explaining collected data, purpose, visibility, learning feedback use, parent visibility, pilot limits, and contact path.
- [x] **PRIV-02**: `/terms` page is upgraded from placeholder to pilot draft explaining pilot nature, AI limitations, non-school-certification status, and supervision expectations.
- [x] **PRIV-03**: Data privacy review document covers analytics, feedback, support, error monitoring, demo data separation, and child/parent/tutor visibility.
- [x] **BACKUP-01**: Backup and restore strategy document identifies data ranges requiring backup.
- [x] **BACKUP-02**: Backup and restore strategy distinguishes SQLite pilot fallback from production database backup/PITR expectations.
- [x] **BACKUP-03**: Frontend restore verification checks cover login, conversations, parent report, and tutor requests.
- [x] **PRICE-01**: `/pricing` route exists with pilot-stage tiers for Free Trial, Student Plan, Family Plan, and Tutor-supported Plan.
- [x] **PRICE-02**: `/billing` route exists and clearly states billing is unavailable until after pilot.
- [x] **PRICE-03**: User/subscription type placeholders are prepared where appropriate without enforcing payment behavior.

### Pilot Launch Documentation and Verification

- [x] **PILOT-01**: Production readiness document exists under `docs/production/`.
- [x] **PILOT-02**: Launch checklist exists and covers production-like deployment, monitoring, analytics, onboarding, support, admin, privacy, and pilot launch gates.
- [x] **PILOT-03**: Pilot launch plan defines goals, user counts, user types, timeline, success metrics, test tasks, feedback method, support method, risks, and retrospective process.
- [x] **PILOT-04**: Post-pilot feedback report template exists.
- [x] **PILOT-05**: Final verification records build, E2E/manual QA expectations, privacy/security review status, production-like demo status, and remaining blockers.

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Public Launch and Monetization

- **PAY-01**: Payment provider is selected and integrated.
- **SUB-01**: Subscription status is enforced in product flows.
- **BILL-01**: Billing history and invoices are available.
- **ADMIN-06**: Admin can fully manage pilot users, roles, account status, and support cases.
- **CRM-01**: Support workflow is integrated with a full CRM or helpdesk.
- **OBS-01**: Full observability platform includes traces, replay, uptime monitoring, alert routing, and dashboards.
- **LEGAL-01**: Privacy policy and terms are legally reviewed and finalized.
- **SCHOOL-01**: School B2B onboarding and multi-tenant organization management exist.
- **BI-01**: Production analytics warehouse and BI dashboard exist.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Large-scale public launch | Phase 9 validates a small controlled pilot only. |
| Full payment system | Pricing and billing placeholders are enough before pilot validation. |
| Full CRM/helpdesk | Support can be handled through a lightweight support/feedback workflow. |
| Complete school B2B onboarding | Pilot user onboarding is individual and controlled. |
| Complex admin dashboard | Phase 9 needs minimal usage/feedback/admin placeholders only. |
| Full financial reporting | No payment system is implemented in this milestone. |
| Formal compliance certification | Phase 9 performs a privacy review and pilot drafts, not full certification. |
| Full observability platform | Error monitoring and logging foundations are enough for pilot readiness. |
| Multi-tenant school organization system | Outside controlled pilot scope. |
| Marketing growth system and A/B testing | Pilot launch prioritizes learning, support, and reliability signals. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROD-01 | Phase 41 | Complete |
| PROD-02 | Phase 41 | Complete |
| PROD-03 | Phase 41 | Complete |
| PROD-04 | Phase 41 | Complete |
| PROD-05 | Phase 41 | Complete |
| PROD-06 | Phase 47 | Complete |
| DATA-01 | Phase 41 | Complete |
| DATA-02 | Phase 41 | Complete |
| DATA-03 | Phase 41 | Complete |
| DATA-04 | Phase 41 | Complete |
| MON-01 | Phase 42 | Complete |
| MON-02 | Phase 42 | Complete |
| MON-03 | Phase 42 | Complete |
| MON-04 | Phase 42 | Complete |
| LOG-01 | Phase 42 | Complete |
| LOG-02 | Phase 42 | Complete |
| ANLY-01 | Phase 43 | Complete |
| ANLY-02 | Phase 43 | Complete |
| ANLY-03 | Phase 43 | Complete |
| ANLY-04 | Phase 43 | Complete |
| ANLY-05 | Phase 43 | Complete |
| ONB-01 | Phase 44 | Complete |
| ONB-02 | Phase 44 | Complete |
| ONB-03 | Phase 44 | Complete |
| ONB-04 | Phase 44 | Complete |
| SUP-01 | Phase 44 | Complete |
| SUP-02 | Phase 44 | Complete |
| SUP-03 | Phase 44 | Complete |
| SUP-04 | Phase 44 | Complete |
| ADMIN-01 | Phase 45 | Complete |
| ADMIN-02 | Phase 45 | Complete |
| ADMIN-03 | Phase 45 | Complete |
| ADMIN-04 | Phase 45 | Complete |
| ADMIN-05 | Phase 45 | Complete |
| PRIV-01 | Phase 46 | Complete |
| PRIV-02 | Phase 46 | Complete |
| PRIV-03 | Phase 46 | Complete |
| BACKUP-01 | Phase 46 | Complete |
| BACKUP-02 | Phase 46 | Complete |
| BACKUP-03 | Phase 46 | Complete |
| PRICE-01 | Phase 46 | Complete |
| PRICE-02 | Phase 46 | Complete |
| PRICE-03 | Phase 46 | Complete |
| PILOT-01 | Phase 47 | Complete |
| PILOT-02 | Phase 47 | Complete |
| PILOT-03 | Phase 47 | Complete |
| PILOT-04 | Phase 47 | Complete |
| PILOT-05 | Phase 47 | Complete |

**Coverage:**
- v1.8 requirements: 49 total
- Mapped to phases: 49
- Complete: 49
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after v1.8 roadmap creation*
