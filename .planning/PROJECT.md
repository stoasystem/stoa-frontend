# STOA Frontend

## What This Is

STOA Frontend is the React + TypeScript + Vite frontend for the STOA learning platform. The project now has a stable development foundation, visible product UI, backend-integrated student chat, authenticated role surfaces, MVP polish, local test backend support, staging deployment readiness, QA coverage, early user feedback workflow, production-like pilot launch readiness, launch-ready commercial validation UI, early paid growth/operations demo surfaces, platform-level organization/learning-intelligence demos, and coherent role-based information architecture.

The app includes a STOA core product UI with a backend-driven student chat workspace, conversation list, message flow, teacher-help request path, streaming assistant responses, homework file uploads, authenticated role boundaries, student/parent/tutor role surfaces, parent reporting, tutor workflow polish, a local SQLite-backed test backend, CI/E2E checks, staging documentation, monitoring/logging, support, privacy, backup, pricing validation, virtual checkout, launch artifacts, parent acquisition pages, referral/invitation flow, usage quota display, feature gating UI, tutor availability, support ticket UI, admin operational analytics, UTM tracking, clearer demo-backend boundaries, organization dashboards, advanced learning profile pages, curriculum graph UI, weak-point diagnosis UI, parent monthly reporting, retention surfaces, partnership onboarding, route inventory, role-based navigation, breadcrumbs, demo-flow documentation, stable demo backend APIs, API mode configuration, and backend integration readiness documentation.

## Core Value

Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, stable demo backend support, documented API contracts, coherent demo flows, and a clean path to future real backend integration.

## Current Milestone: v1.16 Phase 17: Locale-Specific Copywriting, Responsive Typography, and Multilingual UI Refinement

**Goal:** Refine STOA's English, German, French, and Italian product copy and responsive layouts so each locale reads naturally, preserves the same education-centered meaning, and remains visually stable without adding new business features.

**Target features:**
- Locale-specific copywriting rules that explicitly allow English, German, French, and Italian to use different sentence structures while preserving meaning, tone, and brand.
- Rewritten homepage hero titles, subtitles, CTAs, and core section copy for all four languages, including stacked German hero title support.
- Refined copy across P0 surfaces: homepage, register/onboarding, chat, parent dashboard/report, tutor workflow, pricing, billing, and support/error/toast states.
- Locale-specific typography and layout hints for hero titles, buttons, cards, navbar labels, pricing cards, and long text handling.
- German, French, and Italian copy rules covering long compounds, sentence length, CTA tone, punctuation, and UI fit.
- Terminology cleanup to remove user-visible `AI`, `Human backup`, `Teacher backup`, `What we are selling`, `Buy now`, and inappropriate customer/sales language.
- Documentation updates for copy rules, copy review matrix, visual QA by locale, glossary, copy style guide, translation QA checklist, README, and build verification.

## Current State

**Latest shipped milestone:** v1.13 Phase 14: Demo Backend Stabilization, Test Flow Completion, and Backend Integration Readiness

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
- Phase 10 pricing validation, subscription UI, feature flags, parent conversion prompts, tutor operations improvements, admin launch routes, virtual checkout demo/success/cancel flow, launch-ready privacy/terms drafts, release/rollback/monitoring docs, and 6/6 E2E coverage.
- Phase 11 frontend-only paid launch and operations surfaces with pricing/billing plan contracts, usage quota, feature access, mock checkout, parent acquisition pages, referrals, tutor availability, support tickets, admin operational analytics, UTM tracking, demo API fallback, docs, and 6/6 E2E coverage.
- Phase 12 frontend-only platform surfaces with organization dashboard/students/tutors/reports/analytics, advanced learning profile, weak-point diagnosis, curriculum graph, tutor assignment board, schedule overview, parent monthly report, advanced analytics, retention UI, partnership onboarding, docs, and 8/8 E2E coverage.
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
- ✓ Developers can run and verify launch-ready commercial validation UI with pricing, billing, virtual checkout, parent conversion, tutor/admin launch operations, privacy/terms, launch docs, and E2E coverage — v1.9
- ✓ Developers can run and verify frontend-only paid launch, growth, referral, tutor availability, support ticket, admin analytics, UTM, and demo API fallback surfaces — v1.10
- ✓ Developers can run and verify frontend-only platform, organization, learning-intelligence, curriculum graph, diagnosis, tutor assignment, monthly report, advanced analytics, retention, partnership, docs, and E2E surfaces — v1.11
- ✓ Developers can run and verify a clearer frontend information architecture with route inventory, role-based navigation, breadcrumbs/back actions, mobile navigation, final demo flow, docs, and E2E coverage — v1.12
- ✓ Developers can run and verify stable demo backend support, API mode configuration, demo reset, core demo APIs, real backend readiness docs, AWS readiness notes, QA docs, and README workflow — v1.13
- ✓ Developers can run and verify a premium STOA homepage, role-based onboarding, AI-first chat entry, inline teacher escalation, and demo backend onboarding/upload support — v1.14

### Active

- Phase 17 locale-specific copywriting and multilingual UI refinement requirements will cover local copy rules, responsive headline/layout rules, rewritten four-language P0 copy, terminology cleanup, copy review documentation, visual QA by locale, and README updates without expanding product features.

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
- Formal production backend, formal payment webhooks, real subscription enforcement, production analytics backend, complex admin backend, production support ticket backend, complex database design, and backend-owned security/compliance implementation — outside Phase 11 frontend-only scope.
- Production multi-tenant backend, real organization database, formal school admin backend, real AI diagnosis engine, real curriculum graph backend, tutor matching algorithm, automated marketing backend, enterprise invoicing, and complex data warehouse — outside Phase 12 frontend-only scope.
- New large business modules, new formal backend, complex database work, new AI features, new payment features, new admin backend, production infrastructure, full visual redesign, and large-scale component-library rewrites — outside Phase 13 information architecture and UX optimization scope.
- Formal production backend development, complex database schema/migrations, production authentication, refresh-token architecture, real payment webhooks, real subscription enforcement, real AI provider orchestration, AWS deployment, production admin backend, and production analytics storage — outside Phase 14 demo backend stabilization scope.

## Context

The project brief for Phase 17 was provided in Chinese and defines locale-specific copywriting, responsive typography, and multilingual UI refinement. Phase 16 established the English, German, French, and Italian i18n foundation, terminology system, glossary, copy style guide, and translation QA checklist. Phase 17 keeps that product surface stable but treats each language as local product copy rather than literal translation: German should be concise and stable, French elegant and clear, Italian natural and warm, and English calm, premium, and education-centered.

The immediate visible issue is the German homepage hero title `STOA Lernunterstützung genau dann, wenn Schüler sie brauchen.`, which is too long for large serif hero typography and should become short title copy plus explanatory subtitle. The preferred four-language hero direction is: English `Learn with clarity.`, German `Lernen. Fragen. Verstehen.`, French `Comprendre avec confiance.`, and Italian `Studiare con più chiarezza.`.

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
- v1.9 shipped Phase 10 launch readiness with pricing validation, billing/subscription UI, feature flags, virtual checkout, parent conversion, tutor/admin operations improvements, legal drafts, launch docs, and E2E coverage.
- v1.10 shipped Phase 11 paid launch frontend, growth funnel, referrals, tutor availability, support ticket UI, admin analytics, UTM tracking, demo API fallback, and Phase 11 docs.
- v1.11 shipped Phase 12 platform/organization/school/learning-intelligence demos while keeping all backend/database/AI/graph/multi-tenant work limited to API contracts, mock data, and demo/test-only support.
- v1.12 shipped Phase 13 and turned the accumulated frontend pages into a coherent role-based product structure with documented page hierarchy, navigation, journeys, page flows, demo flow, mobile path checks, and frontend-only UX polish.
- v1.13 shipped Phase 14 and stabilized the demo backend/API layer so the frontend can run complete demonstration flows while staying decoupled from future formal backend and AWS implementations.
- v1.14 shipped Phase 15 and redesigned STOA's first impression, role onboarding, and AI-first chat path with premium UI styling and demo backend onboarding/upload support.
- v1.15 shipped Phase 16 to add English/German/French/Italian localization, language switching, persistent language preference, user-facing terminology replacement, and language QA.
- v1.16 starts Phase 17 to refine locale-specific product copy, responsive headline typography, layout hints, P0 page copy quality, terminology cleanup, and visual QA across English, German, French, and Italian.
- During the testing stage, the backend may use Codex as a temporary AI provider behind its own provider layer. The frontend must not depend on provider-specific APIs or environment variables.

## Constraints

- **Tech stack**: React, TypeScript, Vite, npm — specified by the Phase 1 project brief.
- **Runtime**: Node.js 20 LTS or newer LTS is recommended for local development.
- **Scope**: Phase 17 is locale-specific copywriting, responsive typography, and multilingual UI refinement work. It must avoid new business modules, new languages, complex backend work, CMS work, automatic translation pipelines, full legal-document translation, SEO article localization, email-template localization, complex personalization, and core product logic changes.
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
- **Demo backend boundary**: Any local FastAPI, SQLite, JSON, in-memory, MSW, or mock API support in this repo exists only to demonstrate and test frontend flows. It must not be treated as production backend architecture.
- **Demo backend simplicity**: Phase 14 demo backend work should prefer MSW/mock data or a minimal local server with JSON-file state; avoid complex ORM, migrations, SQL schema design, Docker Compose, Kubernetes, and AWS CDK.
- **Demo accounts**: Phase 14 demo users are fixed as `student@test.com`, `parent@test.com`, `tutor@test.com`, and `admin@test.com`, all using `password123`, and reset must preserve those accounts.
- **Onboarding boundary**: Phase 15 registration profile fields and tutor credential upload are demo/onboarding UI and API-contract work only; they must not imply production verification, OCR, identity checks, or admission decisions.
- **Language terminology**: User-visible UI copy should avoid presenting `AI` as the primary product concept. Use `Learning Assistant` for first-response learning help and `Professional teacher support` for teacher escalation; technical identifiers and developer docs may still use AI-related implementation terms where appropriate.
- **Locale-specific copy**: English, German, French, and Italian may use different sentence structures and title component structures when needed for natural reading and stable UI layout, as long as meaning, tone, and brand remain consistent.
- **German layout**: German hero titles should use short phrases or explicit stacked title lines instead of long translated sentences in large display typography.
- **Language persistence**: Phase 16 language choice should persist in the browser through `localStorage` key `stoa_language`; formal cross-device user preference syncing is deferred to a future backend milestone.
- **API modes**: Frontend API mode must be configurable for `mock`, `demo`, `staging`, and `production`; page components should not hard-code API URLs or demo data internals.
- **Error format**: Demo backend errors should use a consistent `{ message, code }` response with demo-specific codes so frontend error states remain testable.
- **Learning intelligence boundary**: Advanced learning profiles, diagnosis, curriculum graph, and recommendations in Phase 12 are mock/demo UI surfaces only. They must not present themselves as real AI diagnosis or graph computation.
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
| Keep Phase 11 strictly frontend-only | Paid launch growth and operational workflows need UI/contracts now, while real payment, subscriptions, analytics, support, and database systems remain backend-owned future work | — Pending |
| Treat prior local backend/database code as demo/test support only | Prevents local FastAPI/SQLite scaffolding from drifting into formal backend architecture inside the frontend repo | — Pending |
| Keep Phase 12 strictly frontend-only | Platform, school, organization, and learning intelligence demos need UI/contracts now, while production multi-tenant, AI diagnosis, graph, and scheduling systems remain backend-owned future work | — Pending |
| Keep Phase 13 focused on information architecture and UX optimization | STOA now has many role surfaces and demo routes; the next value is making the product understandable, navigable, and maintainable rather than adding more pages | — Pending |
| Keep Phase 14 as demo backend stabilization, not formal backend development | The frontend needs stable demonstration and testing flows now, while production backend, database, auth, payments, AI orchestration, and AWS infrastructure remain future backend-owned work | ✓ Good |
| Prefer a simple replaceable demo backend/API contract boundary | Local demo state, reset commands, fixed accounts, and documented contracts give frontend demos enough realism without creating long-term backend technical debt | ✓ Good |
| Keep Phase 15 focused on first impression and core path refinement | STOA now has stable demo flows; the next value is making the student-first learning path obvious and visually credible rather than adding broad new modules | ✓ Good |
| Present teachers as inline escalation, not a parallel product entry | AI should be the default first response in the learning flow, while teacher support appears when an AI answer is not enough | ✓ Good |
| Treat tutor credential upload as demo onboarding only | The UI can collect and mock-upload documents for product demonstration, but real verification, OCR, and approval rules remain future backend/operations work | ✓ Good |
| Keep Phase 16 focused on language, not feature expansion | Swiss-market readiness now depends on multilingual UX and trustworthy education terminology more than new product surfaces | — Pending |
| Use `Learning Assistant` as the user-facing first-response term | It is warmer and more education-oriented than `AI`, avoids implying teacher replacement, and works naturally with teacher escalation | — Pending |
| Use browser-local language persistence first | `localStorage` is enough for demo and frontend validation while cross-device preferences remain a future backend concern | — Pending |
| Keep Phase 17 focused on localized copy and layout stability | The multilingual infrastructure exists; the next value is making each language feel native, premium, and readable in the UI rather than expanding features | — Pending |
| Allow locale-specific title structures | German and other long-text locales need stacked or shorter headlines so typography and layout remain stable without forcing literal translation | — Pending |

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
*Last updated: 2026-05-25 for v1.16 Phase 17 planning*
