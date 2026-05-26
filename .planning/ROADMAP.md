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
- ✅ **v1.18 Phase 19: Brand-Aligned Visual Refinement with Main Website Design Translation** - Phases 108-112 (implemented 2026-05-26)
- 🔄 **v1.19 Phase 20: Cross-Locale Copy Refinement, German Style Alignment, and Layout Adaptation** - Phases 113-117 (planning 2026-05-26)

## Phases

### Active Milestone: v1.19 Phase 20

Phase 20 refines English, German, French, and Italian product copy across the STOA learning platform while adapting UI layout so each locale reads naturally and remains stable. It continues the Phase 19 source-safety rule: `/Users/zhdeng/newweb` is read-only and may be used only to study German writing style, not as a source to modify or copy.

#### Phase 113: Source Safety and German Style Study

**Status:** Complete
**Plans:** 1/1
**Goal:** Establish the read-only German copy style baseline from the company homepage before changing learning-platform locale files.

**Requirements:** STYLE20-01 through STYLE20-06

**Success Criteria:**
1. `docs/language/main-website-german-style-study.md` documents German headline rhythm, CTA style, sentence length, tone, education wording, and address-form observations.
2. `docs/language/main-website-german-copy-reference.md` captures abstract style signals and explicitly avoids copying homepage text.
3. Pre-work and post-work `/Users/zhdeng/newweb` status are recorded, including the pre-existing `img/team/.DS_Store` change if present.
4. No source files, components, CSS, assets, or full text blocks from `/Users/zhdeng/newweb` are copied into `stoa-frontend`.

#### Phase 114: Cross-Locale Copy Rules and Review Matrix

**Status:** Planned
**Plans:** 0/1
**Goal:** Define the language-specific rules and review matrix that guide all Phase 20 copy edits.

**Requirements:** RULE20-01 through RULE20-07

**Success Criteria:**
1. English, German, French, and Italian copy-rule documents exist or are updated for Phase 20.
2. German rules reflect the company-homepage-inspired style while preserving learning-platform vocabulary.
3. French rules cover typographic apostrophes and punctuation fit; Italian rules cover CTA length and natural phrasing.
4. `docs/language/cross-locale-copy-review-matrix.md` records key copy with meaning, tone, literal-match, UI-length, and approval checks.
5. Phase 18 production-facing terminology safety remains explicit in copy rules.

#### Phase 115: Core Locale Copy Refinement

**Status:** Planned
**Plans:** 0/1
**Goal:** Refine English, German, French, and Italian locale JSON across P0 surfaces without adding product functionality.

**Requirements:** COPY20-01 through COPY20-12

**Success Criteria:**
1. Homepage, register/onboarding, chat, parent report, pricing, billing, and support copy are refined across all four locales.
2. German copy avoids direct English sentence structure and uses shorter, calmer education-service phrasing.
3. French uses consistent typographic apostrophes where applicable.
4. Italian CTA and support copy remains natural and button-friendly.
5. English copy remains calm, precise, education-centered, and not SaaS/sales-heavy.

#### Phase 116: Locale Layout Adaptation and Component Fit

**Status:** Planned
**Plans:** 0/1
**Goal:** Adapt locale layout hints and targeted components so refined copy stays stable on mobile and desktop.

**Requirements:** LAYOUT20-01 through LAYOUT20-09

**Success Criteria:**
1. `src/lib/localeLayout.ts` is reviewed and updated only where a concrete locale fit need exists.
2. German long words and headings do not overflow or create awkward hero/title wrapping.
3. French apostrophe-heavy strings do not truncate in buttons, cards, navigation, forms, or chat surfaces.
4. Italian CTA labels fit homepage, register, chat, pricing, billing, and support button contexts.
5. Navbar, register, pricing/billing, chat, and parent report surfaces remain usable across all four locales.

#### Phase 117: Cross-Locale Visual QA, README, and Handoff

**Status:** Planned
**Plans:** 0/1
**Goal:** Complete cross-locale QA, verification, README updates, and source-safety handoff for Phase 20.

**Requirements:** QA20-01 through QA20-11

**Success Criteria:**
1. `docs/language/cross-locale-visual-qa.md` records or defines QA across Homepage, Register, Chat, Parent Report, Pricing, and Billing for English, German, French, and Italian.
2. QA covers target widths 375, 430, 768, 1024, and 1440 where feasible, or documents any reduced evidence set.
3. QA confirms German long text, French apostrophes, Italian CTAs, and English tone are acceptable.
4. `npm install`, `npm run dev`, and `npm run build` are verified or exact environment limitations are documented.
5. README documents Phase 20 scope, read-only source policy, German style alignment, cross-locale copy rules, and layout adaptation goals.
6. Post-work `/Users/zhdeng/newweb` status confirms Phase 20 did not modify the source project.

<details>
<summary>✅ v1.18 Phase 19: Brand-Aligned Visual Refinement with Main Website Design Translation (Phases 108-112) — SHIPPED 2026-05-26</summary>

- [x] Phase 108: Main Website Read-Only Audit and Design Translation (1/1 plan) — completed 2026-05-26
- [x] Phase 109: Learning Platform Brand Tokens and Theme Layer (1/1 plan) — completed 2026-05-26
- [x] Phase 110: Shared Component Visual Refinement (1/1 plan) — completed 2026-05-26
- [x] Phase 111: Public and Auth Surface Alignment (1/1 plan) — completed 2026-05-26
- [x] Phase 112: App Page Alignment, Visual QA, README, and Handoff (1/1 plan) — completed 2026-05-26

Commit:
- `849c439 Align learning platform visuals with STOA brand language`

</details>

<details>
<summary>✅ v1.17 Phase 18: Production-Facing Cleanup, Stability Hardening, and Demo Artifact Removal (Phases 103-107) — SHIPPED 2026-05-26</summary>

- [x] Phase 103: Production-Facing Audit and Source Inventory (1/1 plan) — completed 2026-05-26
- [x] Phase 104: Environment Guards and Demo UI Isolation (1/1 plan) — completed 2026-05-26
- [x] Phase 105: Production Copy Cleanup and Display Label Mapping (1/1 plan) — completed 2026-05-26
- [x] Phase 106: State Hardening and Duplicate-Submit Controls (1/1 plan) — completed 2026-05-26
- [x] Phase 107: Production-Facing QA, README, and Handoff (1/1 plan) — completed 2026-05-26

</details>

<details>
<summary>✅ v1.16 Phase 17: Locale-Specific Copywriting, Responsive Typography, and Multilingual UI Refinement (Phases 98-102) — SHIPPED 2026-05-25</summary>

- [x] Phase 98: Copy Governance and Scope Lock (1/1 plan) — completed 2026-05-25
- [x] Phase 99: Title and Layout Infrastructure (1/1 plan) — completed 2026-05-25
- [x] Phase 100: P0 Locale Copy Rewrite and Terminology Cleanup (1/1 plan) — completed 2026-05-25
- [x] Phase 101: Responsive Typography and Multilingual Fit Pass (1/1 plan) — completed 2026-05-25
- [x] Phase 102: QA Evidence, Documentation, and Handoff (1/1 plan) — completed 2026-05-25

</details>

<details>
<summary>✅ Previous shipped milestones (Phases 1-97)</summary>

Phases 1-97 shipped the STOA frontend foundation, product UI, backend chat integration, streaming/file uploads, authenticated roles, parent/tutor/admin MVP flows, staging/QA, production/pilot readiness, pricing validation, virtual checkout, launch-ready legal drafts, paid launch frontend, parent acquisition, referrals, tutor availability, support tickets, admin analytics, UTM tracking, platform/organization demos, learning-intelligence demos, curriculum graph UI, weak-point diagnosis UI, monthly parent report, retention UI, partnership onboarding, information architecture, route inventory, role-based navigation, breadcrumbs, page-flow helpers, mobile navigation, final demo flow, stable demo backend support, API mode configuration, real backend readiness, AWS readiness notes, premium homepage/onboarding refinement, inline teacher escalation, EN/DE/FR/IT i18n foundation, language switching, terminology replacement, four-language core surface localization, and multilingual QA.

See `.planning/MILESTONES.md` and archived milestone audit files for detailed shipped scope and verification evidence.

</details>

## Progress

**Execution Order:**
Start with Phase 113. Phase 113 must complete the source-safety and German style study before learning-platform locale copy is rewritten.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 113. Source Safety and German Style Study | v1.19 | 1/1 | Complete | 2026-05-26 |
| 114. Cross-Locale Copy Rules and Review Matrix | v1.19 | 0/1 | Planned | — |
| 115. Core Locale Copy Refinement | v1.19 | 0/1 | Planned | — |
| 116. Locale Layout Adaptation and Component Fit | v1.19 | 0/1 | Planned | — |
| 117. Cross-Locale Visual QA, README, and Handoff | v1.19 | 0/1 | Planned | — |
