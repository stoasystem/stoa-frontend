---
gsd_state_version: 1.0
milestone: v1.22
milestone_name: "Phase 23: Launch Candidate Bug Fixing, Final Approval, and Public Demo Release"
status: in_progress
last_updated: "2026-05-26T14:44:10Z"
last_activity: 2026-05-26
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 5
  completed_plans: 3
  percent: 60
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-26)

**Core value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, stable demo backend support, documented API contracts, coherent demo flows, multilingual Swiss-market language support, natural locale-specific product copy, production-facing user language, brand-aligned visual design, cross-locale layout stability, accessibility/release-quality gates, trustworthy contact/brand details, and a clean path to future real backend integration.
**Current focus:** Milestone v1.22 Phase 23 is planning launch-candidate bug fixing, final approval closure, final smoke verification, public demo release handoff, Go/No-Go, and release confirmation.

## Current Position

Phase: 131. Public Demo Release Handoff Documents
Plan: —
Status: Phase 130 complete; ready for public demo release handoff docs
Last activity: 2026-05-26 — Phase 130 final demo rerun and smoke evidence completed

## Performance Metrics

**Velocity:**

- Total plans completed: 8
- Average duration: n/a
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 4 | 2 | n/a | n/a |
| Phase 5 | 2 | n/a | n/a |
| Phase 6 | 2 | n/a | n/a |
| Phase 7 | 2 | n/a | n/a |

**Recent Trend:**

- Last 5 plans: 05-02, 06-01, 06-02, 07-01, 07-02
- Trend: n/a

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Project initialized from the STOA Frontend Phase 1 brief.
- Workflow defaults selected autonomously: YOLO mode, coarse phases, parallel execution, commit planning docs, balanced model profile.
- Discussion is skipped for autonomous execution; roadmap and requirements are the source of truth.
- Phase 1 simplified the runtime app surface to the minimal STOA foundation page.
- Phase 2 verified install, build, lint, and preview workflows.
- Phase 3 aligned README with Phase 1 and confirmed repository handoff readiness.
- Milestone audit passed with 18/18 requirements satisfied.
- Milestone v1.1 started from the Phase 2 frontend development foundation brief.
- Phase 4 added TailwindCSS, alias support, STOA theme files, lucide-react, and shadcn-style UI primitives.
- Phase 5 added app providers, router, layouts, and route placeholder pages.
- Phase 6 added API services, Zustand stores, hooks, shared types, env example, and common components.
- Phase 7 added the acceptance page, README updates, route checks, preview check, and final verification.
- Milestone audit passed with 38/38 requirements satisfied.
- Milestone v1.2 started from the Phase 3 Core Product UI brief.
- Phase 3 product UI remains mock-data-only; backend integration, streaming, real upload, and real teacher routing are deferred.
- v1.2 roadmap continues numbering into Phase 8, Phase 9, and Phase 10.
- Phase 8 added Phase 3 chat/dashboard contracts and typed mock data.
- Phase 9 replaced the chat placeholder with mock conversations, message sending, AI thinking state, upload placeholder, and teacher-help placeholder.
- Phase 10 replaced the dashboard placeholder with mock product UI, updated README, and verified build, lint, and browser routes.
- Milestone v1.3 started from the Phase 4 Backend Integration and Real Chat API brief.
- v1.3 roadmap continues numbering into Phase 11, Phase 12, Phase 13, and Phase 14.
- Phase 4 frontend must call only the unified backend Chat API; testing-stage Codex provider details remain backend-only.
- Phase 4 uses normal HTTP response flow; streaming, WebSocket, real upload, full auth, and dashboard backend APIs are deferred.
- Phase 11 added typed chat API contracts and backend endpoint functions.
- Phase 12 added chat query keys and TanStack Query hooks.
- Phase 13 replaced `useMockChat` on `/chat` with backend query/mutation data flow and state handling.
- Phase 14 updated README backend integration docs and verified build, lint, and no-backend route behavior.
- Milestone v1.4 started from the Phase 5 Streaming Chat, File Upload, and Real Learning Workflow brief.
- Phase 5 frontend must keep model provider details backend-only while supporting fetch/SSE-style streaming from the unified STOA backend.
- Phase 5 keeps token-level streaming state local to React and uses TanStack Query for canonical conversation data.
- Phase 15 extended chat, file, and teacher-help contracts.
- Phase 16 added fetch streaming and local optimistic streaming state.
- Phase 17 added file upload service, validation, and attachment previews.
- Phase 18 upgraded `/chat` to streaming send, stop, retry, new conversation, and attachment-aware sends.
- Phase 19 added teacher-help request/status UI.
- Phase 20 updated README and verified build, lint, and local `/chat` HTTP response.
- Milestone v1.5 started from the Phase 6 Authentication, User Roles, and Parent Visibility brief.
- Phase 21 added auth contracts, auth store, auth API hooks, protected routes, role routes, and auth/error pages.
- Phase 22 added a local FastAPI + SQLite test backend with seed data and role-filtered API endpoints.
- Milestone v1.5 Phase 23 added student profile and learning-history services, hooks, pages, and student role routes.
- Phase 24 added parent dashboard, child summary, child history services/hooks/pages, and parent visibility components.
- Phase 25 added tutor help-request services/hooks/pages and status update workflow.
- Phase 26 added role-aware navigation, user menu, role badge, and admin placeholder.
- Phase 27 updated README and verified build, lint, Python syntax, SQLite seed, and Vite route serving.
- Milestone v1.6 started from the Phase 7 Product Polishing, Analytics, and MVP Readiness brief.
- Phase 28 added shared page layout primitives, skeleton foundations, UI guidelines, and mobile-aware dashboard/chat/parent/tutor layouts.
- Phase 29 added skeleton loading states and toast feedback for key actions.
- Phase 30 added validation schemas, form guardrails, file upload feedback, and the app error boundary.
- Phase 31 added analytics event tracking and local SQLite analytics storage contract.
- Phase 32 added the parent weekly report route, components, API hook, local backend endpoint, and seed report data.
- Phase 33 added tutor request filtering, request summaries, priority placeholder, teacher notes, and note tracking.
- Phase 34 added demo login shortcuts, staging env flags, README Phase 7 docs, and final verification.
- Milestone v1.7 started from the Phase 8 Staging Deployment, QA, and Early User Testing brief.
- Phase 35 added Vercel and Netlify SPA fallback configuration, feedback/staging env docs, and staging deployment guidance.
- Phase 36 added GitHub Actions CI for `npm ci`, lint, and build/type checks.
- Phase 37 added Playwright config, scripts, and E2E smoke coverage for auth, student chat, parent report, and tutor workflow.
- Phase 38 added manual QA, MVP demo flow, early user testing, and local demo reset documentation.
- Phase 39 added feedback UI, API client, mutation hook, local SQLite feedback persistence, and bug report workflow.
- Phase 40 added performance baseline, frontend security review, privacy/terms placeholders, production readiness plan, README Phase 8 docs, and final verification.
- Milestone v1.8 started from the Phase 9 Production Readiness, Monitoring, and Pilot Launch brief.
- Phase 9 keeps STOA in controlled pilot-launch scope, not large-scale public launch.
- Phase 9 treats production `VITE_*` variables as public browser configuration and keeps secrets out of frontend configuration.
- Phase 9 treats SQLite as local/demo/test infrastructure only and keeps production database selection behind backend APIs.
- Phase 9 roadmap continues numbering into Phase 41 through Phase 47.
- Phase 41 added production readiness docs, production env guidance, SQLite/database boundary, and pilot API contract freeze.
- Phase 42 added frontend error monitoring, Error Boundary reporting, logging utility, and monitoring/logging docs.
- Phase 43 upgraded analytics delivery to backend event posting with privacy-safe payload rules.
- Phase 44 added pilot onboarding and support routes, support request boundary, and support workflow docs.
- Phase 45 added basic admin usage and feedback views plus admin service/query boundaries.
- Phase 46 upgraded privacy/terms drafts, added backup/restore and privacy review docs, and added pricing/billing placeholders.
- Phase 47 added launch checklist, pilot launch plan, post-pilot feedback report template, README updates, and final verification.
- Milestone v1.10 started from the Phase 11 paid launch frontend brief.
- Phase 11 boundary confirmed: only frontend, API contract, mock/demo API, and demo/test backend support are in scope.
- Phase 56 documented the frontend-only boundary and added UTM/referral attribution plus Phase 11 feature flags.
- Phase 57 expanded billing contracts, plan catalog, subscription, usage quota, feature access, mock checkout, and locked-state UI.
- Phase 58 added parent acquisition, how-it-works, AI homework help, teacher support, school, and tutoring center landing routes.
- Phase 59 added referral service/hooks/page, invite-link copy, referral code capture, and register payload propagation.
- Phase 60 added tutor availability service/hooks/page, editor, subject selector, summary, and save mutation.
- Phase 61 added support ticket user/admin service hooks, ticket pages, admin triage, and mock status updates.
- Phase 62 added admin operational analytics contract, query hook, cards, and dashboard route.
- Phase 63 updated README and growth/billing/operations/analytics/demo docs, and verified build/lint/E2E.
- Milestone v1.11 started from the Phase 12 platform scaling and advanced learning intelligence brief.
- Phase 12 remains frontend-only: organization, school, learning intelligence, curriculum graph, diagnosis, scheduling, analytics, retention, and partnership capabilities are UI/API-contract/mock/demo surfaces only.
- Phase 64 added Phase 12 typed contracts, mock data, organization service/hooks, selector UI, and analytics event taxonomy.
- Phase 65 added organization dashboard, students, tutors, reports, and organization analytics routes.
- Phase 66 added advanced learning profile and weak-point diagnosis UI.
- Phase 67 added custom curriculum graph and topic detail UI.
- Phase 68 added tutor assignment board and schedule overview UI.
- Phase 69 added parent monthly report UI and PDF placeholder behavior.
- Phase 70 added advanced analytics and retention UI with lightweight CSS charts/tables.
- Phase 71 added partnership onboarding form and school/tutoring landing CTAs.
- Phase 72 updated docs, README, QA checklist, and Playwright route smoke coverage.
- Milestone v1.12 started from the Phase 13 information architecture, page flow, and UX optimization brief.
- Phase 13 does not add new product modules; it organizes existing routes, navigation, page hierarchy, user journeys, demo flow, mobile navigation, and frontend-only UX polish.
- v1.12 roadmap continues numbering into Phase 73 through Phase 79.
- Phase 73 added IA page inventory, route map, entry/exit audit, orphan audit, and duplicate audit.
- Phase 74 added typed route/nav config, route groups, navigation utility, and config-driven role navigation.
- Phase 75 added user journeys, Breadcrumbs, BackButton, PageActions, and return paths on deep pages.
- Phase 76 added layout and CTA guidelines.
- Phase 77 added mobile navigation guidance and mobile role navigation.
- Phase 78 added final demo flow, README Phase 13 docs, manual QA checklist, and E2E coverage.
- Phase 79 verified lint, TypeScript, build, route smoke, and E2E.
- Milestone v1.13 started from the Phase 14 demo backend stabilization, test flow completion, and backend integration readiness brief.
- Phase 14 must stabilize a simple replaceable demo backend/API contract layer while keeping formal backend development, complex database design, production auth, real payments, real AI orchestration, and AWS deployment out of scope.
- Phase 80 added demo backend scope, API contract, data, and reset-flow documentation.
- Phase 81 stabilized demo seed/reset data and npm demo backend/reset scripts.
- Phase 82 stabilized demo health, auth, student chat, message, stream, attachment, and error response behavior.
- Phase 83 stabilized teacher-help, tutor, parent report, and monthly report demo APIs.
- Phase 84 added billing, referral, support ticket, feedback/admin, and operational demo APIs.
- Phase 85 added explicit frontend API mode/base URL/MSW configuration and gated demo fallback behavior.
- Phase 86 added real backend readiness, AWS readiness, demo backend QA docs, README updates, and final verification.
- Milestone v1.14 started from the Phase 15 homepage redesign, onboarding flow, and premium UI refinement brief.
- Phase 15 keeps STOA focused on first impression, role onboarding, AI-first chat, and premium UI quality without expanding into production backend or real verification systems.
- Phase 87 redesigned the homepage, navigation, premium theme, and learning-flow story.
- Phase 88 added onboarding contracts, tutor credential upload service, and demo backend register/upload support.
- Phase 89 added multi-step student, parent, and tutor registration without public admin signup.
- Phase 90 moved teacher escalation into inline AI response feedback and refined chat empty/input copy.
- Phase 91 updated README, demo docs, API contract, QA checklist, and verified TypeScript, backend import/reset, endpoint smoke checks, Playwright text checks, and build.
- Milestone v1.15 started from the Phase 16 multilingual language optimization and AI terminology replacement brief.
- Phase 16 keeps product functionality stable while adding English, German, French, and Italian language support, replacing user-visible AI-heavy terminology with Learning Assistant and professional teacher support language, and validating multilingual layout.
- Phase 16 research confirmed `i18next` plus `react-i18next`, namespace locale files, browser-local `stoa_language` persistence, and root `html lang` updates as the recommended implementation path.
- Milestone v1.16 started from the Phase 17 locale-specific copywriting, responsive typography, and multilingual UI refinement brief.
- Phase 17 keeps product functionality stable while refining EN/DE/FR/IT copy quality, title structure, layout fit, terminology cleanup, visual QA, and handoff documentation.
- v1.16 roadmap continues numbering into Phase 98 through Phase 102.
- Phase 98 added Phase 17 locale copy rules, German/French/Italian copy rules, glossary/style-guide updates, translation QA additions, and scope boundaries.
- Phase 99 added typed locale layout hints, optional `HomeHero` `titleLines` support, locale-aware hero width/action classes, and scoped stacked-title CSS.
- Phase 100 rewrote P0 EN/DE/FR/IT homepage, auth, chat, parent, tutor, pricing, billing, and support copy; localized billing plan display text; and removed banned user-facing terminology from audited source paths.
- Phase 101 added targeted responsive wrapping/min-width safeguards and verified 36 route/locale/viewport combinations with no overflow after fixing French mobile homepage overflow.
- Phase 102 added copy and visual QA documentation, README Phase 17 handoff guidance, final terminology/build evidence, and a mobile tutor dashboard overflow fix. Final visual QA checked 200 route/locale/viewport combinations with no failures.
- Milestone v1.17 started from the Phase 18 production-facing cleanup, stability hardening, and demo artifact removal brief.
- Phase 103 created the production-facing copy audit, demo artifact removal checklist, and stability hardening checklist; it classified source matches so later cleanup can gate rendered UI without deleting developer/demo infrastructure.
- Phase 104 added semantic environment visibility flags, demo navigation and route guards, checkout preview gating, login demo-account gating, and a development-only internal debug panel.
- Phase 105 added display-label and user-facing error boundaries, localized status labels, and cleaned rendered copy across auth, billing, pricing, home, admin, support, referral, organization, learning, parent, and tutor surfaces.
- Phase 106 added handler-level pending guards, reset-on-success form behavior, support/billing empty states, and safer chat/support error messages.
- Phase 107 updated README and QA evidence, ran production-facing copy/raw-status scans, verified build, and confirmed the Vite dev server starts.
- Milestone integration audit found late production-facing copy leaks; commit `159edeb` fixed admin diagnostics, support/billing operational copy, checkout plan labels, register/chat/file-upload error paths, and chat fallback response copy before v1.17 archival.
- Milestone v1.17 audit passed with 43/43 requirements satisfied and no remaining Phase 18 blockers.
- Phase 113 documented the company homepage German style reference in read-only mode and recorded the pre-existing `/Users/zhdeng/newweb/img/team/.DS_Store` modification as external to Phase 20.
- Phase 114 added English copy rules, updated German/French/Italian rules, and created the Phase 20 cross-locale copy review matrix.
- Phase 115 refined EN/DE/FR/IT homepage, register, chat, parent, pricing/billing, support, and shared CTA copy; locale JSON validation passed.
- Phase 116 added locale CTA fit hints, short mobile CTA labels, German hero hyphenation, and verified `npm run build`.
- Phase 117 added cross-locale visual QA documentation, updated README, verified `npm install`, dev server startup, a 32-combination browser smoke, `npm run build`, and unchanged `/Users/zhdeng/newweb` source status.
- Milestone v1.20 started as Phase 21, focused on accessibility, cross-browser QA, brand detail integration, contact form adaptation, and release quality gates.
- Phase 118 documented homepage footer/contact/logo/contact-form details from `/Users/zhdeng/newweb` in read-only mode and confirmed only the pre-existing `.DS_Store` source status remains.
- Phase 119 integrated localized footer contact details, token-based STOA logo, `/contact`, accessible contact form, contact API client/hook, and local backend `/contact/requests` contract.
- Phase 120 added focus-visible coverage, role-selection state, login/register/support/chat alert wiring, chat textarea labels, chat log semantics, and accessibility documentation.
- Phase 121 configured deterministic Playwright demo QA mode, refreshed stale E2E assertions, verified 12/12 E2E passing, and documented cross-browser, mobile, visual-regression, and performance QA.
- Phase 122 added release quality gate and final pre-launch checklist, updated README, verified build and E2E, and confirmed `/Users/zhdeng/newweb` source status was unchanged.
- Milestone v1.21 started as Phase 22, focused on final demo packaging, stakeholder review, final copy/design/translation/API locks, release notes, known issues, launch-candidate approval, final demo run, README handoff, and release branch preparation.
- Phase 22 research confirmed no new dependencies are needed and the milestone should remain documentation, verification, and process-oriented unless a blocker bug prevents demo or launch-candidate readiness.
- Phase 123 created the final demo package and audience scripts.
- Phase 124 locked demo accounts, demo reset expectations, and final demo API contract.
- Phase 125 created stakeholder review and final copy/design/translation/bug locks.
- Phase 126 created release notes, known issues, next-stage backlog, and launch-candidate approval checklist.
- Phase 127 recorded final demo run evidence, updated README, aligned demo backend npm scripts to the local venv, and verified install, reset, backend startup, dev server, lint, build, and core API smoke.

### Pending Todos

- External stakeholder review and launch-candidate approval sign-off remain pending release gates.
- Phase 23 should handle launch-candidate bug fixes, final approval changes, public demo release preparation, deployment handoff, demo monitoring, and first external presentation support.
- Phase 128 recorded final approval changes and launch-candidate bug triage in `docs/release/final-approval-changes.md`; Phase 129 may only verify/finalize the approved P1/P2 release-blocker fixes.
- Phase 129 verified FAC-001 through FAC-005, preserved copy/design/translation/demo API locks, and recorded evidence in `docs/release/phase-23-lock-preservation.md`.
- Phase 130 reran the public demo candidate and recorded passing API, multilingual, responsive, accessibility, and build evidence in `docs/release/public-demo-final-run.md`.

### Quick Tasks Completed

| Date | Task | Artifact |
|------|------|----------|
| 2026-05-25 | Current project and demo guide | `docs/demo/current-project-demo-guide.md` |
| 2026-05-25 | Remove homepage foundation status card | `src/pages/home/HomePage.tsx` |
| 2026-05-25 | Add student and teacher homepage navigation | `src/layouts/MarketingLayout.tsx` |
| 2026-05-25 | Fix Start Learning CTA contrast | `src/styles/premium-theme.css` |
| 2026-05-25 | Fix primary button contrast across landing pages | `src/components/ui/button.tsx` |
| 2026-05-25 | Remove phase copy from user-facing UI | `src/components/pricing/PricingFAQ.tsx` |
| 2026-05-25 | Polish pricing user copy | `src/pages/pricing/PricingPage.tsx` |
| 2026-05-25 | Remove login test account prefill | `src/components/auth/LoginForm.tsx` |
| 2026-05-25 | Add public page navigation | `src/layouts/MarketingLayout.tsx` |
| 2026-05-25 | Fix homepage bottom CTA contrast | `src/components/home/HomeCTASection.tsx` |
| 2026-05-25 | Add marketing visuals | `src/components/home/HomeLearningFlow.tsx` |
| 2026-05-25 | Fix parent growth visual | `src/components/landing/ParentHero.tsx` |
| 2026-05-25 | Fix image text matches | `src/components/landing/ParentHero.tsx` |
| 2026-05-25 | Polish public title typography | `src/styles/premium-theme.css` |
| 2026-05-25 | Fix Vite large chunk build warning | `vite.config.ts` |

### Blockers/Concerns

None currently.

### Verification Notes

- `npm run build` passed for v1.10.
- `npm run lint` passed for v1.10.
- `npm run test:e2e` passed for v1.10 with 6/6 Playwright tests after sandbox escalation for local Vite binding.
- `npm run lint` passed for v1.11.
- `npm run build` passed for v1.11.
- `npm run test:e2e` passed for v1.11 with 8/8 Playwright tests after sandbox escalation for local Vite binding.
- `npm run lint` passed for v1.12.
- `npx tsc -b --pretty false` passed for v1.12.
- `npm run build` passed for v1.12 with Vite's existing large chunk warning.
- `npm run test:e2e` passed for v1.12 with 12/12 Playwright tests after sandbox escalation for local Vite binding and Chromium.
- Local route smoke returned HTTP 200 for `/`, `/dashboard`, and `/admin`.
- Quick task `polish-title-typography`: `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, and Playwright computed-style checks passed for `/`, `/for-parents`, `/pricing`, `/teacher-support`, `/login?next=/chat`, and `/register`.
- First sandboxed E2E attempt failed with `listen EPERM` on `127.0.0.1:5173`; rerunning with approved escalation resolved the environment limitation.
- Production build still emits Vite's existing large chunk warning.
- `python3 -m py_compile backend/app/*.py` passed for v1.13.
- `cd backend && PYTHONPATH=. python3 -m app.reset_demo_data` passed for v1.13.
- Phase 14 backend TestClient smoke passed with `backend/.venv/bin/python`.
- `npx tsc -b --pretty false` passed for v1.13.
- `npm run lint` passed for v1.13.
- `npm run build` passed for v1.13 with Vite's existing large chunk warning and a Node deprecation warning.
- `npx tsc -b --pretty false` passed for v1.14.
- Primary button contrast quick fix passed `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, and Playwright computed-style checks for `/for-parents` `View pricing`.
- User-facing phase copy cleanup passed `rg "Phase 11|phase 11" src -n`, `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, and Playwright pricing text checks.
- Pricing user-copy polish passed developer-term search, `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, and Playwright pricing text checks.
- Login prefill cleanup passed `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, and Playwright input-value checks for `/login?next=/chat`.
- Public page navigation cleanup passed `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, and Playwright nav-count checks across public pages.
- Homepage bottom CTA contrast fix passed `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, and Playwright computed-style checks for all homepage `Start Learning` buttons.
- Marketing visual pass added image-backed sections to homepage, parent, teacher support, and pricing pages; passed `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, and Playwright image coverage checks.
- Parent growth visual fix passed `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, and Playwright `/for-parents` image/copy checks.
- Image/text matching audit replaced mismatched parent/pricing visuals and passed `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, and Playwright screenshot checks.
- `python3 -m py_compile backend/app/*.py` passed for v1.14.
- `cd backend && PYTHONPATH=. .venv/bin/python -c "from app.main import app; print(app.title)"` passed for v1.14.
- Vite chunk warning quick fix passed `npm run build` without the large chunk warning; largest JS chunks are `index` 279.19 kB and `vendor-react` 194.29 kB. `npm run lint` also passed.
- `cd backend && PYTHONPATH=. .venv/bin/python -m app.reset_demo_data` passed for v1.14.
- Demo backend smoke checks passed for `/health`, student `POST /auth/register`, and `POST /files/tutor-credentials`.
- Playwright text checks passed for homepage old-card removal, registration role buttons, and login create-account path after sandbox escalation for Chromium.
- `npm run build` passed for v1.14 with Vite's existing large chunk warning and a Node deprecation warning.
- `npm run build` passed for v1.8.
- `npm run lint` passed for v1.8.
- `python3 -m py_compile backend/app/*.py` passed for v1.8.
- `PYTHONPATH=. python3 -m app.reset_demo_data` passed for v1.8.
- Local FastAPI backend started with `backend/.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000` after sandbox escalation.
- `npm run test:e2e` passed for v1.8 with 4/4 Playwright smoke tests after sandbox escalation for local Vite binding.
- `npm run build` passed for v1.7.
- `npm run lint` passed for v1.7.
- `npm run test:e2e` passed for v1.7 with 4/4 Playwright smoke tests.
- `python3 -m py_compile backend/app/*.py` passed for v1.7.
- `python -m app.reset_demo_data` passed for v1.7 and recreated the local SQLite demo data.
- FastAPI TestClient feedback smoke passed for `POST /feedback`.
- E2E surfaced and drove fixes for local backend CORS, protected-route token hydration, and missing student-facing teacher-help backend endpoints.
- Vite dev server returned HTTP 200 for `/chat`.
- In-app Browser plugin was unavailable for visual verification in this session.
- In-app browser route check for `/chat` passed against a local mock backend for list/detail/send-message/teacher-help.
- In-app browser route check for `/chat` passed in no-backend mode by rendering `Failed to load conversations.`
- Code review findings for empty-state create flow, stale active ID handling, and happy-path coverage were addressed.
- Real FastAPI backend smoke testing remains once the backend service is available.
- `python3 -m py_compile backend/app/*.py` passed.
- `PYTHONPATH=. python3 -m app.seed` passed and created required SQLite tables plus student/parent/tutor/admin seed users.
- Vite dev server returned HTTP 200 for `/login`.
- Full FastAPI runtime smoke testing requires installing `backend/requirements.txt`.
- `python3 -m py_compile backend/app/*.py` passed for v1.6.
- `python3 -m app.seed` passed from `backend/` for v1.6.
- Vite route smoke returned HTTP 200 for `/login`, `/chat`, `/parent/children/user-student/report`, and `/tutor/requests/teacher-request-1`.
- FastAPI TestClient smoke passed for parent login/report, tutor login/request list/note creation, and analytics event creation after installing backend dependencies in ignored local venv.

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Product | Real login, real AI chat behavior, AI streaming, real file upload, teacher routing, parent/tutor dashboards, payments, backend integration, and deployment | Deferred to later milestones | v1.2 initialization |
| Product | Dashboard backend APIs, full auth enforcement, parent/tutor dashboards, production deployment, advanced AI partial-response retry, backend generation cancel endpoint, and OCR/PDF parsing progress UI | Deferred to later milestones | v1.4 completion |

## Session Continuity

Last session: 2026-05-25
Stopped at: v1.16 roadmap created and ready for Phase 98 planning
Resume file: None

## Operator Next Steps

- Start the next milestone with /gsd-new-milestone
