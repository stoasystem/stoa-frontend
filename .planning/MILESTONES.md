# Milestones

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
