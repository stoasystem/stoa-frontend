# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.0 Frontend Foundation** - Phases 1-3 (shipped 2026-05-24)
- ✅ **v1.1 Frontend Development Foundation** - Phases 4-7 (shipped 2026-05-24)
- ✅ **v1.2 Core Product UI** - Phases 8-10 (shipped 2026-05-24)
- ✅ **v1.3 Phase 4 Backend Integration and Real Chat API** - Phases 11-14 (shipped 2026-05-24)
- ✅ **v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow** - Phases 15-20 (implemented 2026-05-24)
- ✅ **v1.5 Phase 6 Authentication, User Roles, and Parent Visibility** - Phases 21-27 (implemented 2026-05-24)
- ✅ **v1.6 Phase 7 Product Polishing, Analytics, and MVP Readiness** - Phases 28-34 (implemented 2026-05-25)
- ✅ **v1.7 Phase 8 Staging Deployment, QA, and Early User Testing** - Phases 35-40 (implemented 2026-05-25)
- ✅ **v1.8 Phase 9 Production Readiness, Monitoring, and Pilot Launch** - Phases 41-47 (implemented 2026-05-25)
- ✅ **v1.9 Phase 10: Pilot Iteration, Payment Preparation, and Production Launch** - Phases 48-55 (implemented 2026-05-25)
- ✅ **v1.10 Phase 11: Paid Launch Frontend, Growth Funnel, and Operational UI Scaling** - Phases 56-63 (implemented 2026-05-25)
- ✅ **v1.11 Phase 12: Frontend Platform Scaling, School Partnership UI, and Advanced Learning Intelligence Design** - Phases 64-72 (implemented 2026-05-25)
- ✅ **v1.12 Phase 13: Information Architecture, Page Flow, and UX Optimization** - Phases 73-79 (implemented 2026-05-25)
- ✅ **v1.13 Phase 14: Demo Backend Stabilization, Test Flow Completion, and Backend Integration Readiness** - Phases 80-86 (implemented 2026-05-25)
- ✅ **v1.14 Phase 15: Homepage Redesign, Onboarding Flow, and Premium UI Refinement** - Phases 87-91 (implemented 2026-05-25)
- ✅ **v1.15 Phase 16: Multilingual Language Optimization and AI Terminology Replacement** - Phases 92-97 (implemented 2026-05-25)
- ✅ **v1.16 Phase 17: Locale-Specific Copywriting, Responsive Typography, and Multilingual UI Refinement** - Phases 98-102 (implemented 2026-05-25)
- 🚧 **v1.17 Phase 18: Production-Facing Cleanup, Stability Hardening, and Demo Artifact Removal** - Phases 103-107 (active)

## Phases

### Active Milestone: v1.17 Phase 18

Phase 18 is a production-facing cleanup and stability hardening milestone. It removes development/demo artifacts from normal user-visible UI, preserves explicitly gated local/demo workflows, maps internal values to localized product-safe labels, hardens loading/empty/error/success and duplicate-submit states, and documents QA evidence. It does not add product modules, new languages, production backend behavior, real payments, or a broad redesign.

#### Phase 103: Production-Facing Audit and Source Inventory

**Status:** Not started
**Plans:** 0/1
**Goal:** Establish the calibrated Phase 18 audit baseline before implementation changes begin.

**Scope:**
- Create `docs/qa/production-facing-copy-audit.md`, `docs/qa/demo-artifact-removal-checklist.md`, and `docs/qa/stability-hardening-checklist.md`.
- Run and document source scans for `demo`, `mock`, `test`, `sample`, `placeholder`, `Codex`, `development`, `internal`, and related user-facing prohibited terms.
- Classify matches as rendered product copy, developer-only UI, internal identifiers, tests/fixtures, docs, or API/backend contract strings.
- Define P0/P1/P2 cleanup priority for homepage, login, register/onboarding, chat, parent, parent report, tutor, pricing, billing, support, and admin surfaces.
- Identify demo mechanics required by local development and E2E so later phases gate rather than delete necessary workflows.

**Requirements:** AUDIT18-01 through AUDIT18-06

#### Phase 104: Environment Guards and Demo UI Isolation

**Status:** Not started
**Plans:** 0/1
**Goal:** Hide demo-only and internal surfaces by default while preserving explicit local/demo workflows.

**Scope:**
- Add or refine typed public environment helpers in `src/lib/env.ts`.
- Add semantic visibility helpers for demo accounts, demo badges, checkout previews, demo surfaces, and internal debug UI.
- Gate demo account shortcuts, demo-only navigation, mock/virtual checkout affordances, and placeholder/demo routes in production-facing modes.
- Add `InternalDebugPanel` or equivalent only behind development plus explicit debug flag.
- Verify local/demo and E2E workflows remain available under explicit flags.

**Requirements:** GUARD18-01 through GUARD18-06

#### Phase 105: Production Copy Cleanup and Display Label Mapping

**Status:** Not started
**Plans:** 0/1
**Goal:** Remove user-visible development language and prevent raw internal statuses from rendering.

**Scope:**
- Clean P0/P1 user-facing copy across homepage, login, register/onboarding, chat, parent, parent report, tutor, pricing, billing, support, and admin primary surfaces.
- Update English, German, French, and Italian locale files together for changed P0 copy.
- Add `src/lib/displayLabels.ts`, `src/lib/userFacingText.ts`, `SafeStatusLabel`, or equivalent render-boundary helpers.
- Map teacher-help, support ticket, billing/subscription, onboarding/review, attachment, route, admin, and learning statuses to localized product-safe labels.
- Sanitize dynamic/backend error text so users do not see provider names, endpoint names, raw exceptions, internal codes, or demo/mock language.
- Preserve internal identifiers and data contracts when they are not user-visible.

**Requirements:** COPY18-01 through COPY18-09, LABEL18-01 through LABEL18-06

#### Phase 106: State Hardening and Duplicate-Submit Controls

**Status:** Not started
**Plans:** 0/1
**Goal:** Make core user flows stable across pending, empty, error, success, and fallback states.

**Scope:**
- Add or verify pending guards for login, register, chat send/retry, teacher-help request, tutor updates, support ticket submission, billing/checkout actions, uploads, and partnership/support forms.
- Ensure failed submissions preserve retry paths and do not clear user input unless the action succeeds.
- Standardize loading, empty, error, and success states across auth, chat, parent, parent report, tutor, pricing, billing, support, and admin flows.
- Add product-safe empty states for no conversations, no parent children, no reports, no tutor requests, no billing usage, and no support tickets.
- Ensure unknown routes, unauthorized routes, forbidden role access, unknown roles, and gated demo-only routes resolve to user-friendly fallbacks.

**Requirements:** STATE18-01 through STATE18-08

#### Phase 107: Production-Facing QA, README, and Handoff

**Status:** Not started
**Plans:** 0/1
**Goal:** Close Phase 18 with durable evidence that normal UI is clean, stable, and documented.

**Scope:**
- Run production-facing copy audit evidence for P0/P1 user-visible surfaces.
- Verify environment guards hide demo accounts, demo badges, checkout previews, demo-only UI, and internal debug panels by default.
- Verify raw-status absence on P0/P1 surfaces.
- Run runtime/browser QA for P0 pages in normal production-facing mode.
- Confirm English, German, French, and Italian changed keys do not fall back to English-only or raw key output.
- Run or document `npm install`, `npm run dev`, `npm run build`, and any relevant lint/E2E/browser checks.
- Update README with Phase 18 cleanup, guard, state-hardening, and demo-backend boundary guidance.
- Record handoff notes for Phase 19 accessibility, cross-browser QA, visual regression, and release quality gate.

**Requirements:** QA18-01 through QA18-08

<details>
<summary>✅ v1.16 Phase 17: Locale-Specific Copywriting, Responsive Typography, and Multilingual UI Refinement (Phases 98-102) — SHIPPED 2026-05-25</summary>

- [x] Phase 98: Copy Governance and Scope Lock (1/1 plan) — completed 2026-05-25
- [x] Phase 99: Title and Layout Infrastructure (1/1 plan) — completed 2026-05-25
- [x] Phase 100: P0 Locale Copy Rewrite and Terminology Cleanup (1/1 plan) — completed 2026-05-25
- [x] Phase 101: Responsive Typography and Multilingual Fit Pass (1/1 plan) — completed 2026-05-25
- [x] Phase 102: QA Evidence, Documentation, and Handoff (1/1 plan) — completed 2026-05-25

Archive:
- `.planning/milestones/v1.16-ROADMAP.md`
- `.planning/milestones/v1.16-REQUIREMENTS.md`
- `.planning/milestones/v1.16-MILESTONE-AUDIT.md`

</details>

<details>
<summary>✅ Previous shipped milestones (Phases 1-97)</summary>

Phases 1-97 shipped the STOA frontend foundation, product UI, backend chat integration, streaming/file uploads, authenticated roles, parent/tutor/admin MVP flows, staging/QA, production/pilot readiness, pricing validation, virtual checkout, launch-ready legal drafts, paid launch frontend, parent acquisition, referrals, tutor availability, support tickets, admin analytics, UTM tracking, platform/organization demos, learning-intelligence demos, curriculum graph UI, weak-point diagnosis UI, monthly parent report, retention UI, partnership onboarding, information architecture, route inventory, role-based navigation, breadcrumbs, page-flow helpers, mobile navigation, final demo flow, stable demo backend support, API mode configuration, real backend readiness, AWS readiness notes, premium homepage/onboarding refinement, inline teacher escalation, EN/DE/FR/IT i18n foundation, language switching, terminology replacement, four-language core surface localization, and multilingual QA.

See `.planning/MILESTONES.md` and archived milestone audit files for detailed shipped scope and verification evidence.

</details>

## Progress

**Execution Order:**
Start with Phase 103. Phase 103 must complete the source inventory and cleanup scope before implementation phases gate or rewrite UI.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 103. Production-Facing Audit and Source Inventory | v1.17 | 0/1 | Not started | - |
| 104. Environment Guards and Demo UI Isolation | v1.17 | 0/1 | Not started | - |
| 105. Production Copy Cleanup and Display Label Mapping | v1.17 | 0/1 | Not started | - |
| 106. State Hardening and Duplicate-Submit Controls | v1.17 | 0/1 | Not started | - |
| 107. Production-Facing QA, README, and Handoff | v1.17 | 0/1 | Not started | - |
