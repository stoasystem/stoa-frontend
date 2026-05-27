---
gsd_state_version: 1.0
milestone: v1.31
milestone_name: "Phase 33: Homepage Practice Entry Clarification and Learning Platform Funnel Optimization"
status: planning
last_updated: "2026-05-27T09:26:40.680Z"
last_activity: 2026-05-27
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 4
  completed_plans: 1
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-27)

**Core value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, stable demo backend support, documented API contracts, controlled guided Learning Assistant behavior, four-language product copy, premium visual design, and a clean path to future real backend integration.
**Current focus:** v1.31 Phase 33 clarifies the homepage Practice entry, Start Practice routing, four-language Practice copy, and the Practice -> Learning Chat -> Professional Teacher Support -> Parent Report funnel without expanding curriculum or complex gamification.

## Current Position

Phase: 178 next
Plan: 178-PLAN.md
Status: Phase 177 complete; ready to plan Phase 178
Last activity: 2026-05-27 — Phase 177 Start Practice route contract completed and build passed

## Performance Metrics

**Velocity:**

- Total plans completed this milestone: 1 of 4
- Average duration: completed in one autonomous execution pass
- Total execution time: same session

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 177 | 1/1 | Complete | 2026-05-27 |
| 178 | 0/1 | Pending | — |
| 179 | 0/1 | Pending | — |
| 180 | 0/1 | Pending | — |

**Recent Trend:**

- Last 5 plans: 172, 173, 174, 175, 176
- Trend: Phase 177 completed; next work builds the homepage Practice entry UI

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
- Phase 28 narrows the Practice demo to Mathematics equations only.
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

### Pending Todos

- Plan Phase 178: Homepage Practice Entry UI and Preview Components.

### Quick Tasks Completed

| Date | Task | Verification |
|------|------|--------------|
| 2026-05-26 | Fix register account type copy and remove duplicate step label | Browser check on `/register`; `npm run build` |
| 2026-05-26 | Polish teacher CTA readability and remove footer language switcher | Browser checks on `/teacher-support` and `/register`; `npm run build` |
| 2026-05-26 | Replace generic human support copy with teacher-specific copy | Browser check on `/teacher-support`; `npm run build` |
| 2026-05-26 | Create independent categorized Q&A page | Browser checks on `/qa` and `/pricing`; `npm run build` |
| 2026-05-26 | Improve teacher application CTA readability | Browser check on `/teacher-support`; `npm run build` |

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

- Start Phase 33: Real User Testing Preparation and Feedback Operations.
