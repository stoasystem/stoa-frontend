# Requirements: STOA Frontend

**Defined:** 2026-05-26
**Milestone:** v1.19 Phase 20: Cross-Locale Copy Refinement, German Style Alignment, and Layout Adaptation
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, stable demo backend support, documented API contracts, coherent demo flows, multilingual Swiss-market language support, natural locale-specific product copy, production-facing user language, brand-aligned visual design, cross-locale layout stability, and a clean path to future real backend integration.

## v1.19 Requirements

Requirements for Phase 20. Each requirement maps to exactly one roadmap phase.

### Read-Only German Style Study

- [ ] **STYLE20-01**: Developers can review `docs/language/main-website-german-style-study.md` to understand the German writing style observed from `/Users/zhdeng/newweb`.
- [ ] **STYLE20-02**: The style study records pre-work and post-work `git status` for `/Users/zhdeng/newweb`, including the pre-existing `img/team/.DS_Store` modification if it remains present.
- [ ] **STYLE20-03**: Phase 20 does not write, format, install dependencies, build, delete, move, rename, commit, or otherwise modify files inside `/Users/zhdeng/newweb`.
- [ ] **STYLE20-04**: No homepage components, CSS files, source assets, or full homepage copy blocks are copied into `stoa-frontend`.
- [ ] **STYLE20-05**: `docs/language/main-website-german-copy-reference.md` records abstract German style signals, including headline rhythm, CTA style, sentence length, tone, education wording, and address-form observations.
- [ ] **STYLE20-06**: German style guidance distinguishes what the learning platform should adopt from what it must not copy.

### Cross-Locale Copy Rules

- [ ] **RULE20-01**: `docs/language/english-copy-rules.md` defines calm, premium, education-oriented English rules and explicitly avoids sales-heavy or technical wording.
- [ ] **RULE20-02**: `docs/language/german-copy-rules.md` is updated with Phase 20 homepage-inspired German style rules for titles, CTAs, education terminology, sentence length, and formal tone.
- [ ] **RULE20-03**: `docs/language/french-copy-rules.md` is updated with French punctuation, typographic apostrophe, CTA length, and natural phrasing rules.
- [ ] **RULE20-04**: `docs/language/italian-copy-rules.md` is updated with Italian CTA length, natural word order, warm tone, and mobile button-fit rules.
- [ ] **RULE20-05**: `docs/language/cross-locale-copy-review-matrix.md` records key copy across English, German, French, and Italian with meaning alignment, tone alignment, UI length, and approval status.
- [ ] **RULE20-06**: The copy review matrix treats literal translation as optional and meaning/tone alignment as required.
- [ ] **RULE20-07**: Cross-locale rules preserve Phase 18 production-facing terminology safety and avoid user-visible `AI`, `demo`, `mock`, `test`, provider, or development language.

### Core Locale Copy Refinement

- [ ] **COPY20-01**: Homepage copy is refined across English, German, French, and Italian so each locale reads naturally and preserves the same STOA learning-platform meaning.
- [ ] **COPY20-02**: German homepage copy follows the company-homepage-inspired style rules and avoids direct English sentence structure.
- [ ] **COPY20-03**: Register/onboarding copy is refined across all four languages with short role-card text, concise labels, and natural student/parent/teacher explanations.
- [ ] **COPY20-04**: Chat copy is refined across all four languages for Learning Assistant, teacher request, loading, empty, error, upload, and status states.
- [ ] **COPY20-05**: Parent dashboard/report copy is refined across all four languages with warm, non-anxious language and concise report section titles.
- [ ] **COPY20-06**: Pricing copy is refined across all four languages with education-value wording, short plan features, and no aggressive sales language.
- [ ] **COPY20-07**: Billing copy is refined across all four languages with product-safe plan-selection language and no internal payment implementation wording.
- [ ] **COPY20-08**: Support copy is refined across all four languages with user-friendly help language and no internal/debug wording.
- [ ] **COPY20-09**: Common actions and CTA labels include short variants where needed for mobile or narrow button contexts.
- [ ] **COPY20-10**: French locale copy consistently uses typographic apostrophes for strings such as `d’apprentissage`, `l’élève`, and `qu’un` where applicable.
- [ ] **COPY20-11**: Italian CTA copy remains natural while fitting core button and card contexts.
- [ ] **COPY20-12**: English copy remains calm, precise, education-centered, and avoids SaaS or hype language.

### Locale Layout Adaptation

- [ ] **LAYOUT20-01**: `src/lib/localeLayout.ts` is reviewed and updated where needed to support Phase 20 locale-specific title, action, and button fit requirements.
- [ ] **LAYOUT20-02**: German long headings and long words do not overflow or create awkward large-serif title wrapping on homepage and core pages.
- [ ] **LAYOUT20-03**: French apostrophe-heavy strings render correctly and do not truncate in buttons, cards, navigation, forms, or chat surfaces.
- [ ] **LAYOUT20-04**: Italian CTA labels do not overflow in homepage, register, chat, pricing, billing, and support contexts.
- [ ] **LAYOUT20-05**: Navbar and marketing layout remain usable across English, German, French, and Italian.
- [ ] **LAYOUT20-06**: Register role cards and forms remain stable across all four languages on mobile and desktop.
- [ ] **LAYOUT20-07**: Pricing and billing cards keep balanced height, wrapping, and button layout across all four languages.
- [ ] **LAYOUT20-08**: Chat teacher-request actions, upload states, and empty states remain readable across all four languages.
- [ ] **LAYOUT20-09**: Parent report headings, summaries, and next-action copy remain calm and readable across all four languages.

### QA, Build, and Handoff

- [ ] **QA20-01**: `docs/language/cross-locale-visual-qa.md` defines or records QA for Homepage, Register, Chat, Parent Report, Pricing, and Billing across English, German, French, and Italian.
- [ ] **QA20-02**: Visual QA covers target widths 375, 430, 768, 1024, and 1440 where feasible or documents any reduced evidence set.
- [ ] **QA20-03**: QA confirms German hero titles and long words do not break layout.
- [ ] **QA20-04**: QA confirms French typographic apostrophes render correctly.
- [ ] **QA20-05**: QA confirms Italian CTAs fit in key button contexts.
- [ ] **QA20-06**: QA confirms English copy is not sales-heavy, technical, or SaaS-like.
- [ ] **QA20-07**: Verification confirms `npm install` succeeds.
- [ ] **QA20-08**: Verification confirms `npm run dev` starts successfully or documents the exact environment limitation.
- [ ] **QA20-09**: Verification confirms `npm run build` succeeds.
- [ ] **QA20-10**: README documents Phase 20 scope, read-only source policy, German style alignment, cross-locale copy rules, and layout adaptation goals.
- [ ] **QA20-11**: Post-work source safety check confirms `/Users/zhdeng/newweb` was not modified by Phase 20 work.

## Future Requirements

Deferred to later milestones. Tracked but not in the current roadmap.

### Phase 21 Accessibility, Cross-Browser QA, and Release Quality Gate

- **A11Y21-01**: App has accessibility audit coverage for keyboard navigation, screen reader labels, focus states, language attributes, color contrast, route changes, forms, and chat status updates.
- **A11Y21-02**: Critical workflows are usable with keyboard-only navigation and announce dynamic loading, error, and success states to assistive technologies.
- **XBROWSER21-01**: App has cross-browser QA evidence for supported browsers and mobile device classes.
- **VISUAL21-01**: App has visual regression or screenshot comparison coverage for major route surfaces across supported languages and viewports.
- **PERF21-01**: App has a performance sanity check for core flows and public pages.
- **RELEASE21-01**: Team can run a final pre-launch release quality gate with accessibility, browser, locale, performance, and documentation criteria.

## Out of Scope

Explicitly excluded from v1.19 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Modifying `/Users/zhdeng/newweb` | The company homepage source is read-only for Phase 20. |
| Copying homepage components, CSS, assets, or full text blocks | Phase 20 learns German style signals; it does not transplant source material. |
| New product functionality | Phase 20 is copy and layout refinement only. |
| New languages | Phase 20 keeps English, German, French, and Italian only. |
| CMS or automatic translation system | Existing locale JSON files are sufficient for this milestone. |
| Final professional legal translation | Legal-sensitive translation review remains separate from product-copy refinement. |
| SEO article translation | Phase 20 focuses on app/product UI surfaces, not content marketing. |
| Backend language preference syncing | Browser-local language selection remains sufficient for this frontend milestone. |
| Major visual redesign | Phase 19 established brand visuals; Phase 20 should preserve them while refining language fit. |
| Production backend or payment changes | Copy work must not change data contracts, payment behavior, or backend architecture. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|

**Coverage:**
- v1.19 requirements: 45 total
- Mapped to phases: 0
- Unmapped: 45

---
*Requirements defined: 2026-05-26*

