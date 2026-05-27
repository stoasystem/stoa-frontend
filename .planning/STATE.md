---
gsd_state_version: 1.0
milestone: v1.33
milestone_name: "Phase 35: Practice Roadmap UI, Lesson Progression, and Challenge Journey Experience"
status: complete
last_updated: "2026-05-27T16:10:00.000Z"
last_activity: 2026-05-27
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 5
  completed_plans: 5
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-27)

**Core value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, stable demo backend support, documented API contracts, controlled guided Learning Assistant behavior, four-language product copy, premium visual design, and a clean path to future real backend integration.
**Current focus:** v1.33 Phase 35 upgrades Practice into a subject-agnostic roadmap learning path with lesson nodes, progression states, unlock hints, next-lesson CTA, Learning Chat handoff copy, four-language support, docs, QA, and build verification.

## Current Position

Phase: 190 Practice Roadmap QA, README Handoff, and Build Verification
Plan: 190-PLAN.md complete
Status: v1.33 complete
Last activity: 2026-05-27 — Phase 190 completed roadmap QA, README handoff, and build verification

## Performance Metrics

**Velocity:**

- Total plans completed this milestone: 5 of 5
- Average duration: 1 autonomous phase pass
- Total execution time: in progress

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 186 | 1/1 | Complete | 1 pass |
| 187 | 1/1 | Complete | 1 pass |
| 188 | 1/1 | Complete | 1 pass |
| 189 | 1/1 | Complete | 1 pass |
| 190 | 1/1 | Complete | 1 pass |

**Recent Trend:**

- Last 5 completed phases: 181, 182, 183, 184, 185
- Trend: Phase 35 starts from the completed subject-agnostic Practice architecture and moves into roadmap progression UX.

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1.25 continues roadmap numbering from Phase 141 after v1.24 ended at Phase 140.
- Practice Path is subject-based Mathematics and Physics practice, not a language-learning clone.
- `sanidhyy/duolingo-clone` is mechanism reference material only; STOA must not copy its stack, code, backend structure, shop, hearts, leaderboards, or cartoon style.
- Practice mistakes use a hint-first flow before Learning Assistant explanation and teacher escalation.
- Phase 27 remains frontend/demo-backed and provider-agnostic; the frontend calls only STOA service/API boundaries.
- v1.26 continues roadmap numbering from Phase 147 after v1.25 ended at Phase 146.
- Phase 28 narrows the first Practice demo content package to Mathematics equations only; it does not define final Practice Path scope.
- Phase 28 work is frontend design/content/demo polish; functionality should be only enough to test and present the UI.
- v1.27 continues roadmap numbering from Phase 153 after v1.26 ended at Phase 152.
- Phase 29 keeps the equation Practice content stable and focuses on interaction smoothness, Practice-to-Learning-Chat entry, teacher escalation timing, dashboard/homepage/parent report IA, docs, and demo flow.
- Phase 29 research should use Duolingo-style interaction mechanics as analogy only, not visual or backend source material.
- Phase 29 uses frontend route state for Practice-to-Chat context and keeps production persistence deferred.
- Phase 29 keeps teacher support as a tertiary escalation after hint/retry or repeated confusion.
- v1.28 continues roadmap numbering from Phase 159 after v1.27 ended at Phase 158.
- Phase 30 skips new domain research by user instruction and focuses on packaging, testing materials, product story, feedback capture, parent value framing, and future handoff docs.
- Phase 30 does not expand curriculum, UI functionality, backend/database scope, CMS, payment, formal teacher scheduling, or large UI redesign.
- Phase 30 keeps the final demo curriculum locked to lower-secondary equations.
- v1.29 continues roadmap numbering from Phase 165 after v1.28 ended at Phase 164.
- Phase 31 uses webpage-organization research before implementation, focused on IA before navigation, uncluttered public nav, homepage hierarchy, role dashboard hierarchy, and explicit Practice-to-Chat wayfinding.
- Phase 31 positions Practice as a student learning entry path, not as the full product or a game-platform identity.
- Learning Chat remains the central explanation surface; professional teacher support remains delayed escalation; Parent Report remains the visibility layer.
- Public navigation should not add Practice as a top-level item unless a specific product reason is documented.
- Phase 31 keeps Practice out of the public navbar while adding homepage Practice explanation.
- Phase 31 student dashboard now prioritizes Continue Practice and Learning Chat.
- Phase 31 parent pages use Learning activity to combine Practice, Chat, teacher support, and next focus.
- Phase 31 tutor requests show Practice context before the transcript when available.
- v1.30 continues roadmap numbering from Phase 171 after v1.29 ended at Phase 170.
- Phase 32 is a language quality, copy accuracy, development-artifact cleanup, and UI-fit audit milestone; it must not add product features or new pages.
- Phase 32 skips external/domain research because the scope is a focused audit of existing user-facing surfaces, not new product capability research.
- Phase 32 treats user-facing UI as the cleanup target; developer docs, tests, and code identifiers may keep precise technical language where appropriate.
- Phase 32 completed copy and artifact cleanup without adding product features.
- Phase 32 verification passed `npm run build`, locale key parity, French apostrophe scan, high-risk term scan classification, and 184 Playwright route/locale/viewport smoke checks.
- v1.31 continues roadmap numbering from Phase 177 after v1.30 ended at Phase 176.
- Phase 33 uses Duolingo-inspired practice mechanics only as interaction inspiration: short challenges, visible progress, immediate feedback, hints, and contextual explanation.
- Phase 33 must not copy Duolingo code, brand, green visual language, mascot cues, XP, streaks, hearts, gems, shops, leaderboards, or game-first user-facing language.
- Practice remains one learning entry; Learning Chat remains the explanation center, Professional Teacher Support remains escalation, and Parent Report remains visibility.
- Phase 33 starts with route/auth correctness because incorrect `/login?next=/practice` behavior would invalidate homepage funnel testing.
- Phase 177 added shared Start Practice route helpers and safe role-owned login next handling.
- Phase 178 split the homepage Practice entry into focused components and added a concrete equation challenge/path preview.
- Phase 179 verified EN/DE/FR/IT Practice entry copy across 320, 375, 430, 768, 1024, and 1440 px browser widths and hardened long localized heading wrapping.
- Phase 180 documented the homepage Practice entry funnel, added the Phase 33 QA checklist, verified unauthenticated Start Practice routing in browser, and passed `npm run build`.
- v1.32 Phase 34 corrects prior wording that could imply Practice Path equals equations. The intended hierarchy is Practice Path -> Subject -> Grade level -> Topic -> Unit -> Lesson -> Challenge.
- Equation content remains the first demo seed under Mathematics / lower secondary / equations.
- Phase 181 recorded the Practice Path Scope Principle in English and Chinese and corrected historical docs so equations are framed as the first demo package only.
- Phase 182 added explicit grade/topic/unit metadata to Practice types and mock data, with canonical demo seed data under `mockPractice.mathematics.lowerSecondary.equations`.
- Phase 183 made `/practice/:subjectId/:topicId` the canonical Practice topic route shape while preserving legacy subject-only routes.
- Phase 184 updated homepage, dashboard, Practice overview, and parent copy so equation wording appears only as current demo content.
- Phase 185 verified build, browser Practice funnel, topic/lesson routes, dashboard copy, and four-language mobile homepage rendering.
- v1.33 continues roadmap numbering from Phase 186 after v1.32 ended at Phase 185.
- Phase 35 focuses on Practice roadmap UI, lesson progression states, unlock hints, and Learning Chat handoff copy; it does not add new subjects, a production backend, adaptive learning, or heavy game rewards.
- Phase 186 added roadmap contracts, demo roadmap data, roadmap service/query support, and mock progression updates.
- Phase 187 added the Practice roadmap component system, node state rendering, connectors, progress header, unlock hint, continue card, and UI spec.
- Phase 188 integrated the roadmap into `/practice`, added `TopicRoadmapPage`, wired canonical topic routes, and connected usable lesson node clicks to existing lesson routes.
- Phase 189 added EN/DE/FR/IT roadmap copy, localized roadmap labels, mobile/desktop layout documentation, demo data docs, and roadmap QA checklist.
- Phase 190 verified build, desktop/mobile browser roadmap behavior, locked hint behavior, continue CTA navigation, topic roadmap route, README handoff, and Phase 36 follow-up.

### Pending Todos

- Phase 35 complete. Next milestone can focus on roadmap interaction QA, progress feedback, and parent visibility refinement.

### Quick Tasks Completed

| Date | Task | Verification |
|------|------|--------------|
| 2026-05-26 | Fix register account type copy and remove duplicate step label | Browser check on `/register`; `npm run build` |
| 2026-05-26 | Polish teacher CTA readability and remove footer language switcher | Browser checks on `/teacher-support` and `/register`; `npm run build` |
| 2026-05-26 | Replace generic human support copy with teacher-specific copy | Browser check on `/teacher-support`; `npm run build` |
| 2026-05-26 | Create independent categorized Q&A page | Browser checks on `/qa` and `/pricing`; `npm run build` |
| 2026-05-26 | Improve teacher application CTA readability | Browser check on `/teacher-support`; `npm run build` |
| 2026-05-27 | Make student login default to Dashboard instead of Learning Chat | Browser checks for `/chat` login fallback and `next=/practice`; `npm run build` |
| 2026-05-27 | Improve Practice Continue button readability | Browser computed color check on `/practice`; `npm run build` |
| 2026-05-27 | Rename awkward Two-step equations lesson copy | Browser check on lesson route; `npm run build` |
| 2026-05-27 | Remove redundant app sidebar footer links | Browser check on lesson route; `npm run build` |
| 2026-05-27 | Fix Learning Chat sidebar label capitalization | Browser check on lesson route; `npm run build` |
| 2026-05-27 | Fix Student Profile mock-mode loading failure | Browser check on `/profile`; `npm run build` |
| 2026-05-27 | Fix Student Learning History mock-mode loading failure | Browser check on `/learning-history`; `npm run build` |
| 2026-05-27 | Expand How it works step explanations | Browser checks on `/how-it-works` at desktop and mobile widths; `npm run build` |

### Blockers/Concerns

- Parent report browser smoke should be run in isolated mock mode unless the live demo backend has matching parent report permissions.
- Practice content QA passed for the controlled equation demo set; broader content review remains future work.
- Practice-to-Chat context is implemented as frontend route state/mock contract only until a real backend contract exists.

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-05-26:

| Category | Item | Status |
|----------|------|--------|
| debug_session | chat-new-conversation-icon | investigating |
| quick_task | 260526-qec-show-teacher-online-availability-status- | unknown |
| quick_task | 260526-qm3-refocus-the-parents-landing-page-on-chil | unknown |
| quick_task | 260526-qpm-make-homepage-live-explanation-card-link | unknown |
| quick_task | 260526-qro-make-homepage-professional-teacher-suppo | unknown |
| quick_task | 260526-qtt-polish-homepage-teacher-support-headline | unknown |
| quick_task | 260526-qvw-polish-homepage-swiss-school-trust-copy | unknown |
| quick_task | 260526-qyj-remove-duplicate-homepage-bottom-cta-cop | unknown |
| quick_task | 260526-r10-change-public-tutors-navigation-copy-to- | unknown |
| quick_task | 260526-r36-improve-footer-language-switcher-styling | unknown |
| quick_task | 260526-r6i-clarify-registration-step-label-copy | unknown |
| quick_task | 260526-ral-clean-up-pricing-page-layout | unknown |
| quick_task | 260526-rfo-update-subscription-tier-definitions-and | unknown |
| quick_task | 260526-rna-clarify-parent-page-mastery-progress-lab | unknown |
| quick_task | 260526-rs6-fix-student-dashboard-open-chat-button-r | unknown |
| quick_task | 260526-rvj-fix-student-dashboard-sidebar-active-nav | unknown |
| quick_task | 260526-ry4-add-authenticated-dashboard-top-navigati | unknown |
| quick_task | 260526-s11-make-student-login-redirect-to-dashboard | unknown |
| quick_task | 260526-sbd-make-dashboard-top-account-menu-less-cro | unknown |
| quick_task | 260526-se4-change-dashboard-top-stoa-link-to-homepa | unknown |
| quick_task | 260526-sh9-show-student-name-in-dashboard-top-accou | unknown |

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Practice content QA | Full content accuracy and demo scenario polishing | Future Requirements | v1.25 requirements |
| Learning Assistant regression | Repeated-confusion and direct-answer practice regression suite | Future Requirements | v1.25 requirements |
| Broad Practice curriculum | Geometry, probability, functions, physics, and large question banks | Future Requirements | v1.26 requirements |

## Session Continuity

Last session: 2026-05-27 01:05 Europe/Zurich
Stopped at: v1.30 Phase 32 implementation complete and verified.
Resume file: None

## Operator Next Steps

- Run milestone audit, complete milestone archive, and cleanup.
