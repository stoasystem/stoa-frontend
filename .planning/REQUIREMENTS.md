# Requirements: STOA Frontend

**Defined:** 2026-05-26
**Milestone:** v1.20 Phase 21: Accessibility, Cross-Browser QA, Brand Detail Integration, and Release Quality Gate
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, stable demo backend support, documented API contracts, coherent demo flows, natural English/German/French/Italian product copy, production-facing user language, brand-aligned visual design, cross-locale layout stability, accessibility/release-quality gates, trustworthy contact/brand details, and a clean path to future real backend integration.

## v1.20 Requirements

Requirements for Phase 21. Each requirement maps to exactly one roadmap phase.

### Brand Detail Source Study

- [ ] **BRAND21-01**: Developers can review `docs/brand/main-website-brand-details.md` to see the footer, contact, logo, and contact-form details observed from `/Users/zhdeng/newweb`.
- [ ] **BRAND21-02**: The brand detail study records pre-work and post-work `/Users/zhdeng/newweb` status, including the pre-existing `img/team/.DS_Store` modification if it remains present.
- [ ] **BRAND21-03**: Phase 21 does not write, format, install dependencies, build, delete, move, rename, commit, or otherwise modify files inside `/Users/zhdeng/newweb`.
- [ ] **BRAND21-04**: No homepage components, CSS files, source assets, or full company-homepage structures are copied into `stoa-frontend`.
- [ ] **BRAND21-05**: Brand integration docs distinguish reusable factual information from visual patterns that must be adapted for the learning platform.

### Footer, Logo, and Contact Integration

- [ ] **BRAND21-06**: `StoaLogo` provides dark, light, gold, and monochrome variants with size options and accessible text handling.
- [ ] **BRAND21-07**: The learning platform footer shows STOA name, address, email, phone if available, privacy, terms, contact, and main-homepage link information.
- [ ] **BRAND21-08**: Footer labels are localized for English, German, French, and Italian while stable company information remains accurate.
- [ ] **BRAND21-09**: Footer and logo styling follow the learning-platform theme and meet contrast expectations on light and dark surfaces.
- [ ] **BRAND21-10**: Brand docs cover footer contact integration, logo adaptation, and contact-form adaptation.
- [ ] **CONTACT21-01**: A `/contact` route exists and presents an adapted learning-platform contact page.
- [ ] **CONTACT21-02**: Contact form fields include name, email, optional phone, role, topic, message, and preferred language.
- [ ] **CONTACT21-03**: Contact role options include parent, student, teacher, school/tutoring center, and other.
- [ ] **CONTACT21-04**: Contact topic options include learning platform, professional teacher support, parent reports, pricing, tutor application, school partnership, technical support, and other.
- [ ] **CONTACT21-05**: Contact form labels, helper text, validation, success, and error copy are localized for English, German, French, and Italian.
- [ ] **CONTACT21-06**: `src/services/contact/contactApi.ts` defines the `POST /contact/requests` frontend API contract.
- [ ] **CONTACT21-07**: A contact mutation hook submits the form and exposes pending, success, and error states.
- [ ] **CONTACT21-08**: Contact form submission prevents duplicate submits while pending and allows retry after failure.
- [ ] **CONTACT21-09**: Contact form success message is visible and screen-reader-readable in all four supported languages.
- [ ] **CONTACT21-10**: Support and relevant public pages link users to `/contact` without adding complex backend or CRM scope.

### Accessibility and Keyboard Support

- [ ] **A11Y21-01**: `docs/accessibility/accessibility-audit.md` records P0 page accessibility audit results for Homepage, Login, Register, Chat, Parent Dashboard, Parent Report, Tutor Requests, Pricing, Billing, Contact, and Support.
- [ ] **A11Y21-02**: P0 pages have a coherent heading structure with one primary `h1` per route where feasible.
- [ ] **A11Y21-03**: Buttons, links, and icon-only controls have accessible names.
- [ ] **A11Y21-04**: Forms, including login/register/contact, have labels and field-level error associations.
- [ ] **A11Y21-05**: Loading, success, and error states that matter to users use appropriate live-region or status semantics.
- [ ] **A11Y21-06**: Chat message lists and teacher-request controls have basic screen-reader-friendly labels.
- [ ] **A11Y21-07**: `docs/accessibility/keyboard-navigation.md` records keyboard navigation coverage for homepage, login, register, chat, pricing, contact, language switcher, and dialogs/dropdowns.
- [ ] **A11Y21-08**: Focus states remain visible for navigation, buttons, inputs, selects, dialogs, and contact form controls.
- [ ] **A11Y21-09**: `docs/accessibility/screen-reader-smoke-test.md` records screen-reader smoke-test expectations and results.
- [ ] **A11Y21-10**: `docs/accessibility/color-contrast-audit.md` records contrast checks for text, muted text, buttons, badges, links, forms, logo variants, and footer text.

### Browser, Mobile, Visual, and Performance QA

- [ ] **QA21-01**: `docs/qa/cross-browser-qa.md` defines or records QA for Chrome, Safari, Firefox, Edge, Mobile Safari, iOS Chrome, and Android Chrome.
- [ ] **QA21-02**: Cross-browser QA covers font rendering, layout spacing, contact form, language switcher, chat input, upload button, dialog/dropdown behavior, logo rendering, and footer layout.
- [ ] **QA21-03**: `docs/qa/mobile-device-qa.md` defines or records QA for 375px, 390px, 430px, 768px, and 1024px widths.
- [ ] **QA21-04**: Mobile QA covers homepage, register, chat, parent report, pricing, contact, footer, logo, and four-language behavior.
- [ ] **QA21-05**: `docs/qa/visual-regression-testing.md` defines an initial Playwright screenshot baseline strategy for core routes and locales.
- [ ] **QA21-06**: Initial visual-regression baseline artifacts or documented capture commands exist for homepage, login, register, chat, parent, parent report, tutor, pricing, billing, contact, and support.
- [ ] **QA21-07**: `docs/qa/performance-sanity-check.md` records performance sanity checks for homepage loading, image/logo weight, contact form bundle impact, locale namespace size, chat responsiveness, and screenshot workflow cost.
- [ ] **QA21-08**: Core E2E smoke coverage is run or exact environment limitations are documented.
- [ ] **QA21-09**: Verification confirms `npm install` succeeds.
- [ ] **QA21-10**: Verification confirms `npm run dev` starts successfully or documents exact environment limitations.
- [ ] **QA21-11**: Verification confirms `npm run build` succeeds.

### Release Quality Gate and Handoff

- [ ] **RELEASE21-01**: `docs/release/release-quality-gate.md` defines the required pre-release gates for build, E2E, accessibility, keyboard, contrast, browser, mobile, contact form, footer/logo, terminology, and four-language checks.
- [ ] **RELEASE21-02**: `docs/release/final-pre-launch-checklist.md` provides a checkable final launch-readiness list.
- [ ] **RELEASE21-03**: Release docs explicitly state that contact form work is frontend/demo-contract only and does not send production email or integrate CRM.
- [ ] **RELEASE21-04**: Release docs confirm no user-visible `demo`, `mock`, `Codex`, provider, or development wording was introduced.
- [ ] **RELEASE21-05**: README documents Phase 21 scope, read-only source policy, brand detail integration, accessibility, QA, and release gate goals.
- [ ] **RELEASE21-06**: Phase 21 docs list known limitations and follow-up work for any browser/device/screen-reader coverage unavailable locally.
- [ ] **RELEASE21-07**: Post-work source safety check confirms `/Users/zhdeng/newweb` was not modified by Phase 21 work.
- [ ] **RELEASE21-08**: The milestone audit confirms Phase 21 requirements are satisfied before the milestone is marked complete.
- [ ] **RELEASE21-09**: GitHub receives clear Phase 21 commits.

## Future Requirements

Deferred to later milestones. Tracked but not in the current roadmap.

### Phase 22 Final Demo Packaging, Stakeholder Review, and Launch Candidate Preparation

- **DEMO22-01**: Final demo scripts exist for stakeholder, investor, parent, tutor, and school-review contexts.
- **LC22-01**: A launch-candidate branch and release-notes package can be prepared from the verified frontend state.
- **LOCK22-01**: Final copy, design, translation, and bug-triage locks are documented before launch candidate approval.

## Out of Scope

Explicitly excluded from v1.20 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Modifying `/Users/zhdeng/newweb` | The company homepage source is read-only for Phase 21. |
| Copying homepage components or engineering structure | Phase 21 adapts brand details; it does not transplant the company homepage. |
| Production email sending from contact form | Contact form is frontend UI and demo API contract only. |
| CRM integration | Too large for release-quality hardening and not needed for frontend validation. |
| Production anti-spam or abuse prevention system | Requires backend/ops design outside this milestone. |
| Formal backend support-ticket implementation | Existing demo/support boundaries remain sufficient for this phase. |
| Formal AWS deployment | Release-quality checks are frontend readiness, not infrastructure launch. |
| Full legal compliance finalization | Legal-sensitive copy and policies still need professional review. |
| Large visual redesign | Phase 19 established brand visuals; Phase 21 integrates details and quality gates. |
| New languages | Phase 21 keeps English, German, French, and Italian only. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND21-01 | Phase 118 | Pending |
| BRAND21-02 | Phase 118 | Pending |
| BRAND21-03 | Phase 118 | Pending |
| BRAND21-04 | Phase 118 | Pending |
| BRAND21-05 | Phase 118 | Pending |
| BRAND21-06 | Phase 119 | Pending |
| BRAND21-07 | Phase 119 | Pending |
| BRAND21-08 | Phase 119 | Pending |
| BRAND21-09 | Phase 119 | Pending |
| BRAND21-10 | Phase 119 | Pending |
| CONTACT21-01 | Phase 119 | Pending |
| CONTACT21-02 | Phase 119 | Pending |
| CONTACT21-03 | Phase 119 | Pending |
| CONTACT21-04 | Phase 119 | Pending |
| CONTACT21-05 | Phase 119 | Pending |
| CONTACT21-06 | Phase 119 | Pending |
| CONTACT21-07 | Phase 119 | Pending |
| CONTACT21-08 | Phase 119 | Pending |
| CONTACT21-09 | Phase 119 | Pending |
| CONTACT21-10 | Phase 119 | Pending |
| A11Y21-01 | Phase 120 | Pending |
| A11Y21-02 | Phase 120 | Pending |
| A11Y21-03 | Phase 120 | Pending |
| A11Y21-04 | Phase 120 | Pending |
| A11Y21-05 | Phase 120 | Pending |
| A11Y21-06 | Phase 120 | Pending |
| A11Y21-07 | Phase 120 | Pending |
| A11Y21-08 | Phase 120 | Pending |
| A11Y21-09 | Phase 120 | Pending |
| A11Y21-10 | Phase 120 | Pending |
| QA21-01 | Phase 121 | Pending |
| QA21-02 | Phase 121 | Pending |
| QA21-03 | Phase 121 | Pending |
| QA21-04 | Phase 121 | Pending |
| QA21-05 | Phase 121 | Pending |
| QA21-06 | Phase 121 | Pending |
| QA21-07 | Phase 121 | Pending |
| QA21-08 | Phase 121 | Pending |
| QA21-09 | Phase 121 | Pending |
| QA21-10 | Phase 121 | Pending |
| QA21-11 | Phase 121 | Pending |
| RELEASE21-01 | Phase 122 | Pending |
| RELEASE21-02 | Phase 122 | Pending |
| RELEASE21-03 | Phase 122 | Pending |
| RELEASE21-04 | Phase 122 | Pending |
| RELEASE21-05 | Phase 122 | Pending |
| RELEASE21-06 | Phase 122 | Pending |
| RELEASE21-07 | Phase 122 | Pending |
| RELEASE21-08 | Phase 122 | Pending |
| RELEASE21-09 | Phase 122 | Pending |

**Coverage:**
- v1.20 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 during v1.20 milestone initialization*
