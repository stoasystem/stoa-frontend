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
- ✅ **v1.17 Phase 18: Production-Facing Cleanup, Stability Hardening, and Demo Artifact Removal** - Phases 103-107 (implemented 2026-05-26)
- 🚧 **v1.18 Phase 19: Brand-Aligned Visual Refinement with Main Website Design Translation** - Phases 108-112 (planning)

## Phases

<details open>
<summary>🚧 v1.18 Phase 19: Brand-Aligned Visual Refinement with Main Website Design Translation (Phases 108-112) — PLANNING</summary>

Phase 19 aligns the STOA learning platform visually with the company homepage design language without modifying `/Users/zhdeng/newweb`, copying its source files, or turning the app into a homepage clone. The target relationship is same brand family, different product surface.

- [ ] Phase 108: Main Website Read-Only Audit and Design Translation (0/1 plan)
  - Requirements: SAFE19-01 through SAFE19-06, TRANS19-01 through TRANS19-06
  - Deliverables: `docs/design/main-website-readonly-audit.md`, `docs/design/main-website-design-translation.md`
  - Notes: record `/Users/zhdeng/newweb` pre/post `git status`, including the pre-existing `img/team/.DS_Store` modification if still present.
- [ ] Phase 109: Learning Platform Brand Tokens and Theme Layer (0/1 plan)
  - Requirements: TOKEN19-01 through TOKEN19-07
  - Deliverables: `docs/design/learning-platform-token-adjustment.md`, `src/styles/brand-tokens.css`, `src/styles/platform-theme.css` or equivalent integration with existing theme files.
- [ ] Phase 110: Shared Component Visual Refinement (0/1 plan)
  - Requirements: COMP19-01 through COMP19-06
  - Deliverables: refined button, card, badge, form, navigation, header, chat, pricing, billing, and report component styling using translated tokens.
- [ ] Phase 111: Public and Auth Surface Alignment (0/1 plan)
  - Requirements: PAGE19-01 through PAGE19-02
  - Deliverables: brand-aligned homepage, login, register, and onboarding visuals without new product functionality.
- [ ] Phase 112: App Page Alignment, Visual QA, README, and Handoff (0/1 plan)
  - Requirements: PAGE19-03 through PAGE19-09, QA19-01 through QA19-10
  - Deliverables: chat, student dashboard, parent dashboard/report, pricing, billing, tutor/support/admin token consistency, visual compatibility QA, README update, build/dev status, and final `/Users/zhdeng/newweb` read-only confirmation.

</details>

<details>
<summary>✅ v1.17 Phase 18: Production-Facing Cleanup, Stability Hardening, and Demo Artifact Removal (Phases 103-107) — SHIPPED 2026-05-26</summary>

- [x] Phase 103: Production-Facing Audit and Source Inventory (1/1 plan) — completed 2026-05-26
- [x] Phase 104: Environment Guards and Demo UI Isolation (1/1 plan) — completed 2026-05-26
- [x] Phase 105: Production Copy Cleanup and Display Label Mapping (1/1 plan) — completed 2026-05-26
- [x] Phase 106: State Hardening and Duplicate-Submit Controls (1/1 plan) — completed 2026-05-26
- [x] Phase 107: Production-Facing QA, README, and Handoff (1/1 plan) — completed 2026-05-26

Archive:
- `.planning/milestones/v1.17-ROADMAP.md`
- `.planning/milestones/v1.17-REQUIREMENTS.md`
- `.planning/milestones/v1.17-MILESTONE-AUDIT.md`

</details>

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
Start with Phase 108. Phase 108 must complete the read-only source audit and design translation before any learning-platform visual edits are planned or implemented.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 108. Main Website Read-Only Audit and Design Translation | v1.18 | 0/1 | Not Started | — |
| 109. Learning Platform Brand Tokens and Theme Layer | v1.18 | 0/1 | Not Started | — |
| 110. Shared Component Visual Refinement | v1.18 | 0/1 | Not Started | — |
| 111. Public and Auth Surface Alignment | v1.18 | 0/1 | Not Started | — |
| 112. App Page Alignment, Visual QA, README, and Handoff | v1.18 | 0/1 | Not Started | — |
