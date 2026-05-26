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
- ✅ **v1.19 Phase 20: Cross-Locale Copy Refinement, German Style Alignment, and Layout Adaptation** - Phases 113-117 (implemented 2026-05-26)
- 🔄 **v1.20 Phase 21: Accessibility, Cross-Browser QA, Brand Detail Integration, and Release Quality Gate** - Phases 118-122 (planning 2026-05-26)

## Phases

### Active Milestone: v1.20 Phase 21

Phase 21 raises STOA frontend to a release-quality gate without broad business expansion. It adds adapted brand contact details from the company homepage in strict read-only mode, then hardens accessibility, keyboard and screen-reader support, contrast, browser/mobile QA, visual regression, performance sanity, and final pre-launch documentation.

#### Phase 118: Brand Detail Read-Only Audit and Integration Plan

**Status:** Complete
**Plans:** 1/1
**Goal:** Extract company footer, contact, logo, and contact-form details from `/Users/zhdeng/newweb` in read-only mode and define the learning-platform adaptation boundary.

**Requirements:** BRAND21-01 through BRAND21-05

**Success Criteria:**
1. `docs/brand/main-website-brand-details.md` records footer information, contact information, logo usage, contact form structure, and source status.
2. The doc distinguishes factual information that can be reused from visual/engineering patterns that must be adapted.
3. Pre-work and post-work `/Users/zhdeng/newweb` status are recorded, including the pre-existing `img/team/.DS_Store` change if present.
4. No company homepage source files, components, assets, or full page structures are copied into `stoa-frontend`.

#### Phase 119: Footer, Logo, Contact Page, and Contact API Contract

**Status:** Complete
**Plans:** 1/1
**Goal:** Integrate adapted brand footer details, logo variants, and a multilingual contact form with frontend/demo API contract only.

**Requirements:** BRAND21-06 through BRAND21-10; CONTACT21-01 through CONTACT21-10

**Success Criteria:**
1. `StoaLogo`, `AppFooter`, `FooterContactInfo`, and `FooterLegalLinks` exist and fit the learning-platform theme.
2. Footer contact, legal, and homepage links are localized and accurate.
3. `/contact` exists with a multilingual contact form for name, email, optional phone, role, topic, message, and preferred language.
4. `src/services/contact/contactApi.ts` and a mutation hook define and use the `POST /contact/requests` frontend API contract.
5. Contact form pending, success, error, duplicate-submit, and retry states work without production email or CRM scope.

#### Phase 120: Accessibility, Keyboard, Screen Reader, and Contrast Hardening

**Status:** Planned
**Plans:** 0/1
**Goal:** Audit and improve P0 accessibility, keyboard navigation, screen-reader support, and color contrast across core user surfaces.

**Requirements:** A11Y21-01 through A11Y21-10

**Success Criteria:**
1. Accessibility, keyboard, screen-reader, and color-contrast docs exist under `docs/accessibility/`.
2. P0 routes have coherent headings, labels, accessible names, visible focus states, and readable state announcements where feasible.
3. Contact, login, register, and chat controls are usable by keyboard and have accessible error/success handling.
4. Chat message list and teacher-request controls have basic screen-reader-friendly labels.
5. Contrast findings for text, muted text, buttons, badges, links, forms, logo variants, and footer text are documented and addressed where feasible.

#### Phase 121: Cross-Browser, Mobile, Visual Regression, and Performance QA

**Status:** Planned
**Plans:** 0/1
**Goal:** Establish release-oriented QA evidence for browser/device coverage, visual-regression baselines, E2E smoke, and performance sanity.

**Requirements:** QA21-01 through QA21-11

**Success Criteria:**
1. Cross-browser, mobile-device, visual-regression, and performance sanity docs exist under `docs/qa/`.
2. QA covers the required browsers/devices where available, and exact limitations are documented when local coverage is reduced.
3. Initial Playwright screenshot baseline strategy or artifacts exist for core routes and locales.
4. Core E2E smoke is run or exact environment limitations are documented.
5. `npm install`, `npm run dev`, and `npm run build` are verified.

#### Phase 122: Release Quality Gate, README, and Handoff

**Status:** Planned
**Plans:** 0/1
**Goal:** Create the final release-quality gate and pre-launch checklist, update README, and hand off Phase 21 with source-safety and verification evidence.

**Requirements:** RELEASE21-01 through RELEASE21-09

**Success Criteria:**
1. `docs/release/release-quality-gate.md` and `docs/release/final-pre-launch-checklist.md` exist.
2. Release docs include build, E2E, accessibility, keyboard, contrast, browser, mobile, contact-form, footer/logo, terminology, and four-language gates.
3. README documents Phase 21 scope, source-safety policy, brand-detail integration, accessibility, QA, and release-gate goals.
4. Known limitations and follow-up release work are documented.
5. Post-work `/Users/zhdeng/newweb` status confirms Phase 21 did not modify the source project.

<details>
<summary>✅ v1.19 Phase 20: Cross-Locale Copy Refinement, German Style Alignment, and Layout Adaptation (Phases 113-117) — SHIPPED 2026-05-26</summary>

- [x] Phase 113: Source Safety and German Style Study (1/1 plan) — completed 2026-05-26
- [x] Phase 114: Cross-Locale Copy Rules and Review Matrix (1/1 plan) — completed 2026-05-26
- [x] Phase 115: Core Locale Copy Refinement (1/1 plan) — completed 2026-05-26
- [x] Phase 116: Locale Layout Adaptation and Component Fit (1/1 plan) — completed 2026-05-26
- [x] Phase 117: Cross-Locale Visual QA, README, and Handoff (1/1 plan) — completed 2026-05-26

Commits:
- `7e0462f Document German style reference for phase 20`
- `a581653 Add phase 20 cross-locale copy rules`
- `bb4f82d Refine phase 20 cross-locale product copy`
- `e38f5fc Adapt locale CTA layout for phase 20 copy`
- `7ea638e Complete phase 20 cross-locale QA handoff`

</details>

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
Start with Phase 118. Phase 118 must complete read-only brand detail extraction before footer, logo, and contact implementation.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 118. Brand Detail Read-Only Audit and Integration Plan | v1.20 | 1/1 | Complete | 2026-05-26 |
| 119. Footer, Logo, Contact Page, and Contact API Contract | v1.20 | 1/1 | Complete | 2026-05-26 |
| 120. Accessibility, Keyboard, Screen Reader, and Contrast Hardening | v1.20 | 0/1 | Planned | — |
| 121. Cross-Browser, Mobile, Visual Regression, and Performance QA | v1.20 | 0/1 | Planned | — |
| 122. Release Quality Gate, README, and Handoff | v1.20 | 0/1 | Planned | — |
