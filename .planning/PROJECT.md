# STOA Frontend

## What This Is

STOA Frontend is the React + TypeScript + Vite frontend for the STOA learning platform. The project now has a stable development foundation, visible product UI, backend-integrated student chat, authenticated role surfaces, MVP polish, local test backend support, staging deployment readiness, QA coverage, early user feedback workflow, production-like pilot launch readiness, launch-ready commercial validation UI, early paid growth/operations demo surfaces, platform-level organization/learning-intelligence demos, coherent role-based information architecture, stable demo backend/API support, premium onboarding, four-language i18n, locale-specific product copy refinement, production-facing UI cleanup, brand-aligned visual design translated from the company homepage, mature cross-locale copy/layout quality, accessibility/release-quality gates, trustworthy footer/contact/logo details, a controlled local Learning Assistant provider harness for complete demo flows, and a frontend/demo-backed Practice Path for active learning.

The app includes a STOA core product UI with a backend-driven student chat workspace, conversation list, message flow, teacher-help request path, streaming assistant responses, homework file uploads, authenticated role boundaries, student/parent/tutor role surfaces, parent reporting, tutor workflow polish, a local SQLite-backed test backend, CI/E2E checks, staging documentation, monitoring/logging, support, privacy, backup, pricing validation, virtual checkout, launch artifacts, parent acquisition pages, referral/invitation flow, usage quota display, feature gating UI, tutor availability, support ticket UI, admin operational analytics, UTM tracking, clearer demo-backend boundaries, organization dashboards, advanced learning profile pages, curriculum graph UI, weak-point diagnosis UI, parent monthly reporting, retention surfaces, partnership onboarding, route inventory, role-based navigation, breadcrumbs, demo-flow documentation, stable demo backend APIs, API mode configuration, backend integration readiness documentation, language switching, localized P0 copy, responsive multilingual layout QA, STOA-branded visual tokens for public/auth/app surfaces, cross-locale copy/layout adaptation for English, German, French, and Italian, accessibility/readiness docs, contact form contract, release-quality gate artifacts, a Python prompt harness with local Codex/template provider routing for controlled Learning Assistant demo behavior, and a Practice Path module with subject paths, lesson challenges, feedback, hints, results, mistakes review, dashboard summary, parent report summary, and planned Practice-to-Learning-Chat entry flows.

## Core Value

Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, stable demo backend support, documented API contracts, coherent final demo flows, controlled guided Learning Assistant behavior, natural English/German/French/Italian product copy, production-facing user language, brand-aligned visual design, cross-locale layout stability, accessibility/release-quality gates, trustworthy contact/brand details, stakeholder review evidence, release locks, launch-candidate notes, and a clean Go/No-Go path for future real backend integration and public demo release.

## Latest Shipped Milestone: v1.27 Phase 29: Practice Path Interaction Refinement, Learning Platform Entry Flow, and Site Layout Reorganization

**Shipped:** 2026-05-26

**Delivered:** STOA Practice Path now has a smoother lesson start/challenge/feedback/hint/retry/result loop, Practice-to-Learning-Chat context handoff, Chat practice context card, Back to lesson behavior, delayed teacher-support escalation with practice context, reorganized student learning entry points, homepage learning-entry framing, unified parent learning activity summary, four-language action copy, Phase 29 docs, README guidance, and verified build/browser smoke coverage.

**Target features:**
- Research-backed Practice interaction refinements adapted from Duolingo-style mechanics without copying its visual/product/backend model.
- Lesson intro, stable challenge flow, calm feedback, hint-first retry, result summary, and mistakes review actions.
- Practice-to-Learning-Chat route-state context and Chat practice context card.
- Back to lesson flow from Chat.
- Teacher support shown after repeated confusion with practice context.
- Dashboard, homepage, navigation, parent report, docs, localization, QA, README, build, and browser smoke.

## Current Milestone: v1.27 Phase 29: Practice Path Interaction Refinement, Learning Platform Entry Flow, and Site Layout Reorganization

**Goal:** Refine the Practice Path interaction model and connect it naturally to Learning Chat, teacher support, student dashboard entry points, public-site learning CTAs, and parent learning-activity reporting while keeping the work frontend-design-first and demo-scoped.

**Target features:**
- Research-backed Practice interaction refinements inspired by Duolingo-style flow mechanics without copying visual style, backend structure, punitive hearts, shop/gems, or cartoon reward systems.
- Lesson start, challenge, feedback, hint, retry, completion, and mistakes review flow polish for the existing equation demo.
- Practice-to-Learning-Chat handoff with challenge context card, `Explain this step`, `Ask in Learning Chat`, and `Back to lesson` behavior.
- Teacher support escalation after repeated confusion, carrying practice context without pushing teacher help too early.
- Student Dashboard, homepage entry points, navigation, and parent report wording reorganized around one learning platform instead of disconnected Practice and Chat modules.
- Four-language CTA copy, docs, QA checklist, demo script, README handoff, and build/browser smoke verification.

## Current State

**Latest shipped milestone:** v1.27 Phase 29: Practice Path Interaction Refinement, Learning Platform Entry Flow, and Site Layout Reorganization

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
- Phase 16 multilingual foundations with English, German, French, and Italian i18n, language switching, local language persistence, and user-facing terminology replacement.
- Phase 17 locale-specific copy refinement with natural four-language P0 copy, German stacked hero title support, typed locale layout hints, copy review matrix, visual QA by locale, terminology cleanup, README guidance, and 200 route/locale/viewport visual checks.
- Phase 18 production-facing cleanup with guarded demo-only surfaces, internal debug isolation, product-safe visible copy, display-label boundaries, sanitized user-facing errors, pending guards, improved empty/error states, QA evidence, README guidance, and milestone integration audit fixes.
- Phase 19 brand-aligned visual refinement with read-only company homepage design study, translated STOA brand tokens, platform theme styling, public/auth/app surface visual calibration, visual compatibility QA, UI-SPEC, UI review, remediation pass, and GitHub commit.
- Phase 20 cross-locale copy refinement with read-only company homepage German style study, EN/DE/FR/IT copy-rule docs, cross-locale copy matrix, refined locale JSON, mobile-short CTA layout hints, cross-locale visual QA, README handoff, milestone audit, and GitHub commits.
- Phase 21 accessibility and release-quality hardening with adapted footer/contact/logo/contact-form brand details, localized contact form, contact API contract, accessibility/keyboard/screen-reader/contrast docs, cross-browser/mobile/visual/performance QA docs, release-quality gate, final pre-launch checklist, and README handoff.
- Phase 22 final demo package and launch-candidate preparation with audience demo scripts, locked demo accounts, stakeholder review checklist, release locks, known issues, launch-candidate approval, and final demo run evidence.
- Phase 23 public demo release package with final approval changes, P0/P1 blocker verification, release-lock preservation, final demo rerun, multilingual/responsive/accessibility smoke evidence, deployment handoff, monitoring plan, external presentation support, release notes, Go / No-Go, release branch, and release tag.
- Phase 25 local Learning Assistant provider integration with Python prompt harness, Codex CLI adapter, template fallback, provider router, response checks, behavior regression tests, FastAPI chat integration, provider health endpoint, QA docs, README guidance, and production-provider handoff notes.
- Phase 26 Learning Assistant functional QA with multi-turn regression data, focused behavior tests, evaluator and repair/fallback stabilization, regression report, README guidance, and full demo-flow verification.
- Phase 27 Practice Path frontend/demo integration with `/practice`, subject path, lesson flow, challenge feedback, hint flow, lesson result, mistakes review, Student Dashboard practice summary, Parent Report practice summary, API contracts, mock data, and four-language Practice copy.
- Phase 28 Practice Path QA and equation demo polishing with an equation-only Mathematics path, refined lesson content, challenge-specific feedback, hint-first support behavior, parent summary copy, demo scenario docs, content QA, and verified build/browser smoke.
- Phase 29 Practice Path interaction and learning-entry integration with lesson intro, stable challenge/feedback/hint/retry flow, Practice-to-Learning-Chat context handoff, Chat context card, Back to lesson, delayed teacher escalation, Dashboard/homepage IA polish, unified Parent Report learning activity, docs, localization, build, and browser smoke.
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
- ✓ Developers can run and verify English, German, French, and Italian language support with language switching, local language persistence, glossary/style guidance, and user-facing terminology replacement — v1.15
- ✓ Developers can run and verify natural locale-specific P0 copy, German stacked hero title rendering, responsive multilingual layout fit, copy review documentation, visual QA evidence, terminology cleanup, and README handoff guidance — v1.16
- ✓ Developers can run and verify production-facing UI cleanup, demo-only UI guards, display-label mapping, sanitized user-facing errors, duplicate-submit guards, stable empty/error states, QA evidence, and README guidance — v1.17
- ✓ Developers can run and verify local demo Learning Assistant provider integration with Python prompt harness, internal Codex provider adapter, template fallback, provider health check, response behavior tests, FastAPI chat integration, QA docs, README guidance, and future provider handoff notes — v1.23
- ✓ Developers can run and verify Learning Assistant functional QA, multi-turn regression tests, evaluator/prompt/fallback stabilization, regression reporting, and full demo-flow behavior checks — v1.24
- ✓ Developers can run and verify Practice Path interaction refinements, Practice-to-Learning-Chat context handoff, delayed teacher escalation, unified dashboard/homepage/parent learning activity framing, four-language labels, docs, build, and browser smoke — v1.27

### Active

(None — v1.27 implementation is complete. Next active scope should be defined by Phase 30.)

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
- New business modules, new languages, formal backend implementation, real payment collection, real teacher verification, AWS deployment, major visual redesign, and large architecture rewrites — outside Phase 18 production-facing cleanup scope.
- Modifying `/Users/zhdeng/newweb`, copying homepage source files/assets/components, adding product features, changing backend/payment behavior, adding dependencies, or making the learning platform a direct homepage clone — outside Phase 19 brand-aligned visual refinement scope.
- New business functionality, new languages, CMS, automatic translation systems, final legal translation, SEO article translation, backend language preference syncing, and modifying or copying from `/Users/zhdeng/newweb` — outside Phase 20 cross-locale copy and layout refinement scope.
- Production contact email delivery, CRM integration, complex support operations, anti-spam infrastructure, formal AWS deployment, full legal-compliance finalization, modifying `/Users/zhdeng/newweb`, copying company homepage components/source structure, and large visual redesign — outside Phase 21 release-quality and brand-detail integration scope.
- New product functionality, homepage redesign, register flow redesign, multilingual system redesign, demo backend rewrite, complex backend/database work, AWS deployment, real payment processing, large UI redesign, production email/CRM/support operations, product-direction changes, new pages/languages, broad copy/design reopening, and navigation rewrites — outside Phase 23 launch-candidate bug fixing and public demo release scope.
- Formal AI backend, production model service, production provider billing, complex provider pool, production queue, database redesign, long-term memory, real curriculum knowledge graph, content safety platform, AWS Lambda/API Gateway implementation, direct frontend calls to Codex/OpenAI, and user-visible Codex/model/provider/debug wording — outside Phase 25 local demo provider integration scope.
- New frontend pages, broad UI redesign, formal AI backend work, complex agent framework, long-term memory, real knowledge graph, production-grade content safety platform, model fine-tuning, multi-model scheduling, AWS deployment, and new product modules — outside Phase 26 Learning Assistant functional QA scope.

## Context

The project brief for Phase 17 was provided in Chinese and defines locale-specific copywriting, responsive typography, and multilingual UI refinement. Phase 16 established the English, German, French, and Italian i18n foundation, terminology system, glossary, copy style guide, and translation QA checklist. Phase 17 keeps that product surface stable but treats each language as local product copy rather than literal translation: German should be concise and stable, French elegant and clear, Italian natural and warm, and English calm, premium, and education-centered.

The immediate visible issue is the German homepage hero title `STOA Lernunterstützung genau dann, wenn Schüler sie brauchen.`, which is too long for large serif hero typography and should become short title copy plus explanatory subtitle. The preferred four-language hero direction is: English `Learn with clarity.`, German `Lernen. Fragen. Verstehen.`, French `Comprendre avec confiance.`, and Italian `Studiare con più chiarezza.`.

The project brief for Phase 18 was provided in Chinese and defines production-facing cleanup, stability hardening, and demo artifact removal. Phase 18 explicitly does not add product scope. It removes user-visible `demo`, `mock`, `test`, `Codex`, `development`, `sample`, `placeholder`, and internal-rule wording from existing UI, improves loading/error/empty/success states, hides demo-only UI behind environment flags, and keeps demo/backend internals available only to developers.

The project brief for Phase 19 was provided in Chinese and defines brand-aligned visual refinement based on the company homepage source at `/Users/zhdeng/newweb`. That source project is read-only for this milestone. Phase 19 should extract design signals such as burgundy/charcoal/warm-grey color, editorial Prata display typography, Inter UI text, restrained square button treatment, generous public-page spacing, and education photography tone, then translate those signals into a learning-platform design system that feels related but remains independent and app-like.

The project brief for Phase 20 was provided in Chinese and defines cross-locale copy refinement, German style alignment, and multilingual layout adaptation. Phase 20 continues the Phase 19 read-only source policy for `/Users/zhdeng/newweb`, but focuses on language rather than visual redesign: study the company homepage's German writing style, translate those style signals into STOA learning-platform German copy rules, refine English/French/Italian copy globally, and adapt UI layout so German long words, French apostrophes, Italian CTA length, and English education tone all work naturally across core pages.

The project brief for Phase 21 was provided in Chinese and defines accessibility, cross-browser QA, brand detail integration, and release quality gates. Phase 21 continues the strict read-only policy for `/Users/zhdeng/newweb`, but now extracts footer/contact/logo/contact-form information and adapts it into the learning platform while improving accessibility, keyboard navigation, screen-reader support, contrast, cross-browser/mobile QA, visual regression, performance sanity, and final pre-launch documentation.

The project brief for Phase 22 was provided in Chinese and defines final demo packaging, stakeholder review, and launch candidate preparation. Phase 22 explicitly does not add new product features. It packages the current STOA frontend into a stable demo/review set with fixed demo accounts, demo data/reset validation, audience-specific scripts, final copy/design/translation/API locks, release notes, known issues, next-stage backlog, launch-candidate approval, final demo run results, README handoff, and release branch rules.

The project brief for Phase 23 was provided in Chinese and defines launch-candidate bug fixing, final approval, and public demo release. Phase 23 explicitly does not expand functionality, product direction, page structure, copy scope, or design direction. It takes the Phase 22 launch candidate as the baseline, fixes only P0/P1 blockers and required final-approval items, reruns full demo and final smoke checks, prepares release handoff/monitoring/presentation docs, records Go/No-Go, and confirms public demo release readiness.

The project brief for Phase 25 was provided in Chinese and defines a local testing/demo provider integration milestone. Phase 24's Learning Assistant behavior-control design is treated as already completed context for this milestone: guided answers should avoid giving final answers first, respect student grade range and registered subjects, trigger professional teacher support when appropriate, and use a Python prompt harness for behavior control. Phase 25 turns that design into a working local demo path by adding a Codex provider adapter behind the demo backend/harness, a template fallback provider, provider health/readiness checks, behavior regression tests, full demo QA, and future production-provider handoff notes.

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
- v1.16 shipped Phase 17 to refine locale-specific product copy, responsive headline typography, layout hints, P0 page copy quality, terminology cleanup, copy review documentation, and visual QA across English, German, French, and Italian.
- v1.17 shipped Phase 18 to remove development/demo artifacts from user-facing UI, add environment guards for demo-only surfaces, harden core states, and document production-facing cleanup QA.
- v1.18 shipped Phase 19 to translate company homepage brand signals into the learning-platform visual system without modifying or copying `/Users/zhdeng/newweb`.
- v1.19 shipped Phase 20 to refine English, German, French, and Italian product copy and layout fit with German style alignment from the read-only company homepage reference.
- v1.20 shipped Phase 21 to integrate adapted footer/contact/logo/contact-form details, harden accessibility and keyboard/screen-reader/contrast behavior, document cross-browser/mobile/visual/performance QA, and define release-quality gates.
- v1.21 shipped Phase 22 to package the current frontend for final demo, stakeholder review, release locks, launch-candidate approval, final demo run, and branch preparation without adding new features.
- v1.22 starts Phase 23 to convert the launch candidate into a public demo release through bug-fix-only changes, final approval closure, release smoke tests, handoff docs, Go/No-Go, and branch/tag/deployment confirmation.
- v1.23 starts Phase 25 to connect Codex as a local-only demo Learning Assistant provider behind the Python harness/demo backend while keeping the frontend provider-agnostic and preserving all public demo flows.
- v1.24 shipped Phase 26 to stabilize Learning Assistant behavior through functional QA, multi-turn regression tests, evaluator/repair/fallback improvements, and full demo-flow verification without expanding product scope.
- During the testing stage, the backend may use Codex as a temporary AI provider behind its own provider layer. The frontend must not depend on provider-specific APIs or environment variables.

## Constraints

- **Tech stack**: React, TypeScript, Vite, npm — specified by the Phase 1 project brief.
- **Runtime**: Node.js 20 LTS or newer LTS is recommended for local development.
- **Scope**: Phase 25 is local testing/demo provider integration. It must avoid formal AI backend work, production model service work, production provider billing, complex provider orchestration, database redesign, AWS deployment, direct frontend provider calls, and user-visible provider/debug terminology.
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
- **Phase 20 source safety**: `/Users/zhdeng/newweb` is read-only. Phase 20 may inspect German copy style there, but must not modify files, run formatter/install/build commands there, copy components, or transplant full homepage text into the learning platform.
- **Phase 21 source safety**: `/Users/zhdeng/newweb` is read-only. Phase 21 may inspect footer, contact, logo, and form patterns there, but must not modify files, run formatter/install/build commands there, copy components, or transplant the company homepage structure into the learning platform.
- **Contact form boundary**: Phase 21 contact form work is frontend UI, i18n, and demo API contract only. It must not imply production email delivery, CRM integration, anti-spam guarantees, or formal support operations.
- **Release-quality boundary**: Accessibility, browser, mobile, visual regression, and performance checks can document feasible local evidence and known gaps; formal external device-lab coverage remains a future release operation if unavailable locally.
- **Phase 22 scope lock**: Phase 22 prepares demo/review/release artifacts only. New features, broad redesign, backend rewrites, new infrastructure, and real payment/support operations belong in later backlog unless they block the final demo or launch candidate.
- **Phase 23 bug-fix-only rule**: Every Phase 23 code change must map to a launch-candidate bug, final approval item, or release blocker. P0 must be fixed, P1 must be fixed or accepted with a workaround, P2 is fixed only when low-risk/low-cost, and P3 goes to next-stage backlog.
- **Phase 23 release-lock preservation**: Copy lock, design lock, translation lock, and demo API contract lock remain active. Changes may not reopen broad copy/design/translation/API scope unless required to resolve a P0/P1 release blocker.
- **Phase 25 provider boundary**: Codex is an internal local demo provider only. The frontend must continue to call the STOA Chat API and must not receive or display provider-specific fields, model names, prompt text, backend debug data, or internal fallback details.
- **Phase 25 harness behavior**: The Python harness owns prompt construction, grade-level constraints, subject-scope constraints, no-direct-answer rules, teacher escalation guidance, forbidden internal-term checks, response repair, fallback selection, and provider readiness evidence.
- **Phase 25 fallback requirement**: Codex timeout, unavailable command, failed behavior checks, or forbidden internal terms must not break the demo; the template fallback should return a natural guided Learning Assistant response and internal logs should record the reason without sensitive data.
- **Phase 27 scope**: Practice Path is frontend preparation, page integration, component adaptation, interaction flow, API contract, mock data, and demo backend support only. It must not introduce complex database design, a production course system, payment-gated practice, adaptive-learning algorithms, or formal backend architecture.
- **Phase 27 reference boundary**: `sanidhyy/duolingo-clone` is a mechanism reference only. STOA may learn from learning paths, lessons, challenge feedback, progress, quests, streaks, attempts, and completion flows, but must not copy its codebase, backend stack, database structure, Clerk/Stripe/Neon/Drizzle integrations, language-learning product structure, shop/gems mechanics, or cartoon visual style.
- **Phase 27 product positioning**: The primary module name should be `Practice Path`, with light `Learning Quest` language only where useful. STOA remains a premium education platform for subject practice, not a game or language-learning clone.
- **Phase 27 Learning Assistant boundary**: Practice mistakes should first show feedback, hint, and retry. `Explain this step` may hand off to the Learning Assistant, and `Ask a teacher` may appear after continued confusion; neither flow should directly expose model/provider/debug terminology.
- **Phase 27 localization**: Practice Path P0 copy must support English, German, French, and Italian. German labels should stay short enough for buttons, including `Üben`, `Weiter üben`, `Prüfen`, `Hinweis anzeigen`, and `Schritt erklären`.
- **Phase 28 content focus**: Practice Path demo content should focus only on equations: one-variable linear equations, simple quadratics, and two-variable linear systems. Do not expand into a general math, physics, geometry, probability, function, or large curriculum library.
- **Phase 28 implementation boundary**: The work is frontend design, demo data, content QA, copy polish, and demo scenario stabilization only. Functionality should be just enough to test and present the UI flow; no production backend, adaptive learning, formal database, or large problem bank should be added.
- **Phase 28 pedagogy boundary**: Hints should be directional and age-appropriate, not final-answer reveals. Quadratic content should stay at recognition, simple factoring, zero-product solving, and checking; avoid formula derivations, discriminants, complex roots, vertex formulas, and calculus.
- **Phase 29 interaction boundary**: Practice Path refinements should focus on UI flow, route state, mock/demo contracts, visual clarity, and demo reliability. Do not expand course content, add production backend/database work, or turn STOA into a game.
- **Phase 29 Practice-to-Chat boundary**: Practice may pass challenge context into Learning Chat through frontend route state or mock API contracts, but the frontend must remain provider-agnostic and must not expose model/provider/debug terminology.
- **Phase 29 gamification boundary**: Adopt smooth progress, immediate feedback, and short-session clarity; avoid punitive hearts, leaderboards, shops, gems, loud celebrations, and streak pressure that distracts from learning.
- **Public demo release boundary**: The public demo release may be externally accessible for investors, parents, teachers, partners, and internal communication support, but it is not a production backend, paid launch, large-scale public opening, final cloud architecture, or full commercial operations system.
- **Launch-candidate branch rule**: The release branch should be created only after build, core demo flow, P0 bug, copy/design/translation/API lock, and approval checks pass. After creation, it accepts bug fixes only.
- **Demo account boundary**: Fixed demo credentials may be documented for internal demo operation, but they should not appear in normal user-visible UI.
- **Cross-locale layout**: Copy changes and UI layout changes must be treated together. German long words, French apostrophes, and Italian CTA length need explicit mobile and desktop layout checks.
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
| Keep Phase 16 focused on language, not feature expansion | Swiss-market readiness now depends on multilingual UX and trustworthy education terminology more than new product surfaces | ✓ Good |
| Use `Learning Assistant` as the user-facing first-response term | It is warmer and more education-oriented than `AI`, avoids implying teacher replacement, and works naturally with teacher escalation | ✓ Good |
| Use browser-local language persistence first | `localStorage` is enough for demo and frontend validation while cross-device preferences remain a future backend concern | ✓ Good |
| Keep Phase 17 focused on localized copy and layout stability | The multilingual infrastructure exists; the next value is making each language feel native, premium, and readable in the UI rather than expanding features | ✓ Good |
| Allow locale-specific title structures | German and other long-text locales need stacked or shorter headlines so typography and layout remain stable without forcing literal translation | ✓ Good |
| Keep Phase 18 focused on production-facing cleanup | Existing surfaces still contain demo and development traces; removing those artifacts improves trust without expanding product scope | — Pending |
| Hide demo-only UI by default | Demo accounts, debug panels, badges, and internal hints help development but should not appear in normal user-facing paths | — Pending |
| Map internal status values before rendering | API/demo status strings may contain implementation language and need stable user-facing labels across locales | — Pending |
| Keep Phase 19 as design translation, not source copying | The company homepage can inform STOA brand language, but the learning platform needs its own product-app identity and must not modify or duplicate `/Users/zhdeng/newweb` | ✓ Good |
| Keep Phase 20 focused on cross-locale copy and layout | The multilingual infrastructure and brand visuals exist; the next value is making all four languages read naturally and fit reliably without adding product scope | — Pending |
| Use company homepage German only as a style reference | Phase 20 should learn headline rhythm, tone, and educational wording from the homepage without transplanting whole homepage copy into the learning platform | — Pending |
| Keep Phase 21 focused on release quality and brand-detail trust | STOA now has strong product, language, and visual foundations; the next value is making the frontend accessible, testable, contactable, and ready for release review without adding complex backend scope | — Pending |
| Adapt company homepage contact details without copying structure | Footer, logo, and contact-form information can improve trust, but the learning platform must keep its own product-app identity and preserve `/Users/zhdeng/newweb` as read-only source material | — Pending |
| Keep Phase 22 focused on final demo packaging and launch-candidate preparation | The product surface is mature enough for formal review; the next value is repeatable demo evidence, stakeholder sign-off, release locks, and Go/No-Go clarity rather than additional features | — Pending |
| Defer launch-candidate branch creation until approval gates pass | A release branch should represent a buildable, demo-verified candidate with P0 bugs at zero and release locks complete | — Pending |
| Treat known issues and backlog as release tools, not hiding places | P0 issues cannot be accepted as known issues, and P1 issues need workarounds so launch readiness remains explicit | — Pending |
| Keep Phase 23 bug-fix-only through public demo release | The launch candidate should become a trustworthy public demo by controlling change risk, not by expanding product scope | — Pending |
| Research release blockers through existing docs and smoke evidence | Bug cleanup should start from Phase 22 locks, known issues, approval checklist, and actual demo-flow evidence before code changes | — Pending |
| Separate internal and external release notes | Internal notes can mention demo backend/mock API support, while external-facing release communication should not expose mock/demo backend/Codex/fake checkout language | — Pending |
| Keep Codex behind the demo backend and Python harness | Local Codex use should make the demo feel real without coupling frontend code or user-facing UI to a temporary provider | — Pending |
| Use `codex exec` as the local demo bridge when available | The installed Codex CLI supports non-interactive scripted output, which is adequate for local demos but not a production AI backend | — Pending |
| Keep template fallback mandatory for provider failures | Demo reliability matters more than provider purity; fallback prevents timeouts or behavior-check failures from breaking the presentation | — Pending |
| Treat the OpenAI Responses API as the future production handoff direction | Official guidance recommends Responses for new model integrations, so Phase 25 docs should separate CLI demo bridging from future backend provider implementation | — Pending |
| Keep Phase 26 focused on Learning Assistant QA instead of feature expansion | The next value is making existing guided answers stable, relevant, scoped, and demo-safe across turns rather than adding pages or backend architecture | — Pending |
| Treat behavior failures as regression-test candidates | P0 Learning Assistant issues should be captured in a bug log and converted into tests before prompt, evaluator, or fallback fixes are accepted | — Pending |
| Fix Learning Assistant behavior in the harness, not the frontend | Frontend should display backend Chat API responses; prompt rules, evaluator checks, repair prompts, and fallback templates own answer behavior | — Pending |
| Keep Phase 27 as Practice Path, not a Duolingo clone | STOA should adopt useful learning-path mechanics while preserving its subject-based premium education positioning, restrained visual language, and backend simplicity | — Pending |
| Use attempts instead of punitive hearts | Attempts communicates practice chances in a neutral education tone and avoids over-gamified pressure | — Pending |
| Make hints the first response to practice mistakes | Students should receive guided support and retry opportunities before full Learning Assistant explanation or teacher escalation | — Pending |
| Keep Phase 28 equation-only | A focused equation path is more credible for a 3-5 minute demo than a broad but shallow curriculum library | — Pending |
| Treat Practice content polish as frontend demo design | Phase 28 should improve UI/content/demo quality without adding real backend, database, adaptive learning, or large content systems | — Pending |
| Keep hints directional rather than answer-revealing | Practice should teach the next reasoning step and let the student retry before exposing a final solution | — Pending |
| Make Practice a Learning Chat entry point | Phase 29 should connect students to guided explanations at the moment they get stuck, instead of treating Practice and Chat as separate products | — Pending |
| Prefer stable interaction loops over heavier gamification | Research supports immediate feedback and multiple-try hints, while Duolingo-style gamification can distract from learning when rewards become the goal | — Pending |
| Keep teacher support as escalation, not primary help | Learning Assistant context should come before professional teacher support unless the student repeatedly struggles or explicitly asks for human explanation | — Pending |

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
*Last updated: 2026-05-26 after v1.27 milestone start*
