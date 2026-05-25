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
- ⏳ **v1.16 Phase 17: Locale-Specific Copywriting, Responsive Typography, and Multilingual UI Refinement** - Phases 98-102 (planned)

## Phases

<details open>
<summary>⏳ v1.16 Phase 17: Locale-Specific Copywriting, Responsive Typography, and Multilingual UI Refinement (Phases 98-102)</summary>

**Milestone Goal:** Refine STOA's English, German, French, and Italian product copy and responsive layouts so each locale reads naturally, preserves the same education-centered meaning, and remains visually stable without adding new business features.

- [x] **Phase 98: Copy Governance and Scope Lock** - Establish locale-specific copy rules, glossary guidance, QA checklist expectations, and Phase 17 scope boundaries.
- [x] **Phase 99: Title and Layout Infrastructure** - Add safe locale-aware title structures and typed layout hints for long localized UI copy.
- [ ] **Phase 100: P0 Locale Copy Rewrite and Terminology Cleanup** - Rewrite homepage, onboarding, chat, parent, tutor, pricing, billing, support, and shared-state copy in EN/DE/FR/IT.
- [ ] **Phase 101: Responsive Typography and Multilingual Fit Pass** - Verify and tune high-risk components so localized text remains readable across target viewports.
- [ ] **Phase 102: QA Evidence, Documentation, and Handoff** - Record copy review, visual QA, terminology audit, build verification, README notes, and remaining review gaps.

## Phase Details

### Phase 98: Copy Governance and Scope Lock

**Goal**: Developers have clear locale-specific writing rules and scope boundaries before any Phase 17 copy or layout changes are made.
**Depends on**: Phase 97
**Requirements**: [LCOPY-01, LCOPY-02, LCOPY-03, LCOPY-04, LCOPY-05, LCOPY-06, LCOPY-07]
**Success Criteria** (what must be TRUE):
  1. Developers can read shared EN/DE/FR/IT locale-copy rules that permit structural copy differences while preserving STOA meaning, tone, and brand.
  2. Developers can use German, French, and Italian copy-rule docs to decide headline rhythm, CTA tone, punctuation, sentence length, compounds, warmth, clarity, and UI fit.
  3. Developers can consult updated glossary, copy style guide, and translation QA checklist entries for Phase 17 copy decisions.
  4. Developers can identify explicit Phase 17 exclusions, including new languages, CMS/TMS, automatic translation, SEO localization, legal final translation, backend preference sync, and new business features.
**Plans**: 1/1
**UI hint**: yes

### Phase 99: Title and Layout Infrastructure

**Goal**: The frontend can render locale-specific title structures and layout hints without encoding rendering metadata inside translation strings.
**Depends on**: Phase 98
**Requirements**: [HERO-05, LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04]
**Success Criteria** (what must be TRUE):
  1. `HomeHero` can render optional localized `titleLines` while retaining a safe single-string `title` fallback.
  2. Developers can use a typed `localeLayout` helper for `en`, `de`, `fr`, and `it`.
  3. Locale layout hints distinguish default and stacked hero title variants without putting layout metadata in locale copy.
  4. Locale layout hints identify long-label density needs for buttons, actions, and high-risk German or French UI labels.
  5. Hero typography and width constraints adapt to locale-specific title length without globally shrinking every heading.
**Plans**: 1/1
**UI hint**: yes

### Phase 100: P0 Locale Copy Rewrite and Terminology Cleanup

**Goal**: Users see natural, education-centered copy across P0 STOA surfaces in English, German, French, and Italian.
**Depends on**: Phase 99
**Requirements**: [HERO-01, HERO-02, HERO-03, HERO-04, P0COPY-01, P0COPY-02, P0COPY-03, P0COPY-04, P0COPY-05, P0COPY-06, P0COPY-07, P0COPY-08, TERM17-01, TERM17-02, TERM17-03, TERM17-04, TERM17-05, TERM17-06]
**Success Criteria** (what must be TRUE):
  1. Users see the approved homepage hero direction in all four languages, including stacked German title lines and natural subtitles and CTAs.
  2. Users see natural localized copy across homepage sections, register/onboarding, chat, parent dashboard/report, tutor workflow, pricing, billing, support, feedback, errors, toasts, empty states, and loading states.
  3. Parent and tutor copy stays calm, professional, and education-centered, without implying teacher replacement or backup treatment.
  4. Pricing, billing, plan, and demo copy avoids aggressive sales language and uses localized display text or stable-ID mapping instead of leaked English mock text.
  5. User-visible P0 copy removes banned AI-heavy, backup, customer, and sales terms while preserving internal identifiers where changing them would create unnecessary code churn.
**Plans**: TBD
**UI hint**: yes

### Phase 101: Responsive Typography and Multilingual Fit Pass

**Goal**: Final localized copy remains readable and visually stable across P0 routes, components, and target viewport widths.
**Depends on**: Phase 100
**Requirements**: [HERO-06, LAYOUT-05, LAYOUT-06]
**Success Criteria** (what must be TRUE):
  1. The German homepage hero no longer breaks visual rhythm at mobile, tablet, desktop, or wide desktop widths.
  2. Navbar labels, CTA buttons, card titles, pricing cards, form labels, and chat action controls remain readable in English, German, French, and Italian.
  3. Targeted CSS or component adjustments are scoped to affected multilingual-fit problems and do not create a broad visual redesign.
  4. Long localized labels wrap or flow predictably without truncating essential meaning or causing horizontal overflow.
**Plans**: TBD
**UI hint**: yes

### Phase 102: QA Evidence, Documentation, and Handoff

**Goal**: Developers can verify Phase 17 copy quality, layout stability, terminology cleanup, build readiness, and remaining handoff risks.
**Depends on**: Phase 101
**Requirements**: [QA17-01, QA17-02, QA17-03, QA17-04, QA17-05, QA17-06, QA17-07, DOCS17-01, DOCS17-02, DOCS17-03]
**Success Criteria** (what must be TRUE):
  1. `docs/language/copy-review-matrix.md` records critical P0 copy in EN/DE/FR/IT with tone, length, UI fit, and approval status.
  2. `docs/language/visual-qa-by-locale.md` defines and records locale checks at `375px`, `430px`, `768px`, `1024px`, and `1440px` for homepage, register, chat, pricing, parent report, billing, tutor, and support surfaces where available.
  3. QA evidence confirms German long titles, French subtitles, Italian CTAs, navbar labels, pricing cards, register forms, and chat teacher-request actions do not overflow or break layout.
  4. Terminology grep or equivalent audit confirms banned user-facing terminology is removed from P0 rendered copy sources.
  5. README and handoff notes document Phase 17 copy goals, terminology warnings, example hero copy, meaning-over-literal-translation guidance, build verification, native-speaker review gaps, legal-sensitive translation gaps, and future cross-locale QA automation gaps.
**Plans**: TBD
**UI hint**: yes

</details>

<details>
<summary>✅ Previous shipped milestones (Phases 1-97)</summary>

Phases 1-97 shipped the STOA frontend foundation, product UI, backend chat integration, streaming/file uploads, authenticated roles, parent/tutor/admin MVP flows, staging/QA, production/pilot readiness, pricing validation, virtual checkout, launch-ready legal drafts, paid launch frontend, parent acquisition, referrals, tutor availability, support tickets, admin analytics, UTM tracking, platform/organization demos, learning-intelligence demos, curriculum graph UI, weak-point diagnosis UI, monthly parent report, retention UI, partnership onboarding, information architecture, route inventory, role-based navigation, breadcrumbs, page-flow helpers, mobile navigation, final demo flow, stable demo backend support, API mode configuration, real backend readiness, AWS readiness notes, premium homepage/onboarding refinement, inline teacher escalation, EN/DE/FR/IT i18n foundation, language switching, terminology replacement, four-language core surface localization, and multilingual QA.

See `.planning/MILESTONES.md` and archived milestone audit files for detailed shipped scope and verification evidence.

</details>

## Progress

**Execution Order:**
Phase 17 phases planned in numeric order: 98 -> 99 -> 100 -> 101 -> 102

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 98. Copy Governance and Scope Lock | v1.16 | 1/1 | Complete | 2026-05-25 |
| 99. Title and Layout Infrastructure | v1.16 | 1/1 | Complete | 2026-05-25 |
| 100. P0 Locale Copy Rewrite and Terminology Cleanup | v1.16 | 0/1 | Not started | - |
| 101. Responsive Typography and Multilingual Fit Pass | v1.16 | 0/1 | Not started | - |
| 102. QA Evidence, Documentation, and Handoff | v1.16 | 0/1 | Not started | - |
