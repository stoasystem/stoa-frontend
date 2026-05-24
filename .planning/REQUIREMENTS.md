# Requirements: STOA Frontend v1.7 Phase 8 Staging Deployment, QA, and Early User Testing

**Defined:** 2026-05-25
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries backed only by the unified STOA backend API contract.

## v1.7 Requirements

Requirements for the eighth-stage staging and early user testing milestone. Each maps to roadmap phases after approval.

### Staging Deployment

- [ ] **DEPLOY-01**: Staging frontend deployment configuration exists for a Vite SPA.
- [ ] **DEPLOY-02**: React Router deep links refresh correctly through SPA fallback configuration.
- [ ] **DEPLOY-03**: Staging environment variables are documented, including API base URL, app env, demo shortcuts, analytics, and feedback flags.
- [ ] **DEPLOY-04**: A manual preview flow exists for local verification with `npm run build` and `npm run preview`.
- [ ] **DEPLOY-05**: Deployment documentation explains staging URL, backend API URL, redeploy process, and verification checks.

### CI and Build Gate

- [ ] **CI-01**: GitHub Actions CI runs on push to `main` and pull requests to `main`.
- [ ] **CI-02**: CI installs dependencies with `npm ci`.
- [ ] **CI-03**: CI runs lint and build/type checks before changes are considered safe to merge.

### Manual QA and Early User Testing

- [ ] **QA-01**: Manual QA checklist covers auth, student, parent, tutor, and responsive flows.
- [ ] **QA-02**: MVP demo flow documentation covers student, tutor, and parent walkthroughs with demo accounts.
- [ ] **QA-03**: Early user testing plan identifies target testers, session structure, observation goals, and feedback collection steps.
- [ ] **QA-04**: Demo data reset process is documented for local SQLite and future staging reset usage.

### E2E Testing

- [ ] **E2E-01**: Playwright is installed and configured for the Vite app.
- [ ] **E2E-02**: Package scripts exist for headless and UI Playwright runs.
- [ ] **E2E-03**: Auth E2E covers demo login and logout.
- [ ] **E2E-04**: Student chat E2E covers opening chat, sending a question, and requesting teacher help.
- [ ] **E2E-05**: Parent and tutor E2E tests cover child summary/report and tutor request workflow.
- [ ] **E2E-06**: E2E documentation explains local prerequisites, backend expectations, and how to debug failures.

### Feedback Collection

- [ ] **FEED-01**: Feedback API client and mutation hook exist.
- [ ] **FEED-02**: Feedback button and dialog are available when `VITE_ENABLE_FEEDBACK=true`.
- [ ] **FEED-03**: Feedback submissions include type, page, message, user role, and timestamp context.
- [ ] **FEED-04**: Local backend supports `POST /feedback` and persists feedback to SQLite.
- [ ] **FEED-05**: Feedback workflow documentation explains how the team reviews and converts feedback into issues.

### Bug Tracking

- [ ] **BUG-01**: GitHub bug report issue template exists with role, route, repro steps, expected/actual behavior, environment, and severity fields.
- [ ] **BUG-02**: Bug severity definitions are documented for Critical, High, Medium, and Low issues.

### Performance Baseline

- [ ] **PERF-01**: Performance baseline documentation defines Lighthouse pages and target metrics for `/login`, `/dashboard`, `/chat`, `/parent`, and `/tutor`.
- [ ] **PERF-02**: Build output and known bundle-size warning policy are documented for staging readiness.

### Security and Privacy

- [ ] **SEC-01**: Frontend security review checklist covers frontend secrets, database access, localStorage token risk, demo shortcuts, route guards, 401/403 handling, file upload limits, and dangerous HTML rendering.
- [ ] **SEC-02**: Security review documentation explicitly marks frontend checks as complementary to backend authorization and validation.
- [ ] **LEGAL-01**: Public `/privacy` placeholder page exists for testing-stage data handling notice.
- [ ] **LEGAL-02**: Public `/terms` placeholder page exists for testing-stage usage notice.

### Documentation and Readiness

- [ ] **DOCS-01**: README documents Phase 8 staging, CI, preview, E2E, feedback, privacy, and demo flow.
- [ ] **DOCS-02**: Deployment, QA, testing, demo, feedback, and security docs exist under `docs/`.
- [ ] **DOCS-03**: Production readiness plan documents remaining work before pilot launch.
- [ ] **DOCS-04**: Final verification records build, lint, E2E, backend feedback smoke, and route preview results.

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Production Launch and Operations

- **PROD-01**: Production deployment is configured and published.
- **MON-01**: Error monitoring and uptime monitoring exist.
- **OBS-01**: Production logging and alerting strategy exists.
- **SUPPORT-01**: Support inbox or CRM workflow exists.
- **LEGAL-03**: Final privacy policy and terms are legally reviewed.
- **ADMIN-03**: Admin/support view exists for feedback and operational triage.
- **ANLY-06**: Real analytics backend/dashboard exists beyond MVP event storage.
- **CI-04**: E2E runs automatically against deployed preview URLs.
- **PERF-03**: Lighthouse CI enforces performance budgets.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Production deployment | Phase 8 prepares staging and production-readiness planning only. |
| Formal legal compliance package | Phase 8 adds placeholders and checklists, not final legal documents. |
| Full monitoring platform | Early user staging needs baseline checks and feedback first. |
| Full admin feedback dashboard | Feedback can persist locally and be triaged through documented workflow. |
| Large E2E suite for every route | Phase 8 needs stable smoke coverage, not broad brittle test coverage. |
| Complex A/B testing or data warehouse | Not needed for early user staging trials. |
| Payment, subscription, or school B2B management | Outside staging/QA readiness scope. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPLOY-01 | Phase 35 | Pending |
| DEPLOY-02 | Phase 35 | Pending |
| DEPLOY-03 | Phase 35 | Pending |
| DEPLOY-04 | Phase 35 | Pending |
| DEPLOY-05 | Phase 35 | Pending |
| CI-01 | Phase 36 | Pending |
| CI-02 | Phase 36 | Pending |
| CI-03 | Phase 36 | Pending |
| QA-01 | Phase 38 | Pending |
| QA-02 | Phase 38 | Pending |
| QA-03 | Phase 38 | Pending |
| QA-04 | Phase 38 | Pending |
| E2E-01 | Phase 37 | Pending |
| E2E-02 | Phase 37 | Pending |
| E2E-03 | Phase 37 | Pending |
| E2E-04 | Phase 37 | Pending |
| E2E-05 | Phase 37 | Pending |
| E2E-06 | Phase 37 | Pending |
| FEED-01 | Phase 39 | Pending |
| FEED-02 | Phase 39 | Pending |
| FEED-03 | Phase 39 | Pending |
| FEED-04 | Phase 39 | Pending |
| FEED-05 | Phase 39 | Pending |
| BUG-01 | Phase 39 | Pending |
| BUG-02 | Phase 39 | Pending |
| PERF-01 | Phase 40 | Pending |
| PERF-02 | Phase 40 | Pending |
| SEC-01 | Phase 40 | Pending |
| SEC-02 | Phase 40 | Pending |
| LEGAL-01 | Phase 40 | Pending |
| LEGAL-02 | Phase 40 | Pending |
| DOCS-01 | Phase 40 | Pending |
| DOCS-02 | Phase 40 | Pending |
| DOCS-03 | Phase 40 | Pending |
| DOCS-04 | Phase 40 | Pending |

**Coverage:**
- v1.7 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after v1.7 roadmap creation*
