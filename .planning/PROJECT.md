# STOA Frontend

## What This Is

STOA Frontend is the React + TypeScript + Vite frontend for the STOA learning platform. The project now has a stable development foundation, visible product UI, backend-integrated student chat, authenticated role surfaces, MVP polish, local test backend support, staging deployment readiness, QA coverage, early user feedback workflow, and production-like pilot launch readiness.

The app includes a STOA core product UI with a backend-driven student chat workspace, conversation list, message flow, teacher-help request path, streaming assistant responses, homework file uploads, authenticated role boundaries, student/parent/tutor role surfaces, parent reporting, tutor workflow polish, a local SQLite-backed test backend, CI/E2E checks, staging documentation, monitoring/logging, support, privacy, backup, pricing placeholders, and pilot launch artifacts. The current product step is moving that pilot-ready product into a launch-ready early commercial frontend with pilot feedback review, critical bug resolution, core UX iteration, pricing validation, subscription preparation, a demonstrable virtual payment flow, stronger tutor/admin operations, final privacy/terms drafts, and production launch process discipline.

## Core Value

Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries backed only by the unified STOA backend API contract.

## Current Milestone: v1.9 Phase 10: Pilot Iteration, Payment Preparation, and Production Launch

**Goal:** Completed. STOA has been upgraded from a controlled pilot launch frontend into a launch-ready early commercial product frontend that can demonstrate and test pricing, billing intent, subscription state, parent conversion, tutor operations, and admin operations before real payment/backend rollout.

**Target features:**
- Pilot feedback review, analytics review, support record review, and critical bug prioritization.
- P0/P1 bug-fix sprint with QA and E2E coverage for core flows.
- Student, Parent, and Tutor UX iteration based on pilot evidence.
- Launch-ready pricing page, subscription tiers, access matrix, and parent conversion CTA.
- Billing API contract, billing service/hooks, subscription status UI, and feature flags.
- Virtual/mock checkout flow for frontend demo and testing before real backend payment integration.
- Admin usage, feedback, help-request, support, billing-interest, user, and system routes with launch-operations boundaries.
- Tutor workflow improvements including clearer request context, required resolution notes, and tutor stats.
- Launch-ready privacy policy and terms drafts with registration consent and layout/footer links.
- Release process, rollback plan, post-launch monitoring plan, launch checklist, README updates, and production launch readiness verification.

## Current State

**Latest shipped milestone:** v1.8 Phase 9 Production Readiness, Monitoring, and Pilot Launch

**Delivered product surface:**
- `/chat` mock product UI with conversation sidebar, active message list, message bubbles, chat input, upload placeholder, AI thinking state, delayed mock response, and teacher-help placeholder.
- `/chat` backend-integrated product UI with conversation list/detail queries, create-conversation, send-message, teacher-help request, and API state handling.
- `/chat` streaming product UI with optimistic student messages, streaming assistant placeholders, stop generation, failed-message retry, attachment upload/preview, attachment-aware sends, and stateful teacher-help status display.
- `/dashboard` mock student learning overview with stats, recent questions, weak topics, learning progress, and teacher feedback.
- Auth routes for login/register, current-user hydration, token persistence, logout, and 401/403 handling.
- Protected routes and role guards for student, parent, tutor, and admin surfaces.
- Student profile and learning-history pages.
- Parent dashboard, child summary, and child learning-history pages.
- Tutor help-request dashboard, detail, and status update workflow.
- Shared MVP UI polish, skeleton loading, toast feedback, validation, Error Boundary, analytics client, parent weekly report, tutor notes, demo shortcuts, staging env flags, and Phase 7 documentation.
- Local FastAPI + SQLite test backend with seed users and role-filtered API endpoints.
- Staging deployment configuration, GitHub Actions CI, Playwright E2E smoke coverage, manual QA docs, feedback collection, bug tracking, performance/security readiness docs, and privacy/terms placeholders.
- Production readiness docs, error monitoring/logging foundation, analytics backend delivery, pilot onboarding, support workflow, basic admin operations, privacy/terms pilot drafts, backup/restore strategy, pricing/billing placeholders, launch checklist, pilot plan, and post-pilot feedback template.
- Mock chat/dashboard contracts and data under `src/types/` and `src/data/`.
- README documentation for Phase 3 Core Product UI.

## Requirements

### Validated

- ✓ Git repository exists for `stoa-frontend` — existing
- ✓ React + TypeScript + Vite dependency foundation exists in `package.json` — existing
- ✓ Initial role route shell exists under `src/pages/**` — existing, but outside Phase 1 scope
- ✓ Basic Cognito/Amplify, Axios, TanStack Query, and Zustand scaffolding exists — existing, but outside Phase 1 scope
- ✓ GSD codebase map exists in `.planning/codebase/` — existing
- ✓ Developers can install, run, build, lint, preview, and inspect the minimal STOA frontend foundation — v1.0
- ✓ Frontend development foundation exists with TailwindCSS, UI primitives, routing, providers, services, stores, layouts, pages, theme notes, and docs — v1.1
- ✓ Developers can run the app and demo mock STOA chat plus student dashboard product UI — v1.2
- ✓ Developers can run the app and exercise STOA chat through the unified backend Chat API contract — v1.3
- ✓ Developers can run the app and exercise a streaming STOA chat workflow with file attachments and teacher-help status through the unified backend API contract — v1.4
- ✓ Developers can run the app with authenticated role routes, parent visibility, tutor help requests, and a SQLite-backed local test backend — v1.5
- ✓ Developers can run the app as an MVP-ready local/demo product with responsive polish, skeletons, toast feedback, validation, analytics, parent reports, tutor notes, demo data, and staging env preparation — v1.6
- ✓ Developers can run the app as a staging-ready MVP with CI, E2E smoke coverage, manual QA docs, feedback collection, bug workflow, performance/security checks, and legal placeholders — v1.7
- ✓ Developers can prepare a controlled pilot launch with production readiness docs, monitoring/logging, analytics delivery, onboarding, support, admin operations, privacy/terms drafts, backup/restore docs, pricing/billing placeholders, and pilot launch artifacts — v1.8

### Active

(None currently — v1.9 is complete. Start the next milestone for Phase 11 scope.)

### Out of Scope

- Production SSO, email verification, password reset completion, refresh-token architecture, and httpOnly cookie migration — Phase 6 uses MVP auth with local token storage.
- Complex school organization, parent invitation, and full admin management — Phase 6 keeps role surfaces minimal.
- Real multi-person teacher chat — Phase 6 supports tutor help-request list/detail/status, not live teacher chat.
- Full real payment processing and subscription enforcement — Phase 10 prepares Stripe-ready contracts and virtual checkout/demo flows before production backend payment rollout.
- Large-scale paid growth and operational scaling — Phase 10 targets first real launch and payment validation readiness, not growth-scale systems.
- Direct frontend calls to OpenAI, Claude, Gemini, DeepSeek, Codex, or any other model provider — frontend remains coupled only to STOA backend APIs.
- Production SQLite usage — SQLite is local functional-test infrastructure only; production persistence remains a backend concern.
- Full audit logging and Swiss data privacy compliance documentation — deferred until later security/compliance milestones.
- Full observability platform, SLA, and uptime alerting — Phase 9 adds monitoring foundation only.
- Complex BI dashboards and full admin analytics — Phase 7 only adds basic analytics events and usage contract.
- Full curriculum/content management — not required for MVP readiness.
- Full legal compliance package — Phase 9 adds pilot drafts and privacy review, not final legal-reviewed documents.
- Large-scale user growth, A/B testing, data warehouse, and formal support operations — deferred until later launch milestones.
- Direct frontend card handling — payment details must remain with hosted payment pages such as Stripe Checkout or virtual demo screens.
- Full admin user management, CRM, school B2B onboarding, financial reporting, and multi-tenant school organization — outside pilot launch readiness.

## Context

The project brief for Phase 10 was provided in Chinese and defines pilot feedback review, critical bug resolution, Student/Parent/Tutor UX iteration, pricing validation, payment provider selection, subscription model preparation, billing UI, parent conversion funnel, tutor/admin operations, final privacy/terms integration, release process, rollback planning, post-launch monitoring, and public launch readiness. The user clarified that before connecting a real backend payment provider, the frontend must still support demo and testing of a complete virtual payment flow so pricing and billing pages can be validated end to end.

Recommended baseline technology:
- React for long-term frontend scalability.
- TypeScript for team collaboration and safer changes.
- Vite for fast development startup and lightweight configuration.
- npm as the default package manager.
- GitHub as the shared repository host, expected at `https://github.com/stoasystem/stoa-frontend`.

Current codebase facts:
- v1.0 shipped the minimal STOA Vite app.
- v1.1 shipped TailwindCSS, shadcn-style UI primitives, routing, providers, API services, stores, layouts, common components, and documentation.
- v1.2 shipped the first mock product UI for `/chat` and `/dashboard`.
- v1.3 shipped backend-integrated `/chat` data flow using TanStack Query and Axios API services.
- v1.4 shipped the Phase 5 real learning workflow: streaming response handling, upload attachments, retry, stop generation, new conversation flow, and teacher-help status progression.
- v1.5 shipped Phase 6 authentication, protected/role routes, student profile/history, parent child visibility, tutor help-request handling, and a local SQLite-backed test backend.
- v1.6 shipped Phase 7 product polish, responsive foundations, loading/feedback systems, validation, error boundary, analytics, parent weekly report, tutor workflow notes, demo data, and staging env preparation.
- v1.7 shipped Phase 8 staging deployment configuration, CI, Playwright E2E smoke tests, manual QA and demo docs, feedback collection, bug workflow, performance/security docs, privacy/terms placeholders, and production readiness planning.
- v1.8 shipped Phase 9 production readiness docs, monitoring/logging, analytics delivery, onboarding/support, admin operations, privacy/terms drafts, backup/restore docs, pricing/billing placeholders, launch checklist, pilot plan, post-pilot feedback template, and README updates.
- v1.9 starts Phase 10 and must bridge pilot evidence into launch readiness, including a Stripe-ready billing contract and a frontend-only virtual checkout path for demos and tests before real payment backend integration.
- During the testing stage, the backend may use Codex as a temporary AI provider behind its own provider layer. The frontend must not depend on provider-specific APIs or environment variables.

## Constraints

- **Tech stack**: React, TypeScript, Vite, npm — specified by the Phase 1 project brief.
- **Runtime**: Node.js 20 LTS or newer LTS is recommended for local development.
- **Scope**: Phase 10 prepares launch readiness and early commercial validation; large growth campaigns, full CRM, school B2B onboarding, full payment enforcement, tutor payroll, complete accounting, and full compliance certification remain out of scope.
- **Model providers**: The frontend must call only the STOA backend API; Codex usage during testing belongs behind the backend provider layer.
- **Local backend**: FastAPI is expected at `http://localhost:8000` during local integration, with frontend dev server at `http://localhost:5173`.
- **Streaming**: The frontend supports SSE/fetch streaming from the backend and must not call provider-specific streaming APIs directly.
- **Uploads**: Phase 5 supports PNG, JPEG, and PDF homework uploads up to 10 MB per file and at most 3 pending attachments per send.
- **Auth token storage**: Phase 6 may use `localStorage` key `stoa_access_token`; production hardening is deferred.
- **SQLite**: SQLite is only for local functional testing behind a local backend API; the browser frontend must never read SQLite directly.
- **Permissions**: Frontend route guards are user-experience protection only; backend APIs must enforce real user and role data filtering.
- **MVP readiness**: Main student, parent, and tutor paths should be demonstrable with local seed data.
- **Analytics**: Phase 7 can log analytics locally or prepare backend contracts without committing to a third-party provider.
- **Feedback**: Phase 8 can use a simple local backend feedback endpoint and SQLite table; production support tooling remains deferred.
- **Testing**: Playwright E2E should cover core demo paths without requiring production deployment.
- **Staging**: Staging deployment config must not expose secrets, and SPA fallback must support route refreshes.
- **Production env**: `VITE_*` variables are public browser configuration and must not contain secrets.
- **Payment safety**: The frontend must not directly handle card numbers or payment secrets. Real payment collection should use backend-created hosted checkout sessions; pre-backend demos must use explicit virtual/mock checkout flows.
- **Production database**: SQLite remains local/demo/test infrastructure only; production persistence must stay behind backend APIs and should use a backend-managed production database plan.
- **Telemetry privacy**: Monitoring, analytics, logging, feedback, and support payloads must not include passwords, tokens, file contents, or full private chat content by default.
- **Pilot size**: Phase 9 targets a controlled pilot group, roughly 5-10 students, 3-5 parents, 1-3 tutors, and 1-2 weeks of testing.
- **Commercial validation**: Phase 10 can test pricing and billing intent through visible CTAs, billing interest capture, and virtual checkout completion before real payment collection is enabled.
- **Repository hygiene**: `node_modules/`, `dist/`, and local env files must not be committed.
- **Developer workflow**: The project must be usable through standard npm scripts.
- **GitHub**: The intended remote is `https://github.com/stoasystem/stoa-frontend`, but remote setup depends on repository access and should be verified before push.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use React + TypeScript + Vite | Matches the Phase 1 brief and gives a fast, maintainable frontend base | — Pending |
| Use npm | Default toolchain is simple for team members | — Pending |
| Keep Phase 1 as foundation-only | Prevents premature feature work before the repo can run and build cleanly | — Pending |
| Treat existing role/API/auth scaffolding as non-Phase-1 context | The current repo includes later-stage placeholders, but Phase 1 acceptance is only the foundation | — Pending |
| Complete v1.0 before expanding product features | Foundation commands and handoff documentation now pass, so later milestones can build on a stable base | ✓ Good |
| Continue phase numbering into v1.1 | Keeps GSD history continuous across milestones | ✓ Good |
| Use shadcn-style local UI components | Provides copyable, customizable primitives without coupling future work to opaque component packages | ✓ Good |
| Continue phase numbering into v1.2 | Keeps GSD history continuous across frontend foundation and product UI milestones | ✓ Good |
| Keep Phase 3 mock-driven | Lets the team demo the core student experience before backend contracts are ready | ✓ Good |
| Keep chat/dashboard components props-driven | Makes Phase 4 API replacement possible without rewriting UI modules | ✓ Good |
| Continue phase numbering into v1.3 | Keeps GSD history continuous; Phase 4 product work will use GSD Phase 11+ execution numbers | ✓ Good |
| Keep model-provider calls behind the backend | Lets testing use Codex now and swap providers later without frontend contract churn | — Pending |
| Use non-streaming HTTP responses for Phase 4 chat replies | Proves the backend data path before adding streaming complexity in Phase 5 | — Pending |
| Add create-conversation support in empty chat state | Prevents first-time users from hitting a dead end when the backend returns no conversations | ✓ Good |
| Use fetch for streaming chat | Browser ReadableStream handling is simpler through fetch than Axios | — Pending |
| Keep token-level streaming state local to React | Avoids high-frequency global Zustand updates and keeps canonical data in TanStack Query | — Pending |
| Treat uploaded files as backend attachment metadata | Keeps OCR/PDF parsing behind backend APIs and lets frontend send only attachment IDs | — Pending |
| Use localStorage for Phase 6 access tokens | Simple MVP token persistence is enough to validate role workflows before production auth hardening | ✓ Good |
| Add a local FastAPI + SQLite test backend | Lets frontend auth, role filtering, and learning-data workflows be tested before the formal backend is ready | ✓ Good |
| Treat frontend route guards as non-security boundaries | Prevents UI checks from replacing backend authorization and keeps data isolation enforced by APIs | ✓ Good |
| Keep Phase 7 focused on readiness instead of new product breadth | Stabilizes the core student-parent-tutor loop for demos and early trials before adding more modules | — Pending |
| Start analytics with a thin frontend client and API contract | Enables usage visibility without locking the MVP to a vendor prematurely | — Pending |
| Keep Phase 8 focused on staging and testability | Early user trials need deployment, QA, E2E, feedback, and bug workflow more than new product modules | — Pending |
| Use GitHub Actions as the first CI gate | It matches the repository host and gives immediate build/lint protection for MVP iteration | — Pending |
| Add feedback through a thin frontend/backend contract | Gives early users a direct reporting path while keeping production support systems deferred | — Pending |
| Keep Phase 9 focused on pilot readiness instead of feature breadth | Real users need monitoring, support, privacy, backup, and launch discipline before new product expansion | ✓ Good |
| Keep monitoring and analytics vendor-neutral behind service wrappers | Lets the team use Sentry, Highlight, LogRocket, PostHog, or backend endpoints later without rewriting product UI | ✓ Good |
| Treat SQLite as non-production infrastructure | Protects pilot data planning from relying on a local functional-test database | ✓ Good |
| Prepare pricing and billing as placeholders only | Supports commercial validation without adding payment complexity before pilot evidence exists | ✓ Good |
| Use Stripe Checkout as the preferred payment-provider direction for Phase 10 planning | Hosted checkout minimizes frontend PCI exposure and fits subscription validation, while the backend owns session creation and webhooks | — Pending |
| Add a virtual checkout mode before real backend payment rollout | Lets frontend developers demo and test the complete pricing-to-billing path without handling real payment data or depending on production Stripe/backend readiness | — Pending |
| Keep subscription gating advisory in the frontend | Frontend can show locked states and upgrade prompts, but backend APIs must enforce quota and access rules | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-25 for v1.9 Phase 10 milestone initialization*
