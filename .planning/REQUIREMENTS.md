# Requirements: STOA Frontend

**Defined:** 2026-05-25
**Milestone:** v1.16 Phase 17: Locale-Specific Copywriting, Responsive Typography, and Multilingual UI Refinement
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, stable demo backend support, documented API contracts, coherent demo flows, multilingual Swiss-market language support, natural locale-specific product copy, and a clean path to future real backend integration.

## v1.16 Requirements

Requirements for Phase 17. Each requirement maps to exactly one roadmap phase.

### Locale Copy Governance

- [ ] **LCOPY-01**: Developers can read `docs/language/locale-copy-rules.md` to understand that English, German, French, and Italian may use different sentence structures while preserving product meaning, tone, and brand.
- [ ] **LCOPY-02**: Developers can read `docs/language/german-copy-rules.md` for German headline, CTA, long-word, sentence-splitting, and layout-fit rules.
- [ ] **LCOPY-03**: Developers can read `docs/language/french-copy-rules.md` for French title, CTA, punctuation, sentence-length, and natural product-copy rules.
- [ ] **LCOPY-04**: Developers can read `docs/language/italian-copy-rules.md` for Italian title, CTA, warmth, clarity, and UI-fit rules.
- [ ] **LCOPY-05**: Developers can consult updated glossary and copy style guide guidance for Phase 17 locale-specific copy decisions.
- [ ] **LCOPY-06**: Developers can consult an updated translation QA checklist that includes localized copy quality, title length, terminology, and visual fit checks.
- [ ] **LCOPY-07**: Developers can see explicit Phase 17 scope boundaries that exclude new languages, CMS/TMS, automatic translation, SEO localization, legal final translation, backend preference sync, and new business features.

### Hero Copy and Title Structure

- [ ] **HERO-01**: User sees the English homepage hero title `Learn with clarity.` with a natural English subtitle and CTA copy.
- [ ] **HERO-02**: User sees the German homepage hero as stacked short title lines `Lernen.`, `Fragen.`, `Verstehen.` with explanatory subtitle copy instead of one long translated sentence.
- [ ] **HERO-03**: User sees the French homepage hero title `Comprendre avec confiance.` with natural French subtitle and CTA copy.
- [ ] **HERO-04**: User sees the Italian homepage hero title `Studiare con più chiarezza.` with natural Italian subtitle and CTA copy.
- [ ] **HERO-05**: `HomeHero` supports optional localized `titleLines` while preserving a safe `title` fallback for locales that use a single title string.
- [ ] **HERO-06**: German hero title rendering no longer breaks visual rhythm at mobile, tablet, desktop, or wide desktop widths.

### Locale Layout Infrastructure

- [ ] **LAYOUT-01**: Developers can use a typed `localeLayout` helper for supported locales `en`, `de`, `fr`, and `it`.
- [ ] **LAYOUT-02**: Locale layout hints can distinguish default and stacked hero title variants without placing rendering metadata inside translation strings.
- [ ] **LAYOUT-03**: Locale layout hints can identify button/action density needs for long German and French labels.
- [ ] **LAYOUT-04**: Hero typography and width constraints adapt to locale-specific title length without globally shrinking all headings.
- [ ] **LAYOUT-05**: Navbar, CTA buttons, card titles, pricing cards, form labels, and chat action controls remain readable and do not overflow in English, German, French, or Italian.
- [ ] **LAYOUT-06**: CSS or component adjustments for multilingual fit are scoped to affected components and do not introduce a broad visual redesign.

### P0 Product Copy Rewrite

- [ ] **P0COPY-01**: Homepage section titles, body copy, learning-flow copy, teacher-support copy, and CTA copy read naturally in English, German, French, and Italian.
- [ ] **P0COPY-02**: Register and onboarding role-selection, student, parent, and tutor copy read naturally in English, German, French, and Italian.
- [ ] **P0COPY-03**: Chat empty states, input placeholders, Learning Assistant states, teacher request action, loading text, and errors read naturally in English, German, French, and Italian.
- [ ] **P0COPY-04**: Parent dashboard and parent report copy remains calm, supportive, and non-alarmist in English, German, French, and Italian.
- [ ] **P0COPY-05**: Tutor workflow copy remains professional and does not imply teachers are replaced or used as backup in English, German, French, and Italian.
- [ ] **P0COPY-06**: Pricing and billing copy uses education-value language and avoids aggressive sales phrasing in English, German, French, and Italian.
- [ ] **P0COPY-07**: Support, feedback, error, toast, empty, and loading messages are concise and localized without technical or machine-translated tone.
- [ ] **P0COPY-08**: Data-driven pricing, billing, plan, and demo copy that appears in P0 UI is localized or mapped from stable IDs instead of leaking English mock text.

### Terminology Cleanup

- [ ] **TERM17-01**: User-visible P0 copy avoids `AI`, `Artificial Intelligence`, `AI Support`, `AI answer`, `AI response`, `AI tutor`, `Chatbot`, and `Bot` unless explicitly documented as technical/internal copy.
- [ ] **TERM17-02**: User-visible P0 copy avoids `Human backup` and `Teacher backup`.
- [ ] **TERM17-03**: User-visible P0 pricing and marketing copy avoids `What we are selling`, `Buy now`, and equivalent aggressive sales phrasing.
- [ ] **TERM17-04**: Parent/family-facing user-visible copy uses `families`, `parents`, or role-appropriate language instead of unnatural `customers` wording.
- [ ] **TERM17-05**: User-visible teacher escalation terminology consistently uses `Professional teacher support` or approved locale-specific equivalents.
- [ ] **TERM17-06**: Terminology cleanup preserves internal identifiers where changing them would create unnecessary code churn, while removing banned terms from rendered user copy.

### Copy and Visual QA

- [ ] **QA17-01**: `docs/language/copy-review-matrix.md` records key copy for homepage, register, chat, pricing, billing, parent report, tutor workflow, support, and shared states in English, German, French, and Italian.
- [ ] **QA17-02**: `docs/language/copy-review-matrix.md` includes tone, length, UI fit, and approval status for critical keys such as `home.hero.title`.
- [ ] **QA17-03**: `docs/language/visual-qa-by-locale.md` defines required locale and viewport checks for `375px`, `430px`, `768px`, `1024px`, and `1440px`.
- [ ] **QA17-04**: Visual QA covers P0 pages: homepage, register, chat, pricing, parent report, and any additional available billing, tutor, and support surfaces.
- [ ] **QA17-05**: QA evidence confirms German long titles, French subtitles, Italian CTAs, navbar labels, pricing cards, register forms, and chat teacher-request actions do not overflow or break layout.
- [ ] **QA17-06**: Terminology grep or equivalent audit confirms banned user-facing terminology is removed from P0 rendered copy sources.
- [ ] **QA17-07**: `npm run build` passes after Phase 17 changes.

### Documentation and Handoff

- [ ] **DOCS17-01**: README documents Phase 17 locale-specific copy and UI refinement goals, rules, terminology warnings, and example hero copy.
- [ ] **DOCS17-02**: README or language docs explain that STOA prioritizes meaning, tone, brand consistency, natural reading, and layout stability over literal translation.
- [ ] **DOCS17-03**: Phase 17 handoff notes identify remaining native-speaker review, legal-sensitive translation, and future cross-locale QA automation gaps.

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Phase 18 Accessibility, Design System, and Cross-Locale QA

- **A11Y-01**: App has accessibility audit coverage for keyboard navigation, screen reader labels, focus states, language attributes, and color contrast.
- **A11Y-02**: App supports stronger screen reader behavior for form errors, route changes, chat status updates, and dynamic loading states.
- **DS-01**: Team can review documented design tokens for colors, typography, spacing, borders, shadows, and motion.
- **DS-02**: Team can review component documentation for Button, Card, Form, Table, Badge, layout primitives, and shared state components.
- **QA-UI-01**: App has visual regression or screenshot comparison coverage for major route surfaces across supported languages.
- **QA-LOCALE-AUTO-01**: Cross-locale QA has automated coverage for route, locale, viewport, and overflow checks.

### Future Localization

- **L10N-SEO-01**: App can support locale-aware SEO metadata and route strategy if STOA moves beyond demo/pilot surfaces.
- **L10N-CMS-01**: Team can manage high-volume translated content through a CMS or translation platform if content volume grows.
- **L10N-BE-01**: Formal backend can persist `preferredLanguage` across devices for authenticated users.
- **L10N-LEGAL-01**: Legal copy receives professional translation and legal review before broad public launch.
- **L10N-EMAIL-01**: Email templates can be localized if STOA adds production email flows.

### Production Backend

- **BACKEND-01**: Formal backend implements production authentication, authorization, persistence, AI orchestration, payment webhooks, subscription enforcement, analytics storage, support workflows, admin operations, parent invitations, tutor verification, and preferred language persistence.
- **AWS-01**: Production infrastructure deploys through a separately planned backend/cloud milestone.

## Out of Scope

Explicitly excluded from v1.16 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| New languages | Phase 17 refines English, German, French, and Italian only. |
| New business modules | Phase 17 improves copy and layout quality on existing surfaces. |
| Formal backend language preference system | Browser-local language persistence already exists; backend sync is future scope. |
| Translation CMS or TMS | Local JSON files are sufficient for the current product surface. |
| Automatic machine translation pipeline | Phase 17 requires controlled product copywriting, not automated translation. |
| Locale-prefixed routing and SEO localization | Useful later, but not required for current UI quality. |
| Full legal-document translation and legal review | Legal-sensitive copy remains draft/product language until professional legal review. |
| Email template localization | No production email template system is in current frontend scope. |
| Regional pricing or currency localization | Phase 17 does not change pricing mechanics. |
| Broad design-system or accessibility hardening | Reserved for Phase 18 except targeted layout fixes needed by multilingual copy. |
| Core product logic changes | Phase 17 must not change learning, billing, auth, backend, or role workflow behavior. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LCOPY-01 | TBD | Pending |
| LCOPY-02 | TBD | Pending |
| LCOPY-03 | TBD | Pending |
| LCOPY-04 | TBD | Pending |
| LCOPY-05 | TBD | Pending |
| LCOPY-06 | TBD | Pending |
| LCOPY-07 | TBD | Pending |
| HERO-01 | TBD | Pending |
| HERO-02 | TBD | Pending |
| HERO-03 | TBD | Pending |
| HERO-04 | TBD | Pending |
| HERO-05 | TBD | Pending |
| HERO-06 | TBD | Pending |
| LAYOUT-01 | TBD | Pending |
| LAYOUT-02 | TBD | Pending |
| LAYOUT-03 | TBD | Pending |
| LAYOUT-04 | TBD | Pending |
| LAYOUT-05 | TBD | Pending |
| LAYOUT-06 | TBD | Pending |
| P0COPY-01 | TBD | Pending |
| P0COPY-02 | TBD | Pending |
| P0COPY-03 | TBD | Pending |
| P0COPY-04 | TBD | Pending |
| P0COPY-05 | TBD | Pending |
| P0COPY-06 | TBD | Pending |
| P0COPY-07 | TBD | Pending |
| P0COPY-08 | TBD | Pending |
| TERM17-01 | TBD | Pending |
| TERM17-02 | TBD | Pending |
| TERM17-03 | TBD | Pending |
| TERM17-04 | TBD | Pending |
| TERM17-05 | TBD | Pending |
| TERM17-06 | TBD | Pending |
| QA17-01 | TBD | Pending |
| QA17-02 | TBD | Pending |
| QA17-03 | TBD | Pending |
| QA17-04 | TBD | Pending |
| QA17-05 | TBD | Pending |
| QA17-06 | TBD | Pending |
| QA17-07 | TBD | Pending |
| DOCS17-01 | TBD | Pending |
| DOCS17-02 | TBD | Pending |
| DOCS17-03 | TBD | Pending |

**Coverage:**
- v1.16 requirements: 43 total
- Mapped to phases: 0
- Unmapped: 43

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 during Phase 17 requirements definition*
