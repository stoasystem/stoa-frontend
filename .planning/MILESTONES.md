# Milestones

## v6.6 Home V2 V6 Completion Handoff (Shipped: 2026-07-06)

**Phases completed:** 5 phases, 5 plans, 0 code tasks
**Status:** Complete
**Audit:** `.planning/milestones/v6.6-MILESTONE-AUDIT.md`
**Depends on:** v6.5 Home V2 Final Photography Procurement Pack
**Known deferred items at close:** final public photography acquisition/implementation, runtime FR/IT enablement, SEO/routing/rollback, and public `/` switch-over remain future v7 or switch-over scope.

**Key accomplishments:**

- Closed the v6 Home V2 track as a preview/design/procurement program.
- Produced a final v6 completion report summarizing v6.1-v6.5.
- Recorded current `/home-v2` runtime route, components, images, locales, and test coverage.
- Consolidated asset readiness and final-public approval states.
- Defined switch-over gates before `/home-v2` can replace `/`.
- Produced a v7 next-program brief.

### Verification

- `roadmap.analyze`: required before commit.
- `git diff --check`: required before commit.
- No runtime code or image binary changes were made.
- Current `/` remains unchanged.

---

## v6.5 Home V2 Final Photography Procurement Pack (Shipped: 2026-07-06)

**Phases completed:** 5 phases, 5 plans, 0 code tasks
**Status:** Complete
**Audit:** `.planning/milestones/v6.5-MILESTONE-AUDIT.md`
**Depends on:** v6.4 Home V2 Final Hero Parent Photography Approval
**Known deferred items at close:** actual paid-stock purchase, commissioned shoot execution, final image optimization, final image implementation, and public `/` switch-over remain future scope.

**Key accomplishments:**

- Defined the procurement decision path: paid stock, commissioned photography, or explicit temporary-public approval of current preview images.
- Created license/release guardrails for iStock/Getty, Pexels/Unsplash, commissioned work, and AI-generated non-face details.
- Created final Hero and Parent Confidence photography art direction.
- Created paid stock search routes, query variants, scoring guide, and review CSV template.
- Created a commissioned shoot package with shot list, wardrobe, location, props, releases, usage rights, and delivery specs.
- Created the final approval workflow and future implementation checklist.

### Verification

- `roadmap.analyze`: required before commit.
- `git diff --check`: required before commit.
- No runtime code or image binary changes were made.
- No paid/watermarked asset was committed.

---

## v6.4 Home V2 Final Hero Parent Photography Approval (Shipped: 2026-07-06)

**Phases completed:** 5 phases, 5 plans, 0 code tasks
**Status:** Complete
**Audit:** `.planning/milestones/v6.4-MILESTONE-AUDIT.md`
**Depends on:** v6.3 Home V2 Final Visual QA And Image Readiness
**Known deferred items at close:** paid iStock/Getty purchase, commissioned Swiss/European photography, final image optimization, and public `/` switch-over remain future scope.

**Key accomplishments:**

- Defined final Hero and Parent Confidence photography acceptance contracts.
- Ran a targeted source review across the existing Pexels/Unsplash candidate pool, accessible Unsplash search routes, and link-only iStock paid routes.
- Created a v6.4 candidate ledger with source, license, AI, fit, crop, endorsement, and decision notes.
- Evaluated current and backup candidates against real `/home-v2` Hero and Parent frames.
- Decided not to replace current preview images because no free candidate clearly improved final-public quality.
- Produced a final handoff: current images are preview-approved, not final-public approved; `/` should not be replaced yet.

### Verification

- Documentation and ledger verification passed.
- No runtime code or image binary changes were made.
- No paid/watermarked asset was committed.
- `git diff --check`: run before commit.

---

## v6.3 Home V2 Final Visual QA And Image Readiness (Shipped: 2026-07-06)

**Phases completed:** 5 phases, 5 plans, 0 code tasks
**Status:** Complete
**Audit:** `.planning/milestones/v6.3-MILESTONE-AUDIT.md`
**Depends on:** v6.2 Home V2 Trust And Assurance Redesign
**Known deferred items at close:** final Hero/Parent paid or commissioned photography, runtime FR/IT enablement, rendered FR/IT visual QA, and public `/` switch-over remain future scope.

**Key accomplishments:**

- Audited `/home-v2` as a full Swiss-parent cinematic homepage across desktop, tablet, mobile, and EN/DE runtime language states.
- Created v6.3 asset briefs and shortlist/ledger covering real photography, non-face AI detail opportunities, paid-stock link-only candidates, and Apple motion/design references.
- Fixed the blank full-page screenshot/reveal robustness issue by making Home V2 reveal content visible by default.
- Added scroll-margin polish to Home V2 target sections and softened the Parent Confidence image treatment.
- Documented Apple-like cinematic motion direction and added a subtle Final CTA material breathing light with reduced-motion coverage.
- Produced readiness judgment: ready to prepare switch-over after final asset approval, but `/` was not replaced.

### Verification

- `npm run lint`: passed.
- `npm run build`: passed with existing Vite chunk size warning.
- `npm run test:e2e -- home-v2.spec.ts`: passed, 2/2 tests.
- Final screenshots: `/private/tmp/stoa-home-v2-v6-3/261/en-desktop-full.png`, `/private/tmp/stoa-home-v2-v6-3/261/en-mobile-full.png`, `/private/tmp/stoa-home-v2-v6-3/261/de-mobile-full.png`.

---

## v6.2 Home V2 Trust And Assurance Redesign (Shipped: 2026-07-05)

**Phases completed:** 5 phases, 5 plans, 0 code tasks
**Status:** Complete
**Audit:** `.planning/milestones/v6.2-MILESTONE-AUDIT.md`
**Depends on:** v6.1 Home V2 Parent Confidence Redesign
**Known deferred items at close:** final paid/commissioned Trust photography, public `/` replacement, full homepage copy pass, and visual regression automation remain future scope.

**Key accomplishments:**

- Replaced the previous Trust feature-card grid with one image-led editorial assurance section.
- Removed repeated "Swiss trust" language and loud privacy/compliance-style claims from the section.
- Added four fine-line assurance principles: enough context, clear boundaries, discussable progress, and no inflated promises.
- Updated English, German, French, and Italian `homeV2` Trust copy.
- Added scoped Trust styling, mobile-first ordering, a restrained caption light, and Home V2 E2E assertions.

### Verification

- `npm run lint`: passed.
- `npm run build`: passed with existing Vite chunk size warning.
- `npm run test:e2e -- home-v2.spec.ts`: passed, 2/2 tests.
- Responsive screenshots: `/private/tmp/stoa-home-v2-v6-2/trust-desktop.png`, `/private/tmp/stoa-home-v2-v6-2/trust-narrow.png`, `/private/tmp/stoa-home-v2-v6-2/trust-mobile.png`.

---

## v6.1 Home V2 Parent Confidence Redesign (Shipped: 2026-07-05)

**Phases completed:** 4 phases, 4 plans, 0 code tasks
**Status:** Complete
**Audit:** `.planning/milestones/v6.1-MILESTONE-AUDIT.md`
**Depends on:** v4.0 Home V2 route/component skeleton and current `/home-v2` preview implementation
**Known deferred items at close:** final paid/commissioned photography, full homepage copy pass, full-page motion choreography, Trust/Assurance redesign, visual regression suite, and replacing `/` remain future scope.

**Key accomplishments:**

- Reframed Parent Confidence around parent emotional relief rather than product-dashboard visibility.
- Replaced the multi-pill overlay with one restrained weekly note proof surface.
- Updated English, German, French, and Italian `homeV2` copy for the section.
- Added scoped Home V2 parent-note styling, mobile top spacing, and reduced-motion handling.
- Added Home V2 E2E assertion for the new parent note and verified desktop/tablet/mobile screenshots.

### Verification

- `npm run lint`: passed.
- `npm run build`: passed with existing Vite chunk size warning.
- `npm run test:e2e -- home-v2.spec.ts`: passed, 2/2 tests.

## v4.0 新版路由与组件骨架 (Shipped: 2026-07-04)

**Phases completed:** 4 phases, 4 plans, 0 code tasks
**Status:** Complete
**Audit:** `.planning/milestones/v4.0-MILESTONE-AUDIT.md`
**Depends on:** v3.1 Home V2 Candidate Image Search And Shortlist
**Known deferred items at close:** final image crop/optimization, WebP/AVIF variants, paid/commissioned Hero photography, full motion choreography, final EN/DE/FR/IT copywriting, screenshot/visual regression approval, and replacing `/` remain future scope.

**Key accomplishments:**

- Added isolated `/home-v2` public preview route while preserving `/`.
- Added `src/pages/home-v2/HomeV2Page.tsx` and `src/components/home-v2/` section namespace.
- Added provisional `homeV2` i18n namespace and EN/DE/FR/IT copy files.
- Built previewable five-section skeleton: Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, Final CTA.
- Added route/component handoff documentation and focused Playwright smoke coverage.

### Verification

- Phase 244-247 verification artifacts passed.
- Milestone audit passed with 15/15 requirements covered.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:e2e -- home-v2.spec.ts`: passed, 2/2 tests.

---

## v3.1 Home V2 Candidate Image Search And Shortlist (Shipped: 2026-07-03)

**Phases completed:** 4 phases, 4 plans, 0 code tasks
**Status:** Complete
**Audit:** `.planning/v3.1-MILESTONE-AUDIT.md`
**Depends on:** v2.8 Home V2 Image And Asset Strategy
**Known deferred items at close:** iStock purchase, Magnific account/API use, final crop optimization, WebP/AVIF variants, alt text localization, React Home V2 implementation, screenshot QA, and replacing `/` remain future scope.

**Key accomplishments:**

- Searched and shortlisted Home V2 candidate imagery against the v2.8 source strategy.
- Downloaded 7 traceable Pexels JPEG candidates into `img/home-v2/candidates/pexels/`.
- Created a metadata ledger with local paths, source URLs, license URLs, creators/vendors, roles, scores, AI status, approval state, and risk notes.
- Applied the v2.7 high-end visual direction to select a first-pass Hero candidate and supporting section candidates.
- Kept paid/source-gated iStock and Magnific paths approval-gated and did not modify current `/`, React code, routing, or localization files.

### Verification

- Phase 240-243 verification artifacts passed.
- Milestone audit passed with 16/16 requirements covered.
- Downloaded image file checks passed for JPEG type and dimensions.
- `git diff --check`: passed.

---

## v2.8 Home V2 Image And Asset Strategy (Shipped: 2026-07-03)

**Phases completed:** 4 phases, 4 plans, 0 code tasks
**Status:** Complete
**Audit:** `.planning/v2.8-MILESTONE-AUDIT.md`
**Depends on:** v2.7 Home V2 Visual Direction Design
**Known deferred items at close:** Actual source search execution, final asset shortlist approval, paid asset purchase, image download, binary asset commit, React implementation, localized copy, browser screenshot QA, and replacing `/` remain future scope.

**Key accomplishments:**

- Prioritize real licensed photography and stock assets over AI-generated imagery.
- Establish source and license rules for Pexels, iStock, Magnific stock, and similar sources.
- Define section-specific asset briefs for Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, and Final CTA.
- Define search taxonomy, candidate scoring, metadata ledger fields, crop ratios, storage namespace, and approval gates.
- Prepare later Home V2 implementation to insert optimized, licensed assets without reopening visual direction.

### Verification Plan

- Phase 236-239 verification artifacts passed.
- Milestone audit passed with 16/16 requirements covered.
- `git diff --check`: passed.

---

## v2.7 Home V2 Visual Direction Design (Shipped: 2026-07-03)

**Phases completed:** 4 phases, 4 plans, 0 code tasks
**Status:** Complete
**Audit:** `.planning/v2.7-MILESTONE-AUDIT.md`
**Depends on:** v2.6 Home V2 Positioning and Information Architecture
**Known deferred items at close:** Home V2 route/component implementation, image sourcing or generation, asset insertion, animation implementation, final EN/DE/FR/IT copy, localization JSON, browser screenshot QA, and replacing `/` remain future scope.

**Key accomplishments:**

- Translate the v2.6 Swiss-parent-first IA into a high-end visual thesis for STOA.
- Adapt `high-end-visual-design` craft rules to STOA's education context without generic luxury decoration.
- Define typography roles, color behavior, spacing, surfaces, CTA treatment, nav treatment, and section rhythm for Home V2.
- Define section-level composition, imagery expectations, and motion choreography for Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, and Final CTA.
- Capture responsive, accessibility, performance, localization, and implementation handoff guardrails for later build milestones.

### Verification

- Phase 232-235 verification artifacts passed.
- Milestone audit passed with 16/16 requirements covered.
- `git diff --check`: passed.

---

## v2.6 Home V2 Positioning and Information Architecture (Shipped: 2026-07-03)

**Phases completed:** 4 phases, 4 plans, 0 code tasks
**Audit:** `.planning/v2.6-MILESTONE-AUDIT.md`
**Known deferred items at close:** Home V2 visual design, image sourcing/generation, animation choreography, final copywriting, EN/DE/FR/IT localization files, React implementation, browser screenshots, and replacing `/` remain future scope.

**Key accomplishments:**

- Locked Swiss parents as the primary public homepage audience while preserving role-specific app audiences.
- Defined STOA's Home V2 promise as calm, teacher-backed intelligent learning support for Swiss families.
- Inventoried current homepage sections and assigned keep, merge, demote, delete, rewrite, or reassess dispositions.
- Defined a shorter five-section Home V2 IA: Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, Final CTA.
- Recommended `/home-v2`, `src/components/home-v2/`, `src/pages/home-v2/`, `homeV2`, and optional `img/home-v2/` namespace boundaries.
- Mapped `Start learning` CTA behavior and documented free-user trial quota semantics without making quota the hero message.
- Captured English, German, French, and Italian IA guardrails before later copy and design work.

### Verification

- Phase 228-231 verification artifacts passed.
- Milestone audit passed with 16/16 requirements covered.
- `git diff --check`: passed.

---

## v2.5 Online Classroom Focused Redesign (Shipped: 2026-06-02)

**Phases completed:** 3 phases, 3 plans, 0 tasks
**Known deferred items at close:** Real WebRTC/video provider integration, production scheduling, tutor matching, production whiteboard, recording, screen share, transcript, billing, admin classroom operations, and native translation review remain future scope.

**Key accomplishments:**

- Simplified Online Classroom home into one focused live-support surface with compact upcoming-session state.
- Refactored Schedule Classroom into request, session focus, date/time, context/materials, and sticky session preview.
- Reworked lobby into a single readiness flow with tutor, device check, context, status, and join/back actions.
- Redesigned room hierarchy around Shared Problem and Focus Board / Shared Whiteboard, with video as a compact rail.
- Replaced crowded room controls with compact icon-led accessible actions.
- Added Learning History handoff to classroom summary and tightened tutor/parent classroom surfaces.
- Updated live-classroom E2E assertions for the simplified flow.

### Verification

- Browser checks passed for classroom home, schedule, lobby, room, and summary with no horizontal overflow.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:e2e -- live-classroom.spec.ts`: passed, 5/5 tests.

---

## v2.4 UI Copy & Web Design Refinement (Shipped: 2026-06-02)

**Phases completed:** 6 phases, 6 plans, 0 tasks
**Audit:** `.planning/v2.4-MILESTONE-AUDIT.md`
**Known deferred items at close:** Production OCR/image understanding, real WebRTC/video provider integration, production scheduling, tutor matching, billing, recording, transcription, screen share, parent observer controls, native translation review, and large visual redesign remain future scope.

**Key accomplishments:**

- Reorganized Student Dashboard into Continue Learning, Need Help, Today's Practice, Live Support, and Recent Activity with clearer CTA taxonomy.
- Renamed student-facing Question Bank surfaces to Practice Library while preserving existing `/question-bank` routes and internal service boundaries.
- Refined Practice Library home, question set, session, result, saved-set, and mistakes-review copy toward supportive learning language.
- Tightened Upload a Question and Learning Chat copy to avoid OCR, scan-and-solve, instant-solution, AI-teacher, or image-reading claims.
- Refined Chat escalation states to Tutor support requested, Tutor joined, Learning Assistant observing, and Start Live Classroom.
- Refined Online Classroom home, lobby, room, tutor queue, parent visibility, and summary around learning context, materials, notes, and next steps.
- Added shared ContextCard and NextStepCard patterns plus expanded EmptyState, ErrorState, and LoadingState support.
- Added v2.4 Playwright coverage and updated uploads/chat/classroom E2E assertions.

### Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:e2e -- uploads.spec.ts student-chat.spec.ts live-classroom.spec.ts v2.4-ui-refinement.spec.ts`: passed, 14/14 tests.

---

## v2.3 Live Classroom & Video Help UI Foundation (Shipped: 2026-06-02)

**Phases completed:** 7 phases, 7 plans, 0 tasks
**Audit:** `.planning/v2.3-MILESTONE-AUDIT.md`
**Known deferred items at close:** Real WebRTC/video provider integration, backend room tokens, real media preview, production scheduling, tutor matching, notifications, calendar sync, attendance, billing, recording, transcript/replay, screen share, production whiteboard, parent observer mode, and admin classroom operations remain future scope.

**Key accomplishments:**

- Added `src/features/live-classroom/` with typed classroom contracts, deterministic mock data, async services, query keys, hooks, room state, and formatting utilities.
- Added student Online Classroom dashboard entry, classroom home, scheduling flow with upload-material reuse, lobby, mock room, controls, side panels, learning workspace, and summary.
- Added Learning Chat teacher-text-to-video escalation into an instant classroom lobby with context-preserving mock session creation.
- Added tutor classroom queue, lobby, room, summary routes, and tutor dashboard entry.
- Added parent classroom visibility and product-safe parent copy without observer/recording/attendance claims.
- Added EN/DE/FR/IT `liveClassroom` namespace files, provider-boundary docs, README handoff, and targeted Playwright coverage.

### Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:e2e -- live-classroom.spec.ts`: passed, 5/5 tests.

---

## v2.2 Photo & File Upload UI Foundation (Shipped: 2026-06-02)

**Phases completed:** 6 phases, 6 plans, 0 tasks
**Audit:** `.planning/v2.2-MILESTONE-AUDIT.md`
**Known deferred items at close:** Production object storage, signed upload URLs, OCR/image understanding, handwriting/formula recognition, auto-solving from images, crop/markup tools, teacher grading, parent file review, admin moderation, video upload, and permanent file-library workflows remain future scope.

**Key accomplishments:**

- Added a reusable `src/features/uploads/` module with typed metadata, validation, file utilities, preview lifecycle helpers, upload handoff helpers, service boundaries, and shared hooks.
- Built shared upload UI for attach, photo capture, drag/drop, browse fallback, preview cards, remove, retry, status badges, errors, modal, and inline panels.
- Integrated upload into Learning Chat while preserving attachment-aware sends, streaming, retry, lock, and teacher-help behavior.
- Added contextual Question Bank home/session upload flows and route-state/session-storage handoff into Learning Chat.
- Added lightweight Practice schoolwork upload panels and Practice-source Learning Chat handoff.
- Added English, German, French, and Italian upload copy, product-boundary docs, README handoff, and targeted Playwright upload tests.

### Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:e2e -- uploads.spec.ts`: passed, 4/4 tests.

---

## v2.1 Question Bank UI Design (Shipped: 2026-06-02)

**Phases completed:** 6 phases, 6 plans, 0 tasks
**Audit:** `.planning/v2.1-MILESTONE-AUDIT.md`
**Known deferred items at close:** Production Question Bank APIs, content management, generated-question workflows, exam-prep mode, paid unlocking, deeper curriculum mapping, video help, and live teacher joining remain future scope.

**Key accomplishments:**

- Added a protected student Question Bank area with home, subject, topic, saved sets, mistakes review, set overview, session, and result routes.
- Added typed Question Bank contracts, deterministic demo data, replaceable service boundaries, query keys, and TanStack Query hooks.
- Built discovery, search, filter, question set, answer input, immediate feedback, result, and mistakes-review UI.
- Integrated Question Bank entry points into student navigation and Dashboard while keeping it distinct from Practice Path roadmap progression.
- Added Question Bank context handoff into Learning Chat plus parent activity and tutor context summaries.
- Added English, German, French, and Italian Question Bank copy, README/docs guidance, and GSD planning artifacts.

### Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- Browser route smoke in mock API mode: passed for Question Bank home, subject, topic, set overview, session, result, mistakes review, and saved sets.
- Browser handoff/mobile smoke in mock API mode: passed for Question Bank session -> Learning Chat context and 390px mobile home layout.

---

## v1.35 Phase 37: Student Language Preference and Learning Assistant Response Localization (Shipped: 2026-06-01)

**Phases completed:** 5 phases, 5 plans, 0 tasks
**Audit:** `.planning/v1.35-MILESTONE-AUDIT.md`
**Known deferred items at close:** Browser smoke through Playwright was attempted but blocked by macOS sandbox permission for Chromium launch. Production preference syncing, parent-managed child answer-language settings, new supported languages, historical conversation translation, and full Playwright CI coverage remain deferred.

**Key accomplishments:**

- Added student profile and onboarding answer-language preference for English, German, French, and Italian.
- Persisted `preferredAnswerLanguage` through the local/demo backend registration and student profile API contract.
- Passed the saved student answer language into Learning Assistant chat generation instead of hard-coding English.
- Expanded template fallback and evaluator support for multilingual guided answer behavior.
- Added harness and backend regression tests, README guidance, demo API contract docs, and milestone audit evidence.

### Verification

- `python3 -m unittest discover -s demo-harness/tests`: passed, 28 tests.
- `backend/.venv/bin/python -m unittest discover -s backend/tests`: passed, 1 test.
- `npm run lint`: passed.
- `npm run build`: passed.

---

## v1.34 Phase 36: Engineering Quality, CI Reliability, and Local Workflow Hardening (Shipped: 2026-05-27)

**Phases completed:** 4 phases, 4 plans, 0 tasks
**Audit:** `.planning/milestones/v1.34-MILESTONE-AUDIT.md`
**Known deferred items at close:** Playwright remains local-only; adding it to GitHub Actions is deferred until runtime cost and demo-state stability are acceptable.

**Key accomplishments:**

- Fixed the reported Frontend CI lint failure by adding Node-environment handling for scripts and root config files in ESLint flat config.
- Verified install, lint, build, and browser smoke parity locally.
- Updated stale E2E smoke assertions for current accessible UI labels and heading structure.
- Updated project ignore rules and codebase map docs to match the current lockfile, TypeScript, ESLint, Playwright, and Vite reality.
- Added README quality-gate guidance for the authoritative local/CI command sequence.

### Verification

- `npm ci`: passed.
- `npm ci --dry-run`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:e2e`: passed, 14/14 tests.

---

## v1.33 Phase 35: Practice Roadmap UI, Lesson Progression, and Challenge Journey Experience (Shipped: 2026-05-27)

**Phases completed:** 5 phases, 5 plans, 0 tasks
**Audit:** `.planning/milestones/v1.33-MILESTONE-AUDIT.md`
**Known deferred items at close:** 1 unrelated pre-existing debug session left acknowledged in `.planning/STATE.md`.

**Key accomplishments:**

- Added subject-agnostic Practice roadmap contracts, demo roadmap state, service support, and query hook.
- Added roadmap components for progress header, unit sections, lesson nodes, connectors, locked hints, and next-lesson CTA.
- Integrated the roadmap into `/practice` and `/practice/:subjectId/:topicId` while preserving compatible Practice routes.
- Added English, German, French, and Italian roadmap copy plus roadmap UI, status rules, mobile layout, demo data, and QA docs.
- Verified the roadmap build, desktop/mobile browser behavior, locked hint, continue CTA navigation, topic route, README handoff, and milestone audit.

### Verification

- `npm run build`: passed.
- Browser smoke: passed for `/practice`, `/practice/mathematics/equations`, locked lesson hint, continue CTA, and mobile readability.
- Milestone audit: passed with 45/45 requirements, 5/5 phases, 5/5 integration checks, and 6/6 flow checks satisfied.

---

## v1.31 Phase 33: Homepage Practice Entry Clarification and Learning Platform Funnel Optimization (Shipped: 2026-05-27)

**Phases completed:** 4 phases, 4 plans, 0 tasks
**Audit:** `.planning/milestones/v1.31-MILESTONE-AUDIT.md`
**Known deferred items at close:** 21 unrelated pre-existing debug/quick artifacts left untouched in `.planning/STATE.md`.

**Key accomplishments:**

- Added role-aware Start Practice routing for visitors, students, parents, tutors, and admins.
- Added a clearer homepage Practice Game entry with path preview and Start Practice CTA.
- Added English, German, French, and Italian Practice entry copy with mobile wrapping hardening.
- Added homepage Practice entry, CTA hierarchy, Practice copy, IA map, demo flow, and QA documentation.

### Verification

- `npm run build`: passed.
- Browser route check: unauthenticated Start Practice opens `/login?next=/practice`.
- Browser layout QA: EN/DE/FR/IT passed at 320, 375, 430, 768, 1024, and 1440 CSS px.
- Milestone audit: passed with 43/43 requirements satisfied and no critical gaps.

---

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
