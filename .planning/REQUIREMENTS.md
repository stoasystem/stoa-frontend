# Requirements: STOA Frontend v1.8 Phase 9 Production Readiness, Monitoring, and Pilot Launch

**Defined:** 2026-05-25
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries backed only by the unified STOA backend API contract.

## v1.8 Requirements

Requirements for the ninth-stage production readiness and controlled pilot launch milestone. Each maps to roadmap phases after approval.

### Production Readiness

- [ ] **PROD-01**: Production frontend URL options and the preferred stable pilot URL are documented.
- [ ] **PROD-02**: Production backend API URL and frontend connection expectations are documented.
- [ ] **PROD-03**: Production environment variables are documented, including API base URL, app env, demo shortcuts, analytics, feedback, and error monitoring flags.
- [ ] **PROD-04**: Production configuration explicitly disables demo shortcuts and avoids localhost APIs.
- [ ] **PROD-05**: Build and preview launch gate commands are documented as `npm run build` and `npm run preview`.
- [ ] **PROD-06**: README documents Phase 9 production readiness and pilot launch setup.

### Database and API Contract

- [ ] **DATA-01**: SQLite is documented as local development, demo, and functional-test infrastructure only.
- [ ] **DATA-02**: Backend production database options and migration boundaries are documented without coupling frontend code to a database implementation.
- [ ] **DATA-03**: Pilot API contract freeze list is documented for auth, conversations, files, teacher help, parent reports, tutor workflows, feedback, and analytics.
- [ ] **DATA-04**: Breaking API change coordination expectations are documented for frontend/backend work.

### Monitoring and Logging

- [ ] **MON-01**: Frontend error monitoring service exists for reporting sanitized runtime errors.
- [ ] **MON-02**: `AppErrorBoundary` reports production runtime errors without causing a secondary crash.
- [ ] **MON-03**: Error payload includes message, optional stack, route, user role/id when available, app environment, and timestamp.
- [ ] **MON-04**: Error monitoring policy excludes passwords, tokens, file contents, and full private chat content.
- [ ] **LOG-01**: Frontend logger utility exists with development-only debug/info behavior and production-safe warn/error behavior.
- [ ] **LOG-02**: Logging strategy documentation defines debug, info, warn, and error usage for pilot and production.

### Analytics

- [ ] **ANLY-01**: Analytics client sends enabled events to `POST /analytics/events`.
- [ ] **ANLY-02**: Analytics client no-ops or logs only in disabled/development modes according to environment flags.
- [ ] **ANLY-03**: Analytics failures do not block chat, upload, report, tutor, feedback, support, or navigation flows.
- [ ] **ANLY-04**: Pilot analytics event list is documented.
- [ ] **ANLY-05**: Analytics payload policy excludes full chat content and file contents.

### Pilot Onboarding and Support

- [ ] **ONB-01**: `/onboarding` route exists for pilot onboarding.
- [ ] **ONB-02**: Student onboarding explains grade/subject setup and entry into Chat.
- [ ] **ONB-03**: Parent onboarding explains child dashboard and report visibility.
- [ ] **ONB-04**: Tutor onboarding explains help request list/detail/status workflow.
- [ ] **SUP-01**: `/support` route exists and is reachable from the app navigation or user menu.
- [ ] **SUP-02**: Support page explains FAQ, bug feedback, teacher-help distinction, contact path, and pilot-stage expectations.
- [ ] **SUP-03**: Support request service and mutation hook exist for typed support submissions or a documented feedback-compatible backend path.
- [ ] **SUP-04**: Support workflow documentation explains triage, severity, ownership, and response expectations.

### Admin Operations

- [ ] **ADMIN-01**: `/admin` route communicates pilot operations status and environment/version basics.
- [ ] **ADMIN-02**: `/admin/usage` route shows usage summary cards or a backend-pending placeholder for active users, role counts, messages, help requests, uploads, and feedback.
- [ ] **ADMIN-03**: `/admin/feedback` route shows feedback list contract or backend-pending placeholder.
- [ ] **ADMIN-04**: Admin API service and query hooks exist for usage summary and feedback list boundaries.
- [ ] **ADMIN-05**: Full admin user management remains explicitly deferred.

### Privacy, Legal, Backup, and Commercial Preparation

- [ ] **PRIV-01**: `/privacy` page is upgraded from placeholder to pilot draft explaining collected data, purpose, visibility, learning feedback use, parent visibility, pilot limits, and contact path.
- [ ] **PRIV-02**: `/terms` page is upgraded from placeholder to pilot draft explaining pilot nature, AI limitations, non-school-certification status, and supervision expectations.
- [ ] **PRIV-03**: Data privacy review document covers analytics, feedback, support, error monitoring, demo data separation, and child/parent/tutor visibility.
- [ ] **BACKUP-01**: Backup and restore strategy document identifies data ranges requiring backup.
- [ ] **BACKUP-02**: Backup and restore strategy distinguishes SQLite pilot fallback from production database backup/PITR expectations.
- [ ] **BACKUP-03**: Frontend restore verification checks cover login, conversations, parent report, and tutor requests.
- [ ] **PRICE-01**: `/pricing` route exists with pilot-stage tiers for Free Trial, Student Plan, Family Plan, and Tutor-supported Plan.
- [ ] **PRICE-02**: `/billing` route exists and clearly states billing is unavailable until after pilot.
- [ ] **PRICE-03**: User/subscription type placeholders are prepared where appropriate without enforcing payment behavior.

### Pilot Launch Documentation and Verification

- [ ] **PILOT-01**: Production readiness document exists under `docs/production/`.
- [ ] **PILOT-02**: Launch checklist exists and covers production-like deployment, monitoring, analytics, onboarding, support, admin, privacy, and pilot launch gates.
- [ ] **PILOT-03**: Pilot launch plan defines goals, user counts, user types, timeline, success metrics, test tasks, feedback method, support method, risks, and retrospective process.
- [ ] **PILOT-04**: Post-pilot feedback report template exists.
- [ ] **PILOT-05**: Final verification records build, E2E/manual QA expectations, privacy/security review status, production-like demo status, and remaining blockers.

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
| PROD-01 | Phase 41 | Pending |
| PROD-02 | Phase 41 | Pending |
| PROD-03 | Phase 41 | Pending |
| PROD-04 | Phase 41 | Pending |
| PROD-05 | Phase 41 | Pending |
| PROD-06 | Phase 47 | Pending |
| DATA-01 | Phase 41 | Pending |
| DATA-02 | Phase 41 | Pending |
| DATA-03 | Phase 41 | Pending |
| DATA-04 | Phase 41 | Pending |
| MON-01 | Phase 42 | Pending |
| MON-02 | Phase 42 | Pending |
| MON-03 | Phase 42 | Pending |
| MON-04 | Phase 42 | Pending |
| LOG-01 | Phase 42 | Pending |
| LOG-02 | Phase 42 | Pending |
| ANLY-01 | Phase 43 | Pending |
| ANLY-02 | Phase 43 | Pending |
| ANLY-03 | Phase 43 | Pending |
| ANLY-04 | Phase 43 | Pending |
| ANLY-05 | Phase 43 | Pending |
| ONB-01 | Phase 44 | Pending |
| ONB-02 | Phase 44 | Pending |
| ONB-03 | Phase 44 | Pending |
| ONB-04 | Phase 44 | Pending |
| SUP-01 | Phase 44 | Pending |
| SUP-02 | Phase 44 | Pending |
| SUP-03 | Phase 44 | Pending |
| SUP-04 | Phase 44 | Pending |
| ADMIN-01 | Phase 45 | Pending |
| ADMIN-02 | Phase 45 | Pending |
| ADMIN-03 | Phase 45 | Pending |
| ADMIN-04 | Phase 45 | Pending |
| ADMIN-05 | Phase 45 | Pending |
| PRIV-01 | Phase 46 | Pending |
| PRIV-02 | Phase 46 | Pending |
| PRIV-03 | Phase 46 | Pending |
| BACKUP-01 | Phase 46 | Pending |
| BACKUP-02 | Phase 46 | Pending |
| BACKUP-03 | Phase 46 | Pending |
| PRICE-01 | Phase 46 | Pending |
| PRICE-02 | Phase 46 | Pending |
| PRICE-03 | Phase 46 | Pending |
| PILOT-01 | Phase 47 | Pending |
| PILOT-02 | Phase 47 | Pending |
| PILOT-03 | Phase 47 | Pending |
| PILOT-04 | Phase 47 | Pending |
| PILOT-05 | Phase 47 | Pending |

**Coverage:**
- v1.8 requirements: 49 total
- Mapped to phases: 49
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after v1.8 roadmap creation*
