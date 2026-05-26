# Milestones

## v1.30 Phase 32: Cross-Locale Language QA, Copy Accuracy Review, and Development Artifact Audit (Shipped: 2026-05-27)

**Phases completed:** 6 phases, 6 plans, 0 tasks
**Audit:** `docs/language/final-language-qa-report.md`

### Delivered

- Global four-language copy audit matrix.
- English, German, French, and Italian final review docs.
- Development artifact audit and user-facing cleanup checklist.
- Product-safe replacements for visible Practice demo wording, billing mock/preview wording, legacy TODO route stubs, homepage prompt wording, and abrupt Chat state copy.
- `AIResponseFeedback` component renamed to `LearningResponseFeedback`.
- Locale key parity cleanup for homepage `hero.titleLines`.
- README Phase 32 handoff and planning artifacts.

### Verification

- `npm run build`: passed.
- Locale key parity: passed across English, German, French, and Italian.
- French apostrophe scan: passed.
- High-risk term scan: passed with only the expected internal sanitizer blocklist hit.
- Browser smoke: passed for 184 route/locale/viewport checks across public, student, parent, tutor, billing, Practice, Chat, Q&A, Contact, Register, Pricing, and Footer-adjacent surfaces.

---

## v1.28 Phase 30: Final Demo Curriculum Packaging, External Testing, and Product Story Refinement (Shipped: 2026-05-26)

**Phases completed:** 6 phases, 6 plans, 0 tasks
**Audit:** `.planning/milestones/v1.28-MILESTONE-AUDIT.md`
**Known deferred items at close:** 21 unrelated open debug/quick artifacts acknowledged in `.planning/STATE.md`.

### Delivered

- Final equation demo curriculum package for the lower-secondary Mathematics Practice Path.
- Product story statements and 3-minute, 10-minute, and 15-minute demo scripts.
- Student, parent, tutor, stakeholder, and internal reviewer external testing materials.
- Structured feedback form, role-specific feedback questions, severity model, and evaluation guidance.
- Parent value framing and learning report integration guidance for Practice plus Learning Chat activity.
- Future curriculum requirements, future backend handoff requirements, and Phase 31 follow-up backlog.
- README Phase 30 guidance, final demo story QA, handoff notes, and build verification.

### Verification

- `npm run build`: passed with the existing Node `DEP0205` deprecation warning from tooling.
- `gsd-sdk query roadmap.analyze`: 6/6 phases complete, 6/6 plans, 100% progress.
- Milestone audit: passed with 33/33 requirements satisfied and no critical gaps.

---

## v1.27 Phase 29: Practice Path Interaction Refinement, Learning Platform Entry Flow, and Site Layout Reorganization (Shipped: 2026-05-26)

**Phases completed:** 6 phases, 6 plans, 0 tasks
**Audit:** Phase 29 completed through autonomous build and browser smoke evidence.

### Delivered

- Practice lesson start screen with title, practice goal, estimated time, challenge count, and start action.
- Stable challenge, feedback, hint, retry, result, and mistakes review interaction refinements.
- `PracticeChatContext` and `PracticeTeacherRequestContext` frontend/demo contracts.
- Practice-to-Learning-Chat route-state handoff from lesson, result, and mistakes review surfaces.
- Chat practice context card with topic, question, recent answer, and Back to lesson.
- Delayed teacher-support escalation with practice context.
- Student Dashboard entry framing for Continue Practice and Ask a question.
- Homepage learning-entry copy connecting practice and questions under one learning path.
- Parent Report learning activity summary combining questions, practice, mistakes, teacher support, current path, and recommendation.
- English, German, French, and Italian action labels for Practice-to-Chat, Back to lesson, Ask a question, and teacher escalation copy.
- Phase 29 docs, README guidance, QA checklist, and integrated demo flow.

### Verification

- `npm run build`: passed with the existing Node `DEP0205` deprecation warning from tooling.
- Browser smoke: passed for homepage learning entry copy, student login, Dashboard Practice/Chat entries, Practice lesson intro, correct feedback, incorrect feedback, hint, Practice-to-Chat context card, Back to lesson, parent login, and parent learning activity summary.

---

## v1.26 Phase 28: Practice Path QA, Equation Lesson Design, and Demo Scenario Polishing (Shipped: 2026-05-26)

**Phases completed:** 6 phases, 6 plans, 0 tasks
**Audit:** Phase 28 completed through autonomous build and browser smoke evidence.

### Delivered

- Practice Path demo content narrowed to Mathematics equations only.
- Equation units for linear equations in one variable, quadratic equations, and linear systems in two variables.
- Lower-secondary mock lesson set with deterministic multiple-choice, text input, ordering, and explanation challenges.
- Challenge-specific correct and incorrect feedback with directional, non-answer-revealing hints.
- Practice overview, subject path, lesson, hint, result, mistake review, and parent summary UI polish using the existing STOA premium design language.
- Teacher escalation delayed until repeated confusion or repeated hint use.
- Parent Report practice summary aligned to the equation path with supportive language.
- Phase 28 docs for equation path, unit lessons, difficulty rules, feedback/hint copy, parent copy, demo scenario, content QA, README guidance, and functional QA.

### Verification

- `npm run build`: passed with the existing Node `DEP0205` deprecation warning from tooling.
- Browser smoke in isolated mock mode: passed for student login, Practice overview, equation path, two-step equation lesson, correct feedback, incorrect feedback, hint, explanation, quadratic lesson route, system lesson route, mistakes review, parent login, and parent report equation summary.
- `npm install` was not rerun because no new dependency was added.

---

## v1.25 Phase 27: Duolingo-Style Learning Quest Integration and Practice Flow Design (Shipped: 2026-05-26)

**Phases completed:** 6 phases, 6 plans, 0 tasks

### Delivered

- Practice overview, subject path, lesson, result, and mistakes review routes.
- Practice Path mock data, typed contracts, service functions, query keys, and hooks.
- Multiple-choice, text input, ordering, explanation, feedback, hint, result, and mistake review components.
- Hint-first Learning Assistant handoff and teacher-support escalation from practice mistakes.
- Student Dashboard Continue Practice and Parent Report practice summary integration.
- English, German, French, and Italian Practice P0 copy, docs, README guidance, and browser smoke evidence.

### Verification

- `npm run build`: passed.
- Student and parent browser smoke: passed in local mock mode.

---

## v1.24 Phase 26: Learning Assistant Functional QA, Multi-Turn Behavior Testing, and Bug Fixing (Shipped: 2026-05-26)

**Phases completed:** 4 phases, 4 plans, 0 tasks
**Audit:** `.planning/milestones/v1.24-MILESTONE-AUDIT.md`

### Delivered

- Learning Assistant functional QA plan, relevance rules, multi-turn behavior rules, repair prompt rules, demo readiness threshold, and bug reproduction log.
- Eight-scenario multi-turn regression data set covering equation follow-up, quadratic factoring, speed formula, repeated confusion, unrelated subject, direct-answer request, unclear upload simulation, and above-grade question.
- Focused Python regression tests for relevance, grade scope, subject scope, multi-turn context, teacher escalation, internal-term leakage, and cheating behavior.
- Enhanced response evaluator helpers for relevance, grade scope, subject scope, direct-answer-first, internal terms, teacher escalation, length, context consistency, cheating, and high-risk behavior.
- Tightened repair prompt and improved template fallback responses for core behavior scenarios and EN/DE/FR/IT smoke coverage.
- Regression report, README Phase 26 guidance, and final QA evidence for student chat, teacher support, parent records, tutor workflow, billing, referral, support, and admin flows.

### Verification

- `npm install --ignore-scripts`: passed.
- `python3 -m unittest discover -s demo-harness/tests`: passed with 23 tests.
- Backend syntax check: passed.
- Student chat, teacher support, parent, tutor, billing, referral, support, admin, and multilingual fallback smokes: passed.
- `npm run lint`: passed.
- `npm run build`: passed with the existing Node `DEP0205` deprecation warning from tooling.

---

## v1.23 Phase 25: Local Codex Provider Integration for Complete Demo Flow (Shipped: 2026-05-26)

**Phases completed:** 4 phases, 4 plans, 0 tasks
**Audit:** `.planning/milestones/v1.23-MILESTONE-AUDIT.md`

### Delivered

- Local Python Learning Assistant harness with provider interface, Codex CLI adapter, template fallback provider, provider router, timeout handling, and provider logging boundary.
- Prompt templates and prompt builder with student profile, grade rules, subject-scope rules, no-direct-answer guidance, teacher escalation rules, and forbidden internal-term instructions.
- Response evaluator with forbidden-term, direct-answer-first, grade-scope, subject-scope, length, and guided-step checks plus repair/fallback handling.
- Eight-case demo question regression set and harness behavior tests.
- FastAPI chat endpoint integration that preserves the frontend Chat API shape and stores harness-backed assistant messages.
- Internal `GET /health/provider` readiness endpoint.
- Frontend fallback copy and demo backend copy cleanup for guided Learning Assistant language.
- Provider behavior QA documentation, backend provider handoff notes, README Phase 25 guidance, and code-review hardening.

### Verification

- `python3 -m unittest discover -s demo-harness/tests`: passed.
- Backend syntax check: passed.
- Provider health/chat TestClient smoke with `STOA_DEMO_PROVIDER=template`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Code-review findings: fixed and documented in Phase 136 review.

---

## v1.22 Phase 23: Launch Candidate Bug Fixing, Final Approval, and Public Demo Release (Shipped: 2026-05-26)

**Phases completed:** 5 phases, 5 plans, 0 tasks
**Audit:** `.planning/milestones/v1.22-MILESTONE-AUDIT.md`
**Release branch:** `release/public-demo-2026-05-26`
**Release tag:** `public-demo-release-2026-05-26`

### Delivered

- Final approval changes and launch-candidate bug triage.
- Verified homepage copy, logo, header/footer contrast, and local image-asset fixes.
- Release-lock preservation evidence.
- Public demo final run evidence.
- Deployment handoff, monitoring plan, first external presentation support, and release notes.
- Go / No-Go decision and public demo release confirmation.
- README Phase 23 public demo release guidance.

### Verification

- `npm run demo:reset`: passed.
- `npm run demo:backend`: passed.
- Backend `/health`: passed.
- Full final demo API flow: passed.
- Multilingual smoke: 24/24 checks passed.
- Responsive smoke: 30/30 checks passed.
- Accessibility smoke: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- External deployment URL remains pending release-owner hosting target.

---

## v1.21 Phase 22: Final Demo Packaging, Stakeholder Review, and Launch Candidate Preparation (Implemented: 2026-05-26)

**Phases completed:** 5 phases, 5 plans, 0 tasks
**Audit:** `.planning/v1.21-MILESTONE-AUDIT.md`

### Delivered

- Final demo package under `docs/demo/final-demo-package/`.
- Audience-specific investor, parent, student, tutor, and admin demo scripts.
- Demo account, demo data reset, known limitation, and troubleshooting docs.
- Stakeholder review checklist.
- Final bug triage, copy lock, design lock, translation lock, and demo API contract lock.
- Launch-candidate release notes, known issues list, next-stage backlog, and approval checklist.
- Final demo run result with command and API-smoke evidence.
- README Phase 22 final demo package and launch-candidate guidance.
- Demo backend npm scripts aligned to the repo-local backend virtualenv for repeatable startup.

### Verification

- `npm install --ignore-scripts`: passed.
- `npm run demo:reset`: passed.
- `npm run demo:backend`: passed after script alignment.
- Frontend dev server: HTTP 200.
- `npm run lint`: passed.
- `npm run build`: passed.
- API smoke: passed for health, four fixed demo account logins, student conversations, parent child link, tutor help requests, admin analytics, contact request, and support ticket.
- Remaining release gates: stakeholder sign-off, known issues acceptance, manual browser/device pass, manual screen-reader smoke, and native-speaker review.

---

## v1.20 Phase 21: Accessibility, Cross-Browser QA, Brand Detail Integration, and Release Quality Gate (Shipped: 2026-05-26)

**Phases completed:** 5 phases, 5 plans, 0 tasks
**Archive:** `.planning/milestones/v1.20-phases/`

### Delivered

- Read-only footer, contact, logo, and contact-form detail study from `/Users/zhdeng/newweb`, with the source project preserved.
- Adapted learning-platform footer, STOA logo component, contact information, legal/contact links, and localized contact page.
- Contact form frontend/demo API contract for `/contact/requests`, with pending, success, error, duplicate-submit, and retry behavior.
- English, German, French, and Italian footer/contact labels and supporting copy.
- Accessibility, keyboard navigation, screen-reader, and color-contrast documentation for P0 surfaces.
- Cross-browser, mobile-device, visual-regression, performance sanity, release-quality gate, final pre-launch checklist, and README handoff documentation.

### Verification

- Build: passed.
- E2E smoke: passed with deterministic Playwright demo QA mode.
- Accessibility/keyboard/screen-reader/contrast docs: completed for feasible local coverage.
- Cross-browser/mobile/visual/performance QA docs: completed with exact limitations recorded where local coverage was reduced.
- Source safety: `/Users/zhdeng/newweb` was not modified by Phase 21.
- Remaining handoff gaps: final demo packaging, stakeholder review, launch-candidate release notes, known issues, approval checklist, final demo run, and release branch preparation.

---

## v1.19 Phase 20: Cross-Locale Copy Refinement, German Style Alignment, and Layout Adaptation (Shipped: 2026-05-26)

**Phases completed:** 5 phases, 5 plans, 0 tasks
**Commits:** Phase 20 commits from German style reference through final QA handoff.

### Delivered

- Read-only German writing style study from `/Users/zhdeng/newweb`, with the pre-existing `M img/team/.DS_Store` source status recorded and preserved.
- German copy reference documenting headline rhythm, CTA style, education vocabulary, tone, and what not to copy from the company homepage.
- English, German, French, and Italian copy rules for Phase 20.
- Cross-locale copy review matrix that allows non-literal structures while requiring meaning, tone, and UI fit.
- Refined EN/DE/FR/IT copy for homepage, register/auth, chat, parent report, pricing, billing, support, and shared CTA labels.
- Reduced German compound-heavy phrasing, improved French apostrophe-sensitive copy, and added Italian-friendly CTA treatment.
- Locale layout hints for mobile-short CTA labels, wider CTA buttons, and German hero hyphenation.
- Cross-locale visual QA documentation and README Phase 20 handoff guidance.

### Verification

- Install: passed.
- Dev server: started successfully at `http://127.0.0.1:5173/` after sandbox escalation.
- Build: passed.
- Browser smoke: 32 route/locale/viewport combinations checked with no page-level horizontal overflow.
- Locale JSON parse: passed.
- Targeted terminology scan: passed.
- Source safety: `/Users/zhdeng/newweb` was not modified by Phase 20; it still showed the pre-existing `M img/team/.DS_Store` change.
- Remaining handoff gaps: native-speaker review, legal-sensitive translation review, authenticated full-route visual regression, accessibility, cross-browser QA, performance sanity, and release quality gate.

---

## v1.18 Phase 19: Brand-Aligned Visual Refinement with Main Website Design Translation (Shipped: 2026-05-26)

**Phases completed:** 5 phases, 5 plans, 0 tasks
**Commit:** `849c439 Align learning platform visuals with STOA brand language`

### Delivered

- Read-only design-language study of `/Users/zhdeng/newweb`, with the source project preserved and not modified by STOA frontend work.
- Phase 19 design translation docs for the company homepage style and the learning-platform adaptation boundary.
- Derived STOA brand tokens and platform theme styling for burgundy, charcoal, warm paper, card surfaces, borders, shadows, image overlays, and editorial public/auth/report treatments.
- Shared visual refinement for buttons, cards, badges, inputs, textareas, app/navigation headers, chat bubbles, dashboard cards, pricing cards, billing cards, and parent report surfaces.
- Homepage, login, register/onboarding, chat, dashboard, parent report, pricing, and billing visual alignment while preserving app usability and product independence.
- Phase 109 UI-SPEC, UI-SPEC verification, Phase 112 UI review, and remediation of off-contract color, typography, and copy findings.
- Visual compatibility QA screenshots for homepage, register mobile, pricing, and protected chat auth fallback.
- README Phase 19 documentation and pushed GitHub commit.

### Verification

- Build: passed.
- Lint: passed.
- Install: passed.
- Dev server: started successfully at `http://127.0.0.1:5173/` for visual QA.
- Playwright screenshots: captured for homepage, register mobile, pricing, and `/chat` auth fallback.
- Source safety: `/Users/zhdeng/newweb` was not modified by Phase 19; it still showed the pre-existing `M img/team/.DS_Store` change.
- Remaining handoff gaps: native cross-locale copy polish, German style alignment, full authenticated route visual QA, accessibility, cross-browser QA, performance sanity, and release quality gate.

---

## v1.17 Phase 18: Production-Facing Cleanup, Stability Hardening, and Demo Artifact Removal (Shipped: 2026-05-26)

**Phases completed:** 5 phases, 5 plans, 0 tasks
**Audit:** `.planning/milestones/v1.17-MILESTONE-AUDIT.md`

### Delivered

- Production-facing copy audit, demo artifact removal checklist, and stability hardening checklist for Phase 18.
- Environment guard helpers for demo accounts, demo badges, demo route surfaces, checkout previews, and internal debug visibility.
- Login, navigation, checkout, and demo-only route gating so normal users do not see development/demo surfaces by default.
- Product-safe copy cleanup across auth/register, chat, parent, tutor, pricing, billing, support, admin, and related P0/P1 surfaces.
- Display label and user-facing error helpers that prevent raw internal statuses, raw plan IDs, provider/model/backend terms, and unsafe API errors from rendering.
- Duplicate-submit guards and safer loading/empty/error states for key auth, chat, support, tutor, billing, and checkout flows.
- README and QA evidence documenting production-facing cleanup, environment guards, state hardening, and demo-backend boundaries.
- Integration audit closure for late leaks in admin diagnostics, support/billing copy, checkout plan labels, register/chat/file-upload errors, and chat fallback copy.

### Verification

- Requirements: 43/43 implemented.
- Phases: 5/5 implemented.
- Milestone integration audit: passed after closure fixes.
- Build: passed.
- Dev server: started successfully at `http://127.0.0.1:5173/` after sandbox escalation.
- Remaining handoff gaps: accessibility, keyboard navigation, screen reader behavior, color contrast, cross-browser QA, visual regression, mobile QA, performance sanity, and final release quality gate for Phase 19.

---

## v1.16 Phase 17: Locale-Specific Copywriting, Responsive Typography, and Multilingual UI Refinement (Shipped: 2026-05-25)

**Phases completed:** 5 phases, 5 plans, 0 tasks
**Audit:** `.planning/milestones/v1.16-MILESTONE-AUDIT.md`

### Delivered

- Locale-specific copywriting rules for English, German, French, and Italian.
- German, French, and Italian language-specific copy rules for headline rhythm, CTA tone, sentence length, punctuation, and UI fit.
- Rewritten four-language P0 copy for homepage, registration, chat, parent, tutor, pricing, billing, support, and shared states.
- `HomeHero` support for locale-specific `titleLines`, plus typed `localeLayout` hints for long-text UI handling.
- Stacked German homepage hero title: `Lernen. Fragen. Verstehen.`
- Targeted responsive wrapping and `min-w-0` safeguards across hero, navigation, pricing, billing, chat, and tutor surfaces.
- Copy review matrix and visual QA by locale documentation.
- README Phase 17 guidance for natural localized copy, terminology warnings, hero examples, and handoff gaps.

### Verification

- Requirements: 43/43 implemented.
- Phases: 5/5 implemented.
- TypeScript build check: passed.
- Build: passed.
- Terminology grep: passed with no banned user-facing P0 copy matches.
- Visual QA: passed for 200 route/locale/viewport combinations.
- Remaining handoff gaps: native-speaker review, legal-sensitive translation review, and reusable visual-regression automation for Phase 18.

---

## v1.14 Phase 15: Homepage Redesign, Onboarding Flow, and Premium UI Refinement (Implemented: 2026-05-25)

**Phases completed:** 5 phases, 5 plans, 0 tasks
**Audit:** `.planning/v1.14-MILESTONE-AUDIT.md`

### Delivered

- Premium magazine-style STOA homepage with a clear student-first `Start Learning` CTA.
- Marketing navigation that preserves parent/tutor/pricing/login access while making student learning the primary path.
- Sequential homepage learning flow replacing the old `AI Support`, `Teacher Backup`, and `Parent Visibility` parallel-card model.
- Premium visual theme direction using deep navy, warm ivory, muted sage, soft gold accents, and subtle CSS transitions.
- Role-based registration for student, parent, and tutor, excluding public admin registration.
- Student onboarding fields for age, school, grade, school system, subjects, parent name, and parent email.
- Parent onboarding fields for child profile and subjects needing help.
- Tutor onboarding fields for subjects, education background, teaching experience, introduction, and mock credential upload.
- Demo backend support for role-specific register payloads, `parentLinked`, `verificationStatus: pending_review`, and tutor credential mock upload.
- AI-first chat copy with direct homework question entry and inline `Ask a human tutor` escalation below assistant responses.
- Phase 15 README, demo flow, QA checklist, and demo API contract updates.

### Verification

- Requirements: 29/29 implemented.
- Phases: 5/5 implemented.
- TypeScript build check: passed.
- Python syntax check: passed.
- Demo backend import check: passed with `backend/.venv/bin/python`.
- Demo reset: passed.
- Demo backend smoke: passed for health, student register, and tutor credential upload.
- Playwright text checks: passed for homepage, register, and login.
- Build: passed.
- Remaining warnings: Vite's existing large chunk warning and a Node deprecation warning.

---

## v1.13 Phase 14: Demo Backend Stabilization, Test Flow Completion, and Backend Integration Readiness (Implemented: 2026-05-25)

**Phases completed:** 7 phases, 7 plans, 0 tasks
**Audit:** `.planning/v1.13-MILESTONE-AUDIT.md`

### Delivered

- Demo backend scope, API contract, demo data, and reset-flow documentation.
- Fixed demo seed data for student, parent, tutor, and admin accounts.
- Demo reset command and npm scripts for backend startup/reset.
- Standard demo backend health response and `{ message, code }` error format.
- Auth, student chat, deterministic assistant answer, mock streaming, and attachment metadata behavior.
- Teacher-help, tutor request handling, parent summary/history/weekly/monthly report demo APIs.
- Billing plans/subscription/usage/feature access/mock checkout, referral, support ticket, feedback/admin, and admin operational demo APIs.
- Frontend API mode configuration for mock, demo, staging, and production.
- Demo fallback gating so staging/production examples do not silently use mock data.
- Real backend readiness, AWS readiness, demo backend QA docs, and README Phase 14 workflow.

### Verification

- Requirements: 48/48 implemented.
- Phases: 7/7 implemented.
- Python syntax check: passed.
- Demo reset: passed.
- Backend TestClient smoke: passed.
- TypeScript build check: passed.
- Lint: passed.
- Build: passed.
- Remaining warnings: Vite's existing large chunk warning and a Node deprecation warning.

---

## v1.12 Phase 13: Information Architecture, Page Flow, and UX Optimization (Implemented: 2026-05-25)

**Phases completed:** 7 phases, 7 plans, 0 tasks
**Audit:** `.planning/v1.12-MILESTONE-AUDIT.md`

### Delivered

- Complete frontend page inventory, route map, page entry/exit audit, orphan page audit, and duplicate/overlap audit.
- Role-based navigation architecture for student, parent, tutor, admin, and organization modes.
- Typed route and navigation configuration with route groups and role-filtered navigation helpers.
- Config-driven desktop sidebar and mobile primary navigation in `AppLayout`.
- Breadcrumbs, BackButton, and PageActions shared components.
- Breadcrumb/back/page action treatment for key parent, tutor, support, admin, and learning-intelligence detail pages.
- UX layout, CTA hierarchy, and mobile navigation guidelines.
- Final demo flow documentation and Phase 13 README/manual QA updates.
- Phase 13 E2E coverage for focused role navigation, hidden demo routes, breadcrumbs/back actions, and organization-mode navigation.

### Verification

- Requirements: 63/63 implemented.
- Phases: 7/7 implemented.
- Lint: passed.
- TypeScript build check: passed.
- Build: passed.
- Playwright E2E: passed, 12/12 tests.
- Remaining warning: Vite's existing large chunk warning.

---

## v1.9 Phase 10: Pilot Iteration, Payment Preparation, and Production Launch (Implemented: 2026-05-25)

**Phases completed:** 8 phases, 8 plans, 0 tasks
**Audit:** `.planning/v1.9-MILESTONE-AUDIT.md`

### Delivered

- Pilot review documentation and critical bug sprint launch rules.
- Student dashboard next-action and continue-learning cards.
- Parent value explanation and upgrade prompt cards on dashboard/report flows.
- Tutor operations improvements with stats contract, request context clarity, first-action metadata, and required resolution notes.
- Pricing validation page with four launch plans, feature comparison, conversion analytics, and pricing/subscription docs.
- Billing service/hooks, subscription UI, feature flags, and virtual checkout success/cancel flow for demos and E2E before real payment backend integration.
- Admin launch operations routes for help requests and contract shells for users, support, billing interest, and system status.
- Launch-ready privacy/terms drafts, registration consent, layout legal links, release process, rollback plan, post-launch monitoring, and launch checklist.
- README, manual QA, and Playwright E2E updates including pricing/billing/virtual checkout coverage.

### Verification

- Requirements: 62/62 implemented.
- Phases: 8/8 implemented.
- Build: passed.
- Lint: passed.
- Playwright E2E: passed, 6/6 tests.
- Code review: completed; payment flag blocker fixed.
- Remaining warning: Vite's existing large chunk warning.

---

## v1.8 Phase 9 Production Readiness, Monitoring, and Pilot Launch (Implemented: 2026-05-25)

**Phases completed:** 7 phases, 7 plans, 0 tasks
**Audit:** `.planning/v1.8-MILESTONE-AUDIT.md`

### Delivered

- Production readiness documentation with production frontend/backend URL guidance, production environment variables, SQLite-to-production database boundary, and pilot API contract freeze.
- Frontend error monitoring service, Error Boundary reporting, production-safe logger, and monitoring/logging operations docs.
- Analytics backend delivery through `POST /analytics/events` with privacy-safe payload filtering and pilot analytics documentation.
- Pilot onboarding and support routes, role-specific onboarding guidance, support request service/hook, and support workflow documentation.
- Basic admin operations routes for dashboard, usage, and feedback, with admin service/query boundaries.
- Privacy and terms pilot drafts, data privacy review, backup/restore strategy, pricing placeholder, billing placeholder, and subscription type placeholders.
- Launch checklist, pilot launch plan, post-pilot feedback report template, and README Phase 9 documentation.

### Verification

- Requirements: 49/49 implemented.
- Phases: 7/7 implemented.
- Build: passed.
- Lint: passed.
- Python syntax check: passed.
- Local SQLite demo reset: passed.
- Playwright E2E: passed, 4/4 smoke tests.

---

## v1.7 Phase 8 Staging Deployment, QA, and Early User Testing (Implemented: 2026-05-25)

**Phases completed:** 6 phases, 6 plans, 0 tasks
**Audit:** `.planning/milestones/v1.7-MILESTONE-AUDIT.md`

### Delivered

- Staging-ready SPA fallback configuration for Vercel and Netlify, plus staging environment variable guidance.
- GitHub Actions frontend CI running `npm ci`, lint, and build/type checks on push and pull request to `main`.
- Playwright E2E setup with smoke coverage for auth, student chat and teacher help, parent report, and tutor request workflow.
- Manual QA checklist, MVP demo flow, early user testing plan, and local SQLite demo reset process.
- Feedback button/dialog, feedback API client and mutation hook, local backend `POST /feedback`, and SQLite feedback persistence.
- GitHub bug report issue template with severity workflow.
- Performance baseline, frontend security review, production readiness plan, and public privacy/terms placeholders.
- README Phase 8 documentation for staging, CI, preview, E2E, feedback, legal placeholders, and demo flow.

### Verification

- Requirements: 35/35 implemented.
- Phases: 6/6 implemented.
- Build: passed.
- Lint: passed.
- Python syntax check: passed.
- Local SQLite demo reset: passed.
- FastAPI feedback smoke: passed.
- Playwright E2E: passed, 4/4 smoke tests.

---

## v1.6 Phase 7 Product Polishing, Analytics, and MVP Readiness (Implemented: 2026-05-25)

**Phases completed:** 7 phases, 7 plans, 0 tasks
**Audit:** `.planning/milestones/v1.6-MILESTONE-AUDIT.md`

### Delivered

- Shared UI guidelines, page containers, page headers, section headers, and responsive layout polish.
- Skeleton loading primitives and page-specific skeletons for chat, dashboard, parent, tutor, profile, and report flows.
- Toast notifications for auth, profile, upload, teacher-help, and tutor actions.
- Validation schemas and form guardrails for login, register, student profile, chat input, and file upload.
- Application error boundary with recovery UI.
- Analytics event tracking client, usage event contract, and local SQLite analytics event storage.
- Parent weekly report route, components, API hook, local backend endpoint, and seed report data.
- Tutor request status filtering, richer request list/detail information, teacher note UI, local note endpoint, and tracking.
- Demo login shortcuts gated by environment flags, staging env configuration, demo seed readiness, and README MVP demo flow.

### Verification

- Requirements: 31/31 implemented.
- Phases: 7/7 implemented.
- Build: passed.
- Lint: passed.
- Python syntax check: passed.
- SQLite seed: passed.
- Vite route smoke: passed for login, chat, parent report, and tutor request routes.
- FastAPI TestClient smoke: passed for parent report, tutor request/note, and analytics endpoints.

---

## v1.5 Phase 6 Authentication, User Roles, and Parent Visibility (Implemented: 2026-05-24)

**Phases completed:** 7 phases, 7 plans, 0 tasks
**Audit:** `.planning/milestones/v1.5-MILESTONE-AUDIT.md`

### Delivered

- Login, register, current-user hydration, logout, local token persistence, and 401/403 handling.
- Student, Parent, Tutor, and Admin role types, protected routes, role routes, and role-based redirects.
- Role-aware app layout navigation, user menu, role badge, and admin placeholder.
- Student profile editing and student learning-history page.
- Parent dashboard, child summary, child learning-history page, and parent-visible learning records.
- Tutor help-request dashboard, detail page, and status update workflow.
- Local FastAPI + SQLite test backend with schema, seed accounts, conversations, messages, teacher help requests, learning history, and role-filtered endpoints.
- README Phase 6 documentation for auth, roles, routes, endpoints, local SQLite backend, and seed accounts.

### Verification

- Requirements: 36/36 implemented.
- Phases: 7/7 implemented.
- Build: passed.
- Lint: passed.
- Python syntax check: passed.
- SQLite seed: passed, including required tables and four seed accounts.
- Local Vite route check: `/login` returned HTTP 200.
- Full FastAPI runtime smoke testing still requires installing `backend/requirements.txt`.

---

## v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow (Implemented: 2026-05-24)

**Phases completed:** 6 phases, 6 plans, 0 tasks
**Audit:** `.planning/milestones/v1.4-MILESTONE-AUDIT.md`

### Delivered

- Streaming chat event types and fetch-based streaming client for `POST /conversations/:conversationId/messages/stream`.
- Local streaming chat hook with optimistic student messages, assistant placeholders, chunk appending, stop generation, failed state, retry metadata, and query invalidation.
- File upload service and mutation for `POST /files`.
- PNG/JPEG/PDF upload UI with 10 MB and 3-attachment client-side limits.
- Attachment previews and attachment-aware chat sends.
- `/chat` upgraded to use streaming send flow, stop generation, retry failed user messages, and queued first-message sends after new conversation creation.
- Teacher-help request/status service and stateful teacher-help status card.
- README Phase 5 documentation for endpoints, upload limits, and backend-only model provider strategy.

### Verification

- Requirements: 37/37 implemented.
- Phases: 6/6 implemented.
- Build: passed.
- Lint: passed.
- Local `/chat` HTTP route: passed with Vite dev server returning 200.
- Browser visual check: attempted, but the Browser plugin reported the in-app browser was unavailable in this session.

---

## v1.3 Phase 4 Backend Integration and Real Chat API (Shipped: 2026-05-24)

**Phases completed:** 4 phases, 9 plans, 0 tasks
**Audit:** `.planning/milestones/v1.3-MILESTONE-AUDIT.md`

### Delivered

- Typed Phase 4 chat API contract for conversations, messages, conversation creation, and teacher-help requests.
- Chat API service functions for `/conversations`, `/conversations/:conversationId`, `/conversations/:conversationId/messages`, and `/teacher-help/request`.
- TanStack Query chat keys plus conversation, create-conversation, send-message, and teacher-help hooks.
- `/chat` switched from `useMockChat` to backend query/mutation data flow.
- Loading, error, empty, pending, send-failure, teacher-help success/error, and first-conversation states.
- README Phase 4 backend integration documentation, including FastAPI CORS and backend-only Codex testing-provider strategy.

### Verification

- Requirements: 34/34 complete.
- Phases: 4/4 complete.
- Build: passed.
- Lint: passed.
- Browser route check with local mock backend: passed for list, detail, send-message, and teacher-help.
- Browser route check without backend: passed with visible error state.

---

## v1.2 Core Product UI - Complete

**Completed:** 2026-05-24
**Audit:** `.planning/milestones/v1.2-MILESTONE-AUDIT.md`

### Delivered

- Product UI contracts for chat and student dashboard data.
- Mock conversation and dashboard data under `src/data/`.
- `/chat` product UI with conversation sidebar, active message list, student/assistant bubbles, chat input, upload placeholder, AI thinking state, delayed mock response, and teacher-help placeholder.
- `/dashboard` product UI with student stats, recent questions, weak topics, learning progress, and teacher feedback.
- README Phase 3 Core Product UI documentation.
- Browser verification for `/chat` and `/dashboard`.

### Verification

- Requirements: 27/27 complete.
- Phases: 3/3 complete.
- Build: passed.
- Lint: passed.
- Browser dev route checks: passed.

## v1.0 Frontend Foundation - Complete

**Completed:** 2026-05-24
**Audit:** `.planning/v1.0-MILESTONE-AUDIT.md`

### Delivered

- Runnable React + TypeScript + Vite foundation.
- Minimal STOA initialization page.
- Standard scaffold files, TypeScript configs, Vite HTML entry, CSS entry, and npm lockfile.
- Working `npm install`, `npm run dev`, `npm run build`, `npm run lint`, and `npm run preview` workflows.
- README handoff for local development.
- GitHub remote readiness for `https://github.com/stoasystem/stoa-frontend.git`.

### Verification

- Requirements: 18/18 complete.
- Phases: 3/3 complete.
- Build: passed.
- Lint: passed.
- Browser dev check: passed.
- Browser preview check: passed.

## v1.1 Frontend Development Foundation - Complete

**Completed:** 2026-05-24
**Audit:** `.planning/v1.1-MILESTONE-AUDIT.md`

### Delivered

- TailwindCSS Vite integration and STOA theme entry.
- shadcn-style UI primitives for the first component batch.
- React Router app routes for `/`, `/chat`, `/dashboard`, `/login`, and not-found.
- TanStack Query provider setup.
- Marketing, app, dashboard, and auth layouts.
- Axios HTTP client, API types, and chat API placeholder.
- Zustand auth/UI stores, auth hooks, shared user/chat/API types.
- Common components for logo, page shell, loading, error, and empty states.
- `.env.example`, README Phase 2 documentation, and design notes.
- Phase 2 acceptance page using Tailwind, UI primitives, router links, icons, layout, and aliases.

### Verification

- Requirements: 38/38 complete.
- Phases: 4/4 complete.
- Build: passed.
- Lint: passed.
- Browser dev route checks: passed.
- Browser preview check: passed.
