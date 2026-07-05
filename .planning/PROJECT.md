# STOA Frontend

## What This Is

STOA Frontend is the React + TypeScript + Vite frontend for the STOA learning platform. The project now has a stable development foundation, visible product UI, backend-integrated student chat, authenticated role surfaces, MVP polish, local test backend support, staging deployment readiness, QA coverage, early user feedback workflow, production-like pilot launch readiness, launch-ready commercial validation UI, early paid growth/operations demo surfaces, platform-level organization/learning-intelligence demos, coherent role-based information architecture, stable demo backend/API support, premium onboarding, four-language i18n, locale-specific product copy refinement, production-facing UI cleanup, brand-aligned visual design translated from the company homepage, mature cross-locale copy/layout quality, accessibility/release-quality gates, trustworthy footer/contact/logo details, a controlled local Learning Assistant provider harness for complete demo flows, a frontend/demo-backed Practice Path with roadmap progression for active learning, a frontend/mock-backed Practice Library, a unified learning-context photo/PDF upload UI foundation, a frontend/mock-backed Online Classroom foundation with refined tutor-support escalation language, and an isolated Home V2 preview route/component skeleton for the Swiss-parent homepage redesign track.

The app includes a STOA core product UI with a backend-driven student chat workspace, conversation list, message flow, teacher-help request path, streaming assistant responses, homework file uploads, contextual photo/PDF upload flows, authenticated role boundaries, student/parent/tutor role surfaces, parent reporting, tutor workflow polish, a local SQLite-backed test backend, CI/E2E checks, staging documentation, monitoring/logging, support, privacy, backup, pricing validation, virtual checkout, launch artifacts, parent acquisition pages, referral/invitation flow, usage quota display, feature gating UI, tutor availability, support ticket UI, admin operational analytics, UTM tracking, clearer demo-backend boundaries, organization dashboards, advanced learning profile pages, curriculum graph UI, weak-point diagnosis UI, parent monthly reporting, retention surfaces, partnership onboarding, route inventory, role-based navigation, breadcrumbs, demo-flow documentation, stable demo backend APIs, API mode configuration, backend integration readiness documentation, language switching, localized P0 copy, responsive multilingual layout QA, STOA-branded visual tokens for public/auth/app surfaces, cross-locale copy/layout adaptation for English, German, French, and Italian, accessibility/readiness docs, contact form contract, release-quality gate artifacts, a Python prompt harness with local Codex/template provider routing for controlled Learning Assistant demo behavior, a Practice Path module with subject paths, roadmap progression, lesson challenges, feedback, hints, results, mistakes review, homepage entry framing, dashboard entry cards, Practice-to-Learning-Chat context, parent learning activity, and tutor Practice request context, and a separate `/home-v2` public preview route with Home V2 section components and provisional multilingual copy plumbing.

## Core Value

Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, stable demo backend support, documented API contracts, coherent final demo flows, controlled guided Learning Assistant behavior, natural English/German/French/Italian product copy, production-facing user language, brand-aligned visual design, cross-locale layout stability, accessibility/release-quality gates, trustworthy contact/brand details, stakeholder review evidence, release locks, launch-candidate notes, and a clean Go/No-Go path for future real backend integration and public demo release.

## Latest Shipped Milestone: v4.0 新版路由与组件骨架

**Shipped:** 2026-07-04

**Delivered:** Home V2 now has an isolated, previewable `/home-v2` route and component skeleton that proves the Swiss-parent homepage structure without replacing the current `/` homepage. The milestone added `src/pages/home-v2/HomeV2Page.tsx`, a `src/components/home-v2/` section namespace, provisional `homeV2` i18n resources, a previewable five-section layout, focused Playwright smoke coverage, and route/component handoff documentation. Final image optimization, full animation choreography, final four-language copy, screenshot QA, and replacing `/` remain out of scope.

**Target features:**
- `/home-v2` renders as a public preview route while `/` remains unchanged.
- Home V2 composition lives under `src/pages/home-v2/` and `src/components/home-v2/`.
- Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, and Final CTA render with visible layout rhythm and placeholder visual/proof surfaces.
- `homeV2` is registered in i18n and has provisional EN/DE/FR/IT resources.
- Final assets, motion, copywriting, visual regression approval, and `/` switch-over remain later explicit milestones.

## Current Milestone: v6.1 Home V2 Parent Confidence Redesign

**Goal:** Redesign the Home V2 Parent Confidence section so Swiss parents feel calmly informed and close to the learning rhythm without anxiously taking over homework.

**Target features:**
- Preserve current `/` until explicit replacement approval.
- Keep `/home-v2` as the isolated preview route for Parent Confidence work.
- Replace the current multi-pill feature overlay with one restrained parent-facing progress note/proof surface.
- Use warmer family-learning composition and short parent-first copy instead of dashboard, monitoring, or feature-list language.
- Preserve EN/DE/FR/IT `homeV2` plumbing and update only the copy needed for this section.

## Current State

**Latest shipped milestone:** v4.0 新版路由与组件骨架

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
- Phase 28 Practice Path QA and equation demo polishing with a Mathematics equation demo path, refined lesson content, challenge-specific feedback, hint-first support behavior, parent summary copy, demo scenario docs, content QA, and verified build/browser smoke.
- Phase 29 Practice Path interaction and learning-entry integration with lesson intro, stable challenge/feedback/hint/retry flow, Practice-to-Learning-Chat context handoff, Chat context card, Back to lesson, delayed teacher escalation, Dashboard/homepage IA polish, unified Parent Report learning activity, docs, localization, build, and browser smoke.
- Phase 30 final demo curriculum packaging with an equation-focused curriculum package, product story statements, 3/10/15 minute demo scripts, role-specific external testing task sheets, feedback form and evaluation framework, parent value framing, future curriculum/backend handoff requirements, Phase 31 follow-up backlog, README handoff, milestone audit, and build verification.
- Phase 31 Practice entry integration with homepage Practice framing, student Continue Practice and Learning Chat entry cards, Practice-to-Chat context enrichment, parent Learning Activity summary, Tutor Request Practice context, role navigation alignment, four-language copy, docs, README, build, and browser smoke verification.
- Phase 33 homepage Practice entry clarification with role-aware Start Practice routing, homepage Practice entry components, four-language Practice entry copy, mobile fit QA, docs, README, browser route verification, build verification, and milestone archive.
- Phase 34 Practice Path scope correction with the canonical Practice Path -> Subject -> Grade level -> Topic -> Unit -> Lesson -> Challenge hierarchy, Mathematics / lower secondary / equations demo seed data, subject/topic route compatibility, generalized UI copy, docs, README, route QA, four-language checks, and build verification.
- Phase 35 Practice Roadmap UI with subject-agnostic roadmap data contracts, roadmap components, lesson node states, progress header, locked hints, continue card, `/practice` and topic route integration, four-language copy, roadmap docs, README handoff, browser checks, and build verification.
- v2.1 Question Bank UI with `/question-bank`, subject/topic question-bank pages, set overview, session answer flow, immediate feedback, result page, mistakes review, saved sets, local search/filtering, typed mock data, service/query boundaries, Question Bank to Learning Chat context, parent/tutor comprehension updates, docs, and verification.
- v2.2 Photo & File Upload UI with reusable upload types/services/hooks/components, Chat composer upload integration, Question Bank upload modal/session handoff, Practice schoolwork upload panels, route-state/session-storage handoff, four-language upload copy, docs, and Playwright upload verification.
- v2.3 Live Classroom UI with classroom domain contracts, mock services/hooks, student classroom home/schedule/lobby/room/summary, Chat teacher-text-to-video escalation, tutor classroom queue/lobby/room/summary, parent classroom visibility, four-language liveClassroom namespace, docs, and Playwright coverage.
- v4.0 Home V2 preview route and component skeleton with isolated `/home-v2`, preserved `/`, Home V2 section components, provisional `homeV2` i18n resources, route smoke coverage, and implementation handoff.
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
- ✓ Developers can use the final equation demo curriculum package, product story scripts, role-specific external testing materials, feedback framework, parent value framing, future handoff requirements, README guidance, audit evidence, and build verification — v1.28
- ✓ Developers can run and verify Practice as a homepage and student-dashboard entry into Learning Chat, with parent learning activity, tutor request context, four-language copy, docs, README, build, and browser smoke evidence — v1.29
- ✓ Developers can rely on English, German, French, and Italian copy QA, cleaned user-facing development artifacts, final language QA docs, README guidance, build verification, and 184 route/locale/viewport smoke checks — v1.30
- ✓ Developers can run and verify a clear homepage Practice entry, Start Practice routing, four-language Practice entry copy, Practice preview, docs, README, build, browser layout QA, and milestone archive — v1.31
- ✓ Developers can run and verify a subject-agnostic Practice roadmap with lesson progression states, locked hints, next-lesson CTA, topic route support, four-language copy, docs, README guidance, browser checks, and build verification — v1.33
- ✓ Developers can run and verify reliable frontend quality gates with CI/local command parity, Node-aware ESLint config, lockfile and ignore hygiene, updated smoke tests, README guidance, and 14/14 Playwright E2E checks — v1.34
- ✓ Students can set a Learning Assistant answer-language preference, and new guided responses use the saved student profile language across local/demo profile and chat flows — v1.35
- ✓ Students can use a frontend/mock-backed Question Bank to browse question sets, filter/search open practice, complete a low-pressure session, review feedback/results/mistakes, and hand off unclear question steps to Learning Chat — v2.1
- ✓ Students can upload photos and PDFs as learning material from Chat, Question Bank, and Practice Path through a unified, accessible frontend upload system — v2.2
- ✓ Upload UI supports mobile camera capture, desktop drag-and-drop, browse fallback, validation, preview, removal, retry, failed/rejected states, and Learning Assistant handoff — v2.2
- ✓ Upload copy remains product-safe and does not imply OCR, image understanding, automatic solving, permanent storage, encryption guarantees, or teacher/admin review workflows that are not implemented — v2.2
- ✓ Students can schedule and enter mock online classroom sessions from Dashboard and classroom routes — v2.3
- ✓ Students can escalate from Learning Chat teacher text help into a mock live video classroom lobby with conversation/material context — v2.3
- ✓ Tutors can view a mock classroom queue and enter tutor lobby/room flows with student context — v2.3
- ✓ Classroom room UI provides education-specific live classroom structure: video placeholders, learning workspace, materials, notes, chat, participants, and controls — v2.3
- ✓ v2.3 remains frontend/mock-only and does not claim real WebRTC, real video provider integration, real scheduling backend, real billing, recording, screen share, or production whiteboard support — v2.3
- ✓ Student Dashboard presents the learning journey with clear priority instead of a flat list of modules — v2.4
- ✓ Student-facing Question Bank copy became Practice Library while preserving existing routes and code boundaries — v2.4
- ✓ Practice Library, question set, question session, result, and mistakes-review pages use calm, supportive, specific learning copy — v2.4
- ✓ Upload UI uses Upload a Question / Take Photo / Attach File language and avoids implying OCR, AI solving, or image understanding — v2.4
- ✓ Online Classroom UI emphasizes learning context, materials, tutor support, and next steps rather than generic meeting behavior — v2.4
- ✓ Chat teacher-support escalation now describes Tutor Support, Learning Assistant observing, and Start Live Classroom actions — v2.4
- ✓ Tutor surfaces make student source, topic, context, materials, and suggested focus easy to scan before joining — v2.4
- ✓ Parent surfaces explain the complete learning support system without giving parent-only classroom controls — v2.4
- ✓ Shared empty, loading, error, status, context, and next-step patterns provide clearer recovery or next actions — v2.4
- ✓ i18n and E2E assertions reflect the refined product language across questionBank, uploads, liveClassroom, chat, dashboard, tutor, and parent surfaces — v2.4
- ✓ Online Classroom home and scheduling flow are simplified into a focused live-support entry path with compact request/time/materials structure — v2.5
- ✓ Classroom lobby and room prioritize a learning workspace with Shared Problem, Focus Board / Shared Whiteboard, materials, compact video rail, tabbed panels, and accessible icon-led controls — v2.5
- ✓ Classroom summary, tutor queue, parent classroom visibility, browser checks, lint/build, and live-classroom E2E coverage align with the simplified Online Classroom model — v2.5
- ✓ Home V2 has a Swiss-parent-first positioning contract, current-homepage content inventory, separate route/namespace proposal, CTA journey, multilingual IA guardrails, and implementation handoff baseline — v2.6
- ✓ Home V2 has a premium visual direction contract covering high-end visual thesis, typography roles, color behavior, spacing, surfaces, CTA/nav treatment, image art direction, motion choreography, responsive/accessibility/localization guardrails, and implementation handoff constraints — v2.7
- ✓ Home V2 has an image and asset strategy covering source hierarchy, Pexels/iStock/Magnific source rules, licensing and release checks, AI-use boundaries, section asset briefs, search taxonomy, candidate scoring, metadata, storage, crop/optimization, approval gates, and QA handoff — v2.8
- ✓ Home V2 has an isolated public preview route, preserved `/` homepage, component namespace, provisional `homeV2` i18n skeleton, previewable five-section layout, route smoke tests, and implementation handoff — v4.0

### Active

- [ ] **PC-01**: Parents can understand the section's emotional promise: they can stay close to the learning rhythm without taking over the child's homework.
- [ ] **PC-02**: Parents can see a warm family-learning composition that feels concrete and reassuring without becoming a generic full-bleed stock block.
- [ ] **PC-03**: Parents see one restrained progress-note/proof surface instead of a stack of dashboard-like feature pills.
- [ ] **PC-04**: Parents read short, non-technical copy that communicates relief, calm proximity, and trust in the next learning step.
- [ ] **PC-05**: The Parent Confidence layout remains controlled and legible at desktop, narrow/tablet, and mobile widths.
- [ ] **PC-06**: The redesign is verified with lint, build, Home V2 E2E, and browser/screenshot smoke checks for the Parent Confidence section.

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
- Production object storage, signed upload URLs, OCR, image understanding, handwriting/formula recognition, automatic problem solving from images, teacher grading, parent file review, admin moderation, video upload, and permanent file-library management — outside v2.2 Photo & File Upload UI Foundation scope.
- Replacing the current production homepage at `/` — v2.6 plans a separate preview route only.
- Visual implementation, image production, animation implementation, and final copy localization — deferred to later Home V2 redesign milestones after IA is locked.
- New backend, payment, registration, quota, auth, or role-dashboard behavior — v2.6 maps the journey but does not change product functionality.
- Hero-level AI positioning, homework-solver claims, guaranteed outcome claims, or teacher-replacement language — outside the agreed Swiss high-end education positioning.
- Implementing the Home V2 React route, components, localized JSON, final images, or animation code — v2.7 defines visual direction only.
- Replacing `/`, changing public navigation behavior, or modifying registration/auth/role routing — outside visual direction design.
- One-note beige/cream, dominant purple/blue gradients, decorative gradient orbs, generic 3-column SaaS grids, nested UI cards, and heavy blur effects — outside the approved Home V2 visual direction.
- Downloading final assets, committing binary image files, or inserting images into React components — v2.8 defines source strategy and candidate criteria only.
- Treating iStock as a free image source — iStock is a paid licensed stock source and must be budget/approval gated.
- Using Magnific AI generation as the default image source — v2.8 prioritizes real licensed imagery; AI is limited to last-resort or enhancement use with explicit disclosure in metadata.
- Using identifiable children/families in contexts that imply endorsement, negative portrayal, surveillance, or unsupported educational outcomes — Home V2 must remain trust-safe.

## Context

The project brief for v2.8 was provided in Chinese as "图片与素材策略". The user supplied candidate sources: Magnific, Pexels, and iStock, and explicitly said to avoid AI generation as much as possible. Current source findings: Pexels offers free photo/video use with attribution not required but has restrictions around endorsement, offensive portrayal, resale, redistribution, and trademarks; iStock is a paid licensing source with standard/extended license types and AI Generator content as a separate subscription path; Magnific is now a broader AI creative platform with stock assets and AI tools, so it should be treated as stock/enhancement support rather than the default source for generated hero imagery.

The project brief for v4.0 was provided in Chinese as "v4新版路由与组件骨架". The user chose a previewable skeleton depth rather than empty shells or a near-final page, chose to run research before requirements and roadmap, and chose version `v4.0`. This milestone starts Home V2 implementation by adding a separate preview route and component architecture while preserving current `/`. It should produce enough visible structure to validate the section rhythm and component boundaries, but it should not absorb final image optimization, full animation, finalized multilingual copy, or homepage switch-over.

v4.0 was completed on 2026-07-04. The current implementation provides `/home-v2`, `src/pages/home-v2/HomeV2Page.tsx`, `src/components/home-v2/`, provisional EN/DE/FR/IT `homeV2` resources, route smoke tests, and `docs/home/home-v2-route-component-handoff.md`. The current `/` homepage remains unchanged. Final asset insertion, motion choreography, final copy/localization, screenshot QA, and switching `/` remain future explicit milestones.

The project brief for v2.7 was provided in Chinese as the next Home V2 redesign milestone: "视觉方向设计". It follows the v2.6 locked Home V2 IA. The user explicitly asked to use the `high-end-visual-design` skill, so v2.7 should translate its premium craft rules into STOA's Swiss-parent education context: macro whitespace, editorial composition, double-bezel surfaces, nested CTA icon treatments, and custom motion curves, while overriding any parts that conflict with STOA frontend constraints such as avoiding decorative gradient orbs, one-note beige palettes, large scrolling backdrop blur, or generic luxury decoration.

The project brief for v2.6 was provided in Chinese after a Home V2 redesign discussion. The current public homepage should be preserved while a separate new design is planned. The agreed target is 70% Swiss private-school / high-end education service and 30% modern learning product. The homepage primary audience is Swiss parents evaluating learning support for their child; student, tutor, parent, and admin functional pages keep their own role-specific audiences. User-facing homepage language should downplay AI and continue using education-centered terms such as intelligent learning platform, Learning Assistant, teacher-backed support, parent visibility, and Start learning.

The project brief for Phase 17 was provided in Chinese and defines locale-specific copywriting, responsive typography, and multilingual UI refinement. Phase 16 established the English, German, French, and Italian i18n foundation, terminology system, glossary, copy style guide, and translation QA checklist. Phase 17 keeps that product surface stable but treats each language as local product copy rather than literal translation: German should be concise and stable, French elegant and clear, Italian natural and warm, and English calm, premium, and education-centered.

The immediate visible issue is the German homepage hero title `STOA Lernunterstützung genau dann, wenn Schüler sie brauchen.`, which is too long for large serif hero typography and should become short title copy plus explanatory subtitle. The preferred four-language hero direction is: English `Learn with clarity.`, German `Lernen. Fragen. Verstehen.`, French `Comprendre avec confiance.`, and Italian `Studiare con più chiarezza.`.

The project brief for Phase 18 was provided in Chinese and defines production-facing cleanup, stability hardening, and demo artifact removal. Phase 18 explicitly does not add product scope. It removes user-visible `demo`, `mock`, `test`, `Codex`, `development`, `sample`, `placeholder`, and internal-rule wording from existing UI, improves loading/error/empty/success states, hides demo-only UI behind environment flags, and keeps demo/backend internals available only to developers.

The project brief for Phase 19 was provided in Chinese and defines brand-aligned visual refinement based on the company homepage source at `/Users/zhdeng/newweb`. That source project is read-only for this milestone. Phase 19 should extract design signals such as burgundy/charcoal/warm-grey color, editorial Prata display typography, Inter UI text, restrained square button treatment, generous public-page spacing, and education photography tone, then translate those signals into a learning-platform design system that feels related but remains independent and app-like.

The project brief for Phase 20 was provided in Chinese and defines cross-locale copy refinement, German style alignment, and multilingual layout adaptation. Phase 20 continues the Phase 19 read-only source policy for `/Users/zhdeng/newweb`, but focuses on language rather than visual redesign: study the company homepage's German writing style, translate those style signals into STOA learning-platform German copy rules, refine English/French/Italian copy globally, and adapt UI layout so German long words, French apostrophes, Italian CTA length, and English education tone all work naturally across core pages.

The project brief for Phase 21 was provided in Chinese and defines accessibility, cross-browser QA, brand detail integration, and release quality gates. Phase 21 continues the strict read-only policy for `/Users/zhdeng/newweb`, but now extracts footer/contact/logo/contact-form information and adapts it into the learning platform while improving accessibility, keyboard navigation, screen-reader support, contrast, cross-browser/mobile QA, visual regression, performance sanity, and final pre-launch documentation.

The project brief for Phase 22 was provided in Chinese and defines final demo packaging, stakeholder review, and launch candidate preparation. Phase 22 explicitly does not add new product features. It packages the current STOA frontend into a stable demo/review set with fixed demo accounts, demo data/reset validation, audience-specific scripts, final copy/design/translation/API locks, release notes, known issues, next-stage backlog, launch-candidate approval, final demo run results, README handoff, and release branch rules.

The project brief for Phase 23 was provided in Chinese and defines launch-candidate bug fixing, final approval, and public demo release. Phase 23 explicitly does not expand functionality, product direction, page structure, copy scope, or design direction. It takes the Phase 22 launch candidate as the baseline, fixes only P0/P1 blockers and required final-approval items, reruns full demo and final smoke checks, prepares release handoff/monitoring/presentation docs, records Go/No-Go, and confirms public demo release readiness.

The project brief for Phase 25 was provided in Chinese and defines a local testing/demo provider integration milestone. Phase 24's Learning Assistant behavior-control design is treated as already completed context for this milestone: guided answers should avoid giving final answers first, respect student grade range and registered subjects, trigger professional teacher support when appropriate, and use a Python prompt harness for behavior control. Phase 25 turns that design into a working local demo path by adding a Codex provider adapter behind the demo backend/harness, a template fallback provider, provider health/readiness checks, behavior regression tests, full demo QA, and future production-provider handoff notes.

The project brief for Phase 32 was provided in Chinese and defines a global language quality and development-artifact cleanup milestone. Phase 32 explicitly does not add functionality or change product structure. It audits English, German, French, and Italian user-facing copy, checks for literal translations and UI overflow, removes user-visible development/demo/mock/Codex/backend/provider/placeholder language, verifies friendly state copy, and documents final language QA before real user testing preparation.

The project brief for Phase 36 was provided through a CI failure notification and follow-up instruction to comprehensively investigate and fix this class of issue. Phase 36 focuses on engineering quality and workflow reliability: GitHub Actions parity, local npm scripts, lint/build configuration, dependency and ignore hygiene, and documentation of the quality gates. It does not add product features, redesign UI, expand curriculum, or change backend/product behavior except where required to keep developer workflows reliable.

The project brief for Phase 37 was provided in Chinese and defines student-level Learning Assistant answer-language personalization. Students need a language option in their profile, and the Learning Assistant should answer in the corresponding saved student language. This milestone should preserve the existing four-language UI system while explicitly separating browser/interface language from a student's preferred answer language. It should update frontend profile/registration surfaces, typed contracts, the local demo backend, prompt harness input, template fallback behavior, and regression/QA evidence without adding new languages, production AI provider work, or formal backend architecture.

The project brief for v2.1 was provided in Chinese and defines Question Bank UI Design. Question Bank is an open, flexible exercise library for browsing and practicing question sets by subject, grade, topic, difficulty, question type, and review status. It complements the existing Practice Path, which remains the guided learning roadmap with lesson progression. v2.1 should deliver student-facing Question Bank routes, demo/mock data, local search/filter behavior, question-set overview, answer session, feedback, result, mistakes review, and clear Learning Assistant handoff. It should not build a production question-bank backend, AI-generated questions, image recognition, video help, live teacher joining, complex exam mode, production permissions, paid unlocking, or formal curriculum-standard mapping.

The project brief for v2.2 was provided in Chinese and defines Photo & File Upload UI Foundation. The milestone should make upload a learning-task entry point: students can bring a real worksheet, handwritten problem, screenshot, or PDF into STOA and ask the Learning Assistant for step-by-step help. v2.2 should unify upload components across Chat, Question Bank, and Practice Path; support preview, validation, status, remove, retry, mobile camera capture, desktop drag-and-drop, and four-language copy; and preserve a clear frontend/demo boundary. It should not build production object storage, real OCR, image recognition, handwriting/formula recognition, AI auto-solving, teacher grading, parent file review, admin file moderation, video help, or complex document management.

The project brief for v2.3 was provided in Chinese and defines Live Classroom & Video Help UI Foundation. The milestone should add an education-specific online classroom UI, not a generic meeting product: students can see and schedule upcoming classroom sessions, join a lobby, enter a Zoom-like classroom room, review a summary, and escalate from Learning Chat teacher text help into mock live video help. Tutors can see a classroom queue, review student context, and join tutor room flows. The implementation should be frontend UI plus mock/demo data flow only, with structure reserved for future WebRTC/video provider, scheduling backend, whiteboard, recording, billing, and admin operations work.

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
- **Phase 28 demo content focus**: Phase 28 selected equations as the first demo content package for the general Practice Path. It did not define the final Practice Path curriculum scope. Practice Path remains a general middle-school and high-school learning challenge system.
- **Phase 28 implementation boundary**: The work is frontend design, demo data, content QA, copy polish, and demo scenario stabilization only. Functionality should be just enough to test and present the UI flow; no production backend, adaptive learning, formal database, or large problem bank should be added.
- **Phase 28 pedagogy boundary**: Hints should be directional and age-appropriate, not final-answer reveals. Quadratic content should stay at recognition, simple factoring, zero-product solving, and checking; avoid formula derivations, discriminants, complex roots, vertex formulas, and calculus.
- **Phase 29 interaction boundary**: Practice Path refinements should focus on UI flow, route state, mock/demo contracts, visual clarity, and demo reliability. Do not expand course content, add production backend/database work, or turn STOA into a game.
- **Phase 29 Practice-to-Chat boundary**: Practice may pass challenge context into Learning Chat through frontend route state or mock API contracts, but the frontend must remain provider-agnostic and must not expose model/provider/debug terminology.
- **Phase 29 gamification boundary**: Adopt smooth progress, immediate feedback, and short-session clarity; avoid punitive hearts, leaderboards, shops, gems, loud celebrations, and streak pressure that distracts from learning.
- **Phase 30 scope lock**: Phase 30 packages and validates the existing demo story. It must not add new curriculum themes, production backend/database/CMS/payment/teacher scheduling work, or large UI redesign.
- **Phase 30 demo curriculum lock**: The final demo curriculum package remains Mathematics equations for lower-secondary learners, but this lock applies only to the demo package. It does not restrict the long-term Practice Path scope.
- **Phase 30 external testing boundary**: Testing materials and feedback capture can prepare external review, but they do not implement formal research operations, analytics pipelines, CRM systems, or production data collection.
- **Phase 30 product story boundary**: Product storytelling should make the Practice -> Hint -> Learning Chat -> Teacher Support -> Parent Report flow understandable without exposing mock/demo/backend/provider terminology to external audiences.
- **Phase 31 positioning boundary**: Practice Path is a low-friction student learning entry, not a replacement for Learning Chat, teacher support, Parent Report, or STOA's broader learning platform positioning.
- **Question Bank positioning**: v2.1 Question Bank is a flexible exercise library for open practice; it must not duplicate Practice Path's guided roadmap progression or make STOA feel like a generic exam system.
- **Question Bank implementation boundary**: v2.1 is UI plus demo/mock data flow only; production question-bank backend, AI-generated items, image recognition, video help, live teacher joining, paid unlocking, complex exam mode, production permissions, and formal curriculum-standard mapping are deferred.
- **Upload positioning**: v2.2 upload is a learning-task entry into Chat, Question Bank, and Practice Path, not a generic file manager or permanent file library.
- **Upload implementation boundary**: v2.2 is frontend UI, validation, preview, mock/demo upload state, and context handoff only; production object storage, OCR, image understanding, virus scanning, teacher grading, parent review, admin moderation, and formal file retention policies remain future backend/product scope.
- **Upload privacy copy**: User-facing upload UI should ask for learning materials only and avoid unsupported claims about permanent storage, encryption, image reading, or automatic solving.
- **Phase 31 public navigation boundary**: Practice should not be added as a top-level public navbar item unless a specific product reason is documented; it belongs primarily in authenticated student navigation and homepage explanation.
- **Phase 31 implementation boundary**: Phase 31 may add frontend components, route-state/mock contracts, copy, docs, and QA, but must not add formal backend/database/CMS/payment infrastructure or broad curriculum expansion.
- **Phase 31 gamification boundary**: Keep progress, hints, and short practice sessions calm and education-centered; do not add shops, gems, hearts, cartoon rewards, leaderboards, or game-first CTAs.
- **Phase 31 research guidance**: Webpage organization should follow the Phase 31 research note: define IA before navigation, keep public navigation task-oriented, make homepage Practice a concrete example, prioritize role dashboards by next action, and add explicit wayfinding for Practice-to-Chat flows.
- **Phase 32 scope lock**: Phase 32 is a language QA and development-artifact cleanup milestone only. It must not add new features, new pages, new languages, curriculum expansion, backend/database work, product-structure changes, or broad UI redesign.
- **Phase 32 user-facing cleanup target**: Forbidden/high-risk terms are prohibited in user-facing UI, but may remain in developer docs, tests, internal code identifiers, and hidden debug infrastructure when technically accurate.
- **Phase 32 locale quality**: English should remain calm and education-centered, German should be natural and concise, French should use correct apostrophes and clear phrasing, and Italian should be warm, natural, and compact enough for UI.
- **Phase 33 homepage entry scope**: Phase 33 may refine homepage Practice entry UI, CTA routing, four-language copy, docs, demo flow, and QA evidence, but must not add new Practice subjects, expand curriculum, rebuild Learning Chat, redesign Parent Report, add backend/database work, or introduce complex gamification.
- **Phase 33 Duolingo inspiration boundary**: Duolingo is a mechanism reference for short practice, visible progress, immediate feedback, and motivation only. STOA must not copy Duolingo code, brand, visual style, mascot cues, green palette, reward economy, streak pressure, hearts, gems, leaderboards, shops, or user-facing "Duolingo-style" wording.
- **Phase 33 product hierarchy**: Practice is one entry into the learning platform. Learning Chat remains the core explanation surface, Professional Teacher Support remains the escalation layer, and Parent Report remains the visibility layer.
- **Phase 33 CTA routing**: Homepage Start Practice should send unauthenticated users to `/login?next=/practice`, students to `/practice`, parents to `/parent`, tutors to `/tutor`, admins to `/admin`, and organization roles to their existing organization home.
- **Phase 33 localization fit**: Practice entry labels and preview copy must be verified in English, German, French, and Italian on mobile and desktop; long German/French CTAs should wrap or shorten safely instead of shrinking typography.
- **Phase 34 Practice Path scope principle**: Practice Path is designed as a general middle-school and high-school learning challenge system. The equation path is only the first demo content package used to demonstrate lesson structure, hint flow, Learning Chat transition, teacher escalation, and parent visibility.
- **Phase 34 subject-agnostic implementation rule**: Frontend types, routes, components, mock data, and API contracts must not hard-code equations as the only possible learning path. The canonical hierarchy is Practice Path -> Subject -> Grade level -> Topic -> Unit -> Lesson -> Challenge.
- **Phase 34 model decision**: Canonical demo seed data uses `subjectId: mathematics`, `gradeLevel: lower_secondary`, and `topicId: equations`; the legacy `math` id may be tolerated only as a compatibility alias.
- **Phase 34 route decision**: Canonical Practice topic routes use `/practice/:subjectId/:topicId`; subject-only Practice routes remain compatibility paths during migration.
- **Phase 34 copy decision**: User-facing Practice copy should say school-topic challenges or Practice Path; equation wording belongs only in available-now/current-demo labels or the demo challenge content itself.
- **Phase 35 Practice roadmap scope**: Phase 35 improves the Practice page's route-map, progression, lesson-node, and CTA experience. It must not add new subjects, large new lesson banks, production backend/database work, adaptive-learning algorithms, reward economies, shops, gems, mascot systems, or game-first visual language.
- **Phase 35 roadmap data rule**: Roadmap types and demo data should preserve the Practice Path hierarchy: Practice -> Subject -> Grade level -> Topic -> Unit -> Lesson node -> Challenge. Mathematics / lower secondary / equations is the only implemented demo roadmap for this milestone.
- **Phase 35 node-state rule**: Lesson nodes should support completed, current, available, locked, and review states. Locked nodes should explain the unlock condition instead of starting a lesson.
- **Phase 35 visual direction**: The roadmap should create a clear sense of progression through stable node spacing, connectors, and current-lesson emphasis while using restrained STOA premium colors rather than high-saturation cartoon-game styling.
- **Phase 35 Learning Chat relationship**: Roadmap copy should reinforce that Practice is a path into guided explanations; when students get stuck, Learning Chat explains the unclear step.
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
- **Phase 36 scope**: Phase 36 is an engineering-quality milestone only. It may change CI, lint, build, scripts, dependency metadata, documentation, and narrowly related source configuration, but it must not add product features or broad UI changes.
- **Phase 36 CI parity**: Local verification should mirror `.github/workflows/frontend-ci.yml` as closely as practical: dependency install parity, `npm run lint`, and `npm run build`.
- **Phase 36 dependency safety**: New dependencies should be avoided unless a reproducible tooling gap requires them; lockfile and package metadata must remain consistent.
- **Phase 36 generated-file hygiene**: `node_modules/`, `dist/`, local environment files, test artifacts, and browser reports must remain uncommitted unless explicitly intended as source-controlled documentation.
- **Phase 37 language preference scope**: Phase 37 adds a student-level Learning Assistant answer-language preference for the supported English, German, French, and Italian languages only. It must not add new languages, automatic translation services, production model-provider orchestration, or broad UI localization rewrites.
- **Phase 37 interface-vs-answer-language boundary**: Browser UI language from `stoa_language` and student answer language are related but distinct. The UI may default intelligently, but saved student profile preference should govern Learning Assistant answer language once available.
- **Phase 37 provider boundary**: The frontend must continue to call STOA backend APIs only. Prompt language rules, provider request metadata, template fallback, behavior checks, and repair/fallback handling belong in the backend/demo harness layer.
- **Phase 37 demo backend boundary**: SQLite/demo backend changes are for local/demo verification and API-contract proving only; production persistence, migrations, and cross-device preference syncing remain future backend responsibilities.
- **GitHub**: The intended remote is `https://github.com/stoasystem/stoa-frontend`, but remote setup depends on repository access and should be verified before push.
- **Home V2 preservation boundary**: v2.6 must keep the current `/` homepage unchanged and define Home V2 as a separate route and namespace until a later explicit switch decision.
- **Home V2 audience boundary**: The public homepage narrative is for Swiss parents first; student, tutor, admin, and parent app surfaces keep their role-specific UX and must not be collapsed into one marketing audience.
- **Home V2 language boundary**: Homepage copy should not foreground AI, instant solving, guaranteed improvement, or teacher replacement. It should frame STOA as calm, teacher-backed, intelligent learning support for Swiss families.
- **Home V2 implementation boundary**: v2.6 is positioning and IA only. Visual implementation, image insertion, animation, route code, localization files, and browser QA are later milestones unless explicitly pulled forward.
- **Home V2 asset-source boundary**: v2.8 defines image and asset strategy only. It may evaluate sources, define search briefs, and document candidate criteria, but it must not commit final image binaries, insert assets into code, or replace the current `/` homepage.
- **Home V2 AI-image boundary**: v2.8 should avoid AI-generated assets by default. AI generation may be considered only as a last resort for non-identifiable abstract/product-support imagery, and AI upscaling/enhancement must be recorded in asset metadata.
- **Home V2 licensing boundary**: Every candidate asset needs source URL, license type, creator/source name when available, model/property-release risk notes, permitted use notes, and final approval status before implementation.
- **Home V2 visual direction boundary**: v2.7 defines design rules and blueprints only. It must not implement React route code, add final assets, change `/`, add localized copy files, or run browser visual QA for non-existent components.
- **High-end visual adaptation**: v2.7 may adopt macro whitespace, editorial split composition, double-bezel surfaces, nested CTA icon treatment, and custom cubic-bezier motion from `high-end-visual-design`, but must reject any guidance that conflicts with project constraints, including decorative gradient orbs, large scrolling blur, generic one-note beige/purple/blue palettes, nested cards, and unsupported icon/font swaps.
- **Home V2 v4.0 implementation boundary**: v4.0 adds only the isolated `/home-v2` route, component skeleton, provisional i18n resources, route smoke coverage, and handoff documentation. It must not replace `/`, treat candidate assets as final, add full animation choreography, finalize localized copy, or claim screenshot/visual approval.

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
| Keep Phase 28 equation demo-only | A focused equation path is credible for a 3-5 minute demo, but it is only the first demo package inside the broader Practice Path system | — Pending |
| Treat Practice content polish as frontend demo design | Phase 28 should improve UI/content/demo quality without adding real backend, database, adaptive learning, or large content systems | — Pending |
| Keep hints directional rather than answer-revealing | Practice should teach the next reasoning step and let the student retry before exposing a final solution | — Pending |
| Make Practice a Learning Chat entry point | Phase 29 should connect students to guided explanations at the moment they get stuck, instead of treating Practice and Chat as separate products | — Pending |
| Prefer stable interaction loops over heavier gamification | Research supports immediate feedback and multiple-try hints, while Duolingo-style gamification can distract from learning when rewards become the goal | — Pending |
| Keep teacher support as escalation, not primary help | Learning Assistant context should come before professional teacher support unless the student repeatedly struggles or explicitly asks for human explanation | — Pending |
| Keep Phase 30 as demo packaging, not feature expansion | The next value is a clear external product story, testing kit, and curriculum/backend handoff, not more UI surfaces or curriculum breadth | — Pending |
| Lock the final demo package around equations | Equations are familiar to parents, easy to scaffold step by step, and strong for showing hints, guided explanations, and teacher escalation; this must not be read as final Practice Path scope | — Pending |
| Treat external testing as structured feedback preparation | Phase 30 should prepare task sheets and feedback forms so later testing is consistent, without building a production research platform | — Pending |
| Keep Phase 31 focused on Practice as entry, not product replacement | Practice should create a natural starting point for students while Learning Chat, professional teacher support, and Parent Report remain the main STOA learning-platform hierarchy | — Pending |
| Research IA and webpage organization before page changes | Phase 31 needs homepage, dashboard, role navigation, wayfinding, and Q&A decisions grounded in IA and UX research rather than visual preference alone | — Pending |
| Keep public navigation task-oriented and uncluttered | Practice is primarily a student app capability, so the public site should explain it without adding a top-level public Practice island | — Pending |
| Make Phase 32 an audit and cleanup pass, not feature work | The product structure is already integrated; the next risk is language trust, translation quality, and visible development residue | v1.30 Complete |
| Skip external research for Phase 32 | The user provided a precise audit scope and the milestone does not introduce new product capabilities requiring ecosystem research | v1.30 Complete |
| Treat user-visible copy as the source of truth for product trust | Developer docs and code can retain technical terms, but visible UI must read like a stable education product | v1.30 Complete |
| Make Practice a clearer homepage entry without making STOA game-first | Research supports short challenges, visible progress, hints, and immediate feedback as motivating, but STOA's trust model depends on Learning Chat, teacher support, and Parent Report remaining visible | — Pending |
| Keep Phase 33 frontend-only and route/copy/UI focused | The funnel problem is homepage clarity and CTA routing, not curriculum depth, backend persistence, or new Learning Assistant capability | — Pending |
| Use Duolingo-inspired mechanics only as interaction inspiration | STOA can borrow short-session cadence and feedback clarity while avoiding Duolingo brand/visual/reward systems and game-first public language | — Pending |
| Make Practice feel like a learning path, not a question list | Students need to understand current position, completed lessons, next step, locked content, and why continuing matters | — Pending |
| Keep the roadmap subject-agnostic | Phase 34 established the general Practice hierarchy, so Phase 35 must not regress into an equation-only roadmap implementation | — Pending |
| Use restrained progression cues instead of cartoon rewards | STOA needs motivation and momentum while preserving a premium, trustworthy education-platform tone | — Pending |
| Keep Phase 36 focused on engineering quality | The current risk is a failing CI gate and possible local/CI configuration drift, so the milestone should harden developer workflows before more product work | — Pending |
| Treat CI parity as release reliability | A frontend demo can look complete but still be unsafe to iterate if `npm ci`, lint, or build diverge between local and GitHub Actions | — Pending |
| Fix tooling boundaries at configuration level first | Node scripts, browser source, test files, and config files need correct ESLint/TypeScript environments instead of one-off suppressions where a shared config can express intent | — Pending |
| Treat student answer language as profile data | Learning Assistant response language should follow the student being helped, not only the current browser UI language or provider default | — Pending |
| Keep answer-language enforcement in backend/harness flow | The frontend can collect preference, but the backend and prompt harness must own response-language instructions so streaming, fallback, and future providers stay consistent | — Pending |
| Keep Question Bank separate from Practice Path | Question Bank should support open, filterable practice by subject/topic/difficulty, while Practice Path remains the guided roadmap and lesson progression experience | — Pending |
| Keep v2.1 mock/demo-backed | The milestone needs credible UI and interaction design now, while production item storage, permissions, exam logic, generated questions, and deep curriculum mapping require later backend/product scope | — Pending |
| Keep uploads context-bound, not library-style | Research shows the strongest fit is tutor/chat or assignment-context upload, so STOA uploads should attach to Chat, Question Bank questions, or Practice schoolwork help rather than become a storage product | v2.2 Complete |
| Reuse a shared upload module | The repo already has Chat upload behavior; v2.2 should consolidate validation, preview, status, and retry into `src/features/uploads/` instead of adding separate page-specific implementations | v2.2 Complete |
| Avoid OCR and instant-solve claims | Camera-solver competitors emphasize recognition, but v2.2 only proves the upload UX and Learning Assistant handoff, so copy must not overpromise unimplemented image understanding | v2.2 Complete |
| Make classroom learning-specific | v2.3 should adapt video-room patterns around tutoring context, shared problems, materials, notes, and next steps instead of cloning a generic meeting room | v2.3 Complete |
| Keep video provider work deferred | The milestone validates UI and flow before choosing WebRTC, Daily, Twilio, Agora, Zoom SDK, LiveKit, or any other real-time media stack | v2.3 Complete |
| Preserve the support ladder | Learning Chat should remain the first help surface, tutor text help is the next escalation, and live video classroom should appear when deeper synchronous support is needed | v2.3 Complete |
| Treat v2.4 as refinement, not expansion | The milestone should integrate recently added modules through copy, hierarchy, shared states, and responsive polish without adding large routes, production backend work, OCR, WebRTC, billing, or new visual direction | v2.4 Complete |
| Prefer Practice Library in student UI | Student-facing Question Bank surfaces should read as Practice Library because it is calmer and more learning-oriented, while existing routes and internal module naming can remain `question-bank` | v2.4 Complete |
| Keep support language credible | Upload and classroom copy must avoid OCR, instant solution, AI teacher, human fallback, Zoom, recording, billing, and guaranteed-improvement claims unless those capabilities exist | v2.4 Complete |
| Simplify Online Classroom as a learning workspace | User testing showed the classroom UI was too cluttered; v2.5 should reduce repeated cards and make shared problem, whiteboard, materials, and tutor context the primary experience | v2.5 Complete |
| Keep v2.5 frontend/mock-only | The redesign validates UI hierarchy and manual testing flow without adding WebRTC, production scheduling, tutor matching, billing, recording, or provider SDK work | v2.5 Complete |
| Start Home V2 as a separate route | The current homepage should remain stable while the redesigned Swiss-parent homepage is planned, built, reviewed, and later switched only by explicit decision | — Pending |
| Make Swiss parents the homepage's first audience | Parents are the primary public buyer/evaluator, while students, tutors, admins, and existing parent app users each keep role-specific pages | — Pending |
| Use a learning-thread IA instead of feature-card accumulation | The current homepage feels cluttered because features compete equally; Home V2 should present one family learning story from stuck homework to next step, tutor support, and parent visibility | — Pending |
| Keep AI out of hero-level positioning | The agreed brand direction is an intelligent learning platform with teacher-backed support, not an AI homework tool or instant solver | — Pending |
| Use high-end visual design as craft input, not a literal template | The skill raises visual craft through editorial composition, double-bezel surfaces, macro whitespace, and motion, but STOA still needs Swiss education restraint and project-specific frontend constraints | — Pending |
| Prefer Editorial Luxury plus Editorial Split for Home V2 | The Swiss-parent homepage needs calm high-end education credibility with a strong family image/narrative split rather than a dark SaaS or playful product layout | — Pending |
| Keep Home V2 visual direction separate from app surfaces | Public homepage polish should not leak large hero typography, decorative panels, or cinematic spacing into dense student/tutor/admin workflows | — Pending |
| Build Home V2 as a previewable skeleton before final polish | The next implementation risk is route/component architecture and layout rhythm, while final images, animation, localized copy, screenshots, and homepage replacement need separate approval gates | v4.0 Complete |
| Keep `/home-v2` isolated from `/` | The current homepage remains the stable public surface until the new page has implementation, asset, animation, copy, localization, and QA approval | v4.0 Complete |
| Make Parent Confidence an emotional reassurance section | The section should express parents staying close without anxious intervention, so v6.1 should reduce dashboard language and replace feature pills with one quiet progress note | v6.1 Pending |

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
*Last updated: 2026-07-05 after starting v6.1 Home V2 Parent Confidence redesign*
