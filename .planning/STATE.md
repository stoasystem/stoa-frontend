---
gsd_state_version: 1.0
milestone: v1.28
milestone_name: "Phase 30: Final Demo Curriculum Packaging, External Testing, and Product Story Refinement"
status: Awaiting next milestone
stopped_at: v1.26 Phase 28 implementation complete and verified.
last_updated: "2026-05-26T21:09:06.329Z"
last_activity: 2026-05-26 — Milestone v1.28 completed and archived
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 6
  completed_plans: 6
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-26)

**Core value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, stable demo backend support, documented API contracts, controlled guided Learning Assistant behavior, four-language product copy, premium visual design, and a clean path to future real backend integration.
**Current focus:** v1.28 Phase 30 packages the existing Practice Path, Learning Chat, teacher support, and Parent Report flow into a final external demo curriculum story with testing materials, feedback capture, and future handoff requirements.

## Current Position

Phase: Milestone v1.28 complete
Plan: —
Status: Awaiting next milestone
Last activity: 2026-05-26 — Milestone v1.28 completed and archived

## Performance Metrics

**Velocity:**

- Total plans completed this milestone: 6 of 6
- Average duration: same-session documentation slice
- Total execution time: same-session documentation slice

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 159 | 1/1 | Complete | same session |
| 160 | 1/1 | Complete | same session |
| 161 | 1/1 | Complete | same session |
| 162 | 1/1 | Complete | same session |
| 163 | 1/1 | Complete | same session |
| 164 | 1/1 | Complete | same session |

**Recent Trend:**

- Last 5 plans: 160, 161, 162, 163, 164 complete
- Trend: Phase 30 documentation and demo packaging milestone complete

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

### Pending Todos

- Phase 31 should rehearse the external demo, collect feedback, and refine the Practice + Chat + Parent story based on real observations.

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

Last session: 2026-05-26 21:05 UTC
Stopped at: v1.26 Phase 28 implementation complete and verified.
Resume file: None

## Operator Next Steps

- Start the next milestone with /gsd-new-milestone
