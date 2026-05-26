# Requirements: STOA Frontend

**Defined:** 2026-05-27
**Milestone:** v1.30 Phase 32: Cross-Locale Language QA, Copy Accuracy Review, and Development Artifact Audit
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA learning platform whose user-facing English, German, French, and Italian copy reads naturally, accurately, and professionally without exposing development artifacts.

## v1 Requirements

### Audit Framework and Scope

- [x] **AUD32-01**: Team can review `docs/language/global-copy-audit-matrix.md` covering route, component, key, four-language copy, meaning accuracy, tone, UI fit, forbidden terms, approval, and notes.
- [x] **AUD32-02**: Team can review `docs/qa/development-artifact-audit.md` with search terms, files found, user-facing classification, action taken, and approval.
- [x] **AUD32-03**: Team can review `docs/qa/user-facing-copy-cleanup-checklist.md` covering language quality, artifact cleanup, UI fit, missing translation keys, and build verification.
- [x] **AUD32-04**: Audit scope includes public pages, student pages, parent pages, tutor pages, admin/internal-facing product pages, and shared UI components.
- [x] **AUD32-05**: The milestone explicitly avoids new features, new pages, new languages, course expansion, UI redesign, backend work, database work, and changes to `/Users/zhdeng/newweb`.

### English Copy Review

- [x] **EN32-01**: English user-facing copy is reviewed across public, student, parent, tutor, admin, and shared components.
- [x] **EN32-02**: English copy avoids overly sales-driven, SaaS-heavy, technical, hype-driven, or pressure-based wording.
- [x] **EN32-03**: English terms consistently use `Learning Assistant`, `Learning Chat`, `Professional teacher support`, `Practice Path`, and `Parent Report` where appropriate.
- [x] **EN32-04**: English error, loading, empty, toast, form, navigation, footer, Practice, Chat, Parent Report, Tutor, Pricing, Billing, and Contact copy is user-friendly.
- [x] **EN32-05**: `docs/language/english-final-review.md` records English review findings, fixes, known gaps, and approval.

### German Copy Review

- [x] **DE32-01**: German user-facing copy is reviewed across public, student, parent, tutor, admin, and shared components.
- [x] **DE32-02**: German copy avoids English direct translation, awkward compound words, over-formal phrasing, and overly long title structures.
- [x] **DE32-03**: German CTA labels and navigation labels remain short enough for mobile and desktop UI.
- [x] **DE32-04**: German education terminology is natural for Swiss/German-speaking family and school contexts.
- [x] **DE32-05**: `docs/language/german-final-review.md` records German review findings, fixes, known gaps, and approval.

### French Copy Review

- [x] **FR32-01**: French user-facing copy is reviewed across public, student, parent, tutor, admin, and shared components.
- [x] **FR32-02**: French copy uses natural phrasing, correct apostrophes, correct contractions, and clear education language.
- [x] **FR32-03**: French copy avoids overly abstract titles and form/helper text that becomes too long for UI.
- [x] **FR32-04**: French apostrophes use the typographic `’` consistently in user-facing copy where appropriate.
- [x] **FR32-05**: `docs/language/french-final-review.md` records French review findings, fixes, known gaps, and approval.

### Italian Copy Review

- [x] **IT32-01**: Italian user-facing copy is reviewed across public, student, parent, tutor, admin, and shared components.
- [x] **IT32-02**: Italian copy is warm, clear, natural, and not overly formal or visibly translated from English.
- [x] **IT32-03**: Italian CTA, form, state, and navigation copy remains short enough for mobile and desktop UI.
- [x] **IT32-04**: Italian education terminology is consistent across Practice, Chat, parent visibility, and teacher support surfaces.
- [x] **IT32-05**: `docs/language/italian-final-review.md` records Italian review findings, fixes, known gaps, and approval.

### Terminology and Cross-Locale Meaning

- [x] **TERM32-01**: Four-language copy preserves equivalent meaning without requiring word-for-word translation.
- [x] **TERM32-02**: Learning Assistant, Professional teacher support, Practice Path, Learning Chat, Parent Report, student, parent, and teacher terms are consistent across locales.
- [x] **TERM32-03**: Copy does not imply STOA is only a game platform, only a chat tool, or a teacher replacement.
- [x] **TERM32-04**: Four-language copy avoids misleading differences in product capability, plan limits, teacher approval, payment state, or support expectations.
- [x] **TERM32-05**: Missing translation key leakage such as raw i18n keys, `undefined`, or `[object Object]` is checked and corrected where found.

### Development Artifact Cleanup

- [x] **ART32-01**: User-facing UI is audited for `demo`, `mock`, `test account`, `Codex`, `backend`, `provider`, `placeholder`, `TODO`, `Lorem`, `AI`, `Artificial Intelligence`, `model`, `prompt`, and similar internal wording.
- [x] **ART32-02**: User-facing development artifacts are removed or rewritten into product-safe language.
- [x] **ART32-03**: Legitimate developer-only mentions remain limited to docs, tests, internal code identifiers, or feature-flagged debug surfaces that are hidden by default.
- [x] **ART32-04**: README, docs, QA checklist, developer notes, and internal implementation language do not leak into user-facing UI.
- [x] **ART32-05**: Public demo credentials, internal test accounts, and internal operational instructions do not appear in normal user-facing pages.

### UI Fit and Visual Language QA

- [x] **UI32-01**: Four-language UI fit is checked at 375px, 430px, 768px, 1024px, and 1440px for required pages.
- [x] **UI32-02**: Navbar, footer, contact form, register flow, Practice flow, Learning Chat, Parent Report, Tutor Request Detail, Pricing, Billing, and Contact layouts remain stable across locales.
- [x] **UI32-03**: German long words and headings do not overflow or create broken layouts.
- [x] **UI32-04**: French apostrophes and longer text do not create awkward wrapping or punctuation issues.
- [x] **UI32-05**: Italian CTA and form text fits buttons, cards, and compact mobile surfaces.

### Verification, Reports, and Handoff

- [x] **QA32-01**: `docs/language/final-language-qa-report.md` summarizes scope, pages checked, languages checked, issues found, issues fixed, known issues, per-language summaries, and approval decision.
- [x] **QA32-02**: README includes a Phase 32 Cross-Locale Language QA and Artifact Cleanup section.
- [x] **QA32-03**: `npm run build` succeeds after copy and cleanup changes.
- [x] **QA32-04**: Four-language smoke or visual QA evidence covers Homepage, Register, Practice, Learning Chat, Parent Report, Tutor Request Detail, Pricing, Billing, Contact, and Footer.
- [x] **QA32-05**: Full demo flow remains coherent after copy cleanup and does not show development artifacts.

## Future Requirements

### External User Testing

- **TEST-FUTURE-01**: Run external student testing for Practice -> Learning Chat after language QA passes.
- **TEST-FUTURE-02**: Run external parent testing for Parent Report and Learning Activity clarity after language QA passes.
- **TEST-FUTURE-03**: Run external teacher testing for Practice-origin request context after language QA passes.

### Localization Operations

- **L10N-FUTURE-01**: Add a formal translator review workflow before public launch.
- **L10N-FUTURE-02**: Add automated screenshot comparison per locale if the project adopts a visual regression service.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New product functionality | Phase 32 is a language quality and artifact cleanup milestone only. |
| New public pages or app routes | The milestone audits and fixes existing surfaces; it does not expand information architecture. |
| New languages | English, German, French, and Italian are the only Phase 32 languages. |
| New Practice subjects or curriculum content | Curriculum expansion is outside this language QA pass. |
| Broad UI redesign | Layout changes are limited to fixing language fit and copy overflow. |
| Formal backend, database, payment, or provider work | The milestone stays in frontend copy, UI, docs, and QA. |
| Modifying `/Users/zhdeng/newweb` | Company homepage source remains read-only and out of scope. |
| Removing technical terms from developer docs/tests/code identifiers | The cleanup target is user-facing UI; technical artifacts can retain precise implementation language. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUD32-01 | Phase 171 | Complete |
| AUD32-02 | Phase 171 | Complete |
| AUD32-03 | Phase 171 | Complete |
| AUD32-04 | Phase 171 | Complete |
| AUD32-05 | Phase 171 | Complete |
| EN32-01 | Phase 172 | Complete |
| EN32-02 | Phase 172 | Complete |
| EN32-03 | Phase 172 | Complete |
| EN32-04 | Phase 172 | Complete |
| EN32-05 | Phase 172 | Complete |
| DE32-01 | Phase 172 | Complete |
| DE32-02 | Phase 172 | Complete |
| DE32-03 | Phase 172 | Complete |
| DE32-04 | Phase 172 | Complete |
| DE32-05 | Phase 172 | Complete |
| FR32-01 | Phase 173 | Complete |
| FR32-02 | Phase 173 | Complete |
| FR32-03 | Phase 173 | Complete |
| FR32-04 | Phase 173 | Complete |
| FR32-05 | Phase 173 | Complete |
| IT32-01 | Phase 173 | Complete |
| IT32-02 | Phase 173 | Complete |
| IT32-03 | Phase 173 | Complete |
| IT32-04 | Phase 173 | Complete |
| IT32-05 | Phase 173 | Complete |
| TERM32-01 | Phase 174 | Complete |
| TERM32-02 | Phase 174 | Complete |
| TERM32-03 | Phase 174 | Complete |
| TERM32-04 | Phase 174 | Complete |
| TERM32-05 | Phase 174 | Complete |
| ART32-01 | Phase 174 | Complete |
| ART32-02 | Phase 174 | Complete |
| ART32-03 | Phase 174 | Complete |
| ART32-04 | Phase 174 | Complete |
| ART32-05 | Phase 174 | Complete |
| UI32-01 | Phase 175 | Complete |
| UI32-02 | Phase 175 | Complete |
| UI32-03 | Phase 175 | Complete |
| UI32-04 | Phase 175 | Complete |
| UI32-05 | Phase 175 | Complete |
| QA32-01 | Phase 176 | Complete |
| QA32-02 | Phase 176 | Complete |
| QA32-03 | Phase 176 | Complete |
| QA32-04 | Phase 176 | Complete |
| QA32-05 | Phase 176 | Complete |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0

---
*Requirements defined: 2026-05-27*
*Last updated: 2026-05-27 after Phase 32 milestone initialization*
