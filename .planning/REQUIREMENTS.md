# Requirements: STOA Frontend v1.6 Phase 7 Product Polishing, Analytics, and MVP Readiness

**Defined:** 2026-05-25
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries backed only by the unified STOA backend API contract.

## v1.6 Requirements

Requirements for the seventh-stage MVP readiness milestone. Each maps to roadmap phases.

### UI and Responsive Readiness

- [ ] **UI-01**: Core pages use shared page container, page header, and section header patterns.
- [ ] **UI-02**: UI guidelines document layout, cards, forms, badges, chat, dashboards, and mobile behavior.
- [ ] **UI-03**: Login, register, dashboard, chat, profile, parent, child summary, tutor list, and tutor detail pages are usable on mobile and tablet widths.
- [ ] **UI-04**: Chat mobile layout avoids permanent sidebar compression and keeps messages/input usable.

### Loading and Feedback

- [ ] **LOAD-01**: Shared skeleton primitives and page skeletons exist.
- [ ] **LOAD-02**: Chat, dashboard, parent, tutor, profile, and report loading states use skeletons.
- [ ] **FEED-01**: Toast notification system is wired through app providers.
- [ ] **FEED-02**: Auth, profile, upload, teacher-help, and tutor actions show success/error feedback.

### Validation and Resilience

- [ ] **VAL-01**: Login validation covers email format and required password.
- [ ] **VAL-02**: Register validation covers name, email, password length, and role.
- [ ] **VAL-03**: Student profile validation covers grade and at least one subject.
- [ ] **VAL-04**: Chat input blocks empty messages.
- [ ] **VAL-05**: File upload validation preserves type, size, and count rules with user-readable feedback.
- [ ] **ERR-01**: App has an error boundary with recovery UI.

### Analytics and Usage Tracking

- [ ] **ANLY-01**: Analytics client defines MVP event names and payload type.
- [ ] **ANLY-02**: Core auth, chat, upload, teacher-help, parent report, and tutor events are tracked.
- [ ] **ANLY-03**: Usage tracking API contract is documented.
- [ ] **ANLY-04**: Local backend can store analytics events.

### Parent Report

- [ ] **RPRT-01**: Parent report type, API, hook, and route exist.
- [ ] **RPRT-02**: Report displays period, summary, stats, top subjects, weak topics, and recommendations.
- [ ] **RPRT-03**: Local backend returns seed report data.
- [ ] **RPRT-04**: Parent report view is tracked.

### Tutor Workflow

- [ ] **TUTR-05**: Tutor request list supports status filtering.
- [ ] **TUTR-06**: Tutor list and detail show created time, grade, subject, summary, priority placeholder, and context.
- [ ] **TUTR-07**: Tutor can add teacher notes.
- [ ] **TUTR-08**: Tutor status and note updates refresh UI and are tracked.

### Demo, Staging, and Documentation

- [ ] **DEMO-01**: Demo seed data supports full student to tutor to parent MVP flow.
- [ ] **DEMO-02**: Demo login shortcuts appear only when enabled by environment.
- [ ] **ENV-01**: `.env.example` includes app environment, analytics, and demo flags.
- [ ] **DOCS-20**: README documents Phase 7, demo accounts, demo flow, staging config, and MVP checklist.
- [ ] **VERF-03**: Build, lint, backend seed, and route smoke verification are recorded.

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Deployment and QA

- **DEPLOY-02**: Staging deployment is configured and published.
- **CI-01**: CI build check runs on pull requests.
- **E2E-01**: E2E tests cover the student, tutor, and parent demo flow.
- **QA-01**: Manual QA checklist is executed with early users.

### Analytics and Reporting

- **ANLY-05**: Product analytics dashboards exist.
- **RPRT-05**: Parent reports are generated automatically from real learning activity.
- **OBS-01**: Production monitoring and error reporting exist.

### Product Expansion

- **PAY-01**: Payment and subscription flows exist.
- **ADMIN-02**: Full admin user and tutor management exists.
- **BI-01**: Complex business intelligence dashboards exist.
- **CONTENT-01**: Curriculum and content management exists.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Production deployment | Phase 7 prepares staging config and demo readiness; deployment execution belongs to Phase 8. |
| Full payment system | Not required for MVP demo readiness. |
| Full admin backend | Admin remains outside Phase 7 polish scope. |
| Complex BI dashboard | Phase 7 adds event tracking and contracts only. |
| Production audit logging | Deferred to later security/compliance work. |
| Automatic AI-generated reports | Phase 7 can use seed/local report data to validate parent value. |
| Full school B2B management | Not required for early MVP flow. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UI-01 | Phase 28 | Pending |
| UI-02 | Phase 28 | Pending |
| UI-03 | Phase 28 | Pending |
| UI-04 | Phase 28 | Pending |
| LOAD-01 | Phase 29 | Pending |
| LOAD-02 | Phase 29 | Pending |
| FEED-01 | Phase 29 | Pending |
| FEED-02 | Phase 29 | Pending |
| VAL-01 | Phase 30 | Pending |
| VAL-02 | Phase 30 | Pending |
| VAL-03 | Phase 30 | Pending |
| VAL-04 | Phase 30 | Pending |
| VAL-05 | Phase 30 | Pending |
| ERR-01 | Phase 30 | Pending |
| ANLY-01 | Phase 31 | Pending |
| ANLY-02 | Phase 31 | Pending |
| ANLY-03 | Phase 31 | Pending |
| ANLY-04 | Phase 31 | Pending |
| RPRT-01 | Phase 32 | Pending |
| RPRT-02 | Phase 32 | Pending |
| RPRT-03 | Phase 32 | Pending |
| RPRT-04 | Phase 32 | Pending |
| TUTR-05 | Phase 33 | Pending |
| TUTR-06 | Phase 33 | Pending |
| TUTR-07 | Phase 33 | Pending |
| TUTR-08 | Phase 33 | Pending |
| DEMO-01 | Phase 34 | Pending |
| DEMO-02 | Phase 34 | Pending |
| ENV-01 | Phase 34 | Pending |
| DOCS-20 | Phase 34 | Pending |
| VERF-03 | Phase 34 | Pending |

**Coverage:**
- v1.6 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after v1.6 initialization*
