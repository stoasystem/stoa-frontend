# Requirements: STOA Frontend

**Defined:** 2026-05-25
**Milestone:** v1.15 Phase 16: Multilingual Language Optimization and AI Terminology Replacement
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, stable demo backend support, documented API contracts, coherent demo flows, multilingual Swiss-market language support, and a clean path to future real backend integration.

## v1.15 Requirements

Requirements for Phase 16. Each requirement maps to exactly one roadmap phase.

### I18n Foundation

- [ ] **I18N-01**: User can run the app with `i18next` and `react-i18next` initialized before React renders.
- [ ] **I18N-02**: User can switch between `en`, `de`, `fr`, and `it` with English fallback.
- [ ] **I18N-03**: User language choice persists across refresh through `localStorage` key `stoa_language`.
- [ ] **I18N-04**: Assistive technology can read the active language because the app updates `document.documentElement.lang`.
- [ ] **I18N-05**: Developers can add translations by namespace under `src/i18n/locales/{en,de,fr,it}`.
- [ ] **I18N-06**: Developers can reference supported languages and namespaces from typed constants.
- [ ] **I18N-07**: Demo/auth payload contracts can optionally carry `preferredLanguage` without requiring a production backend preference system.

### Language Switcher

- [ ] **LANG-01**: User can access a language switcher in the public marketing navigation.
- [ ] **LANG-02**: User can access a language switcher on login and register pages.
- [ ] **LANG-03**: Signed-in users can access a language switcher from the app user/menu area.
- [ ] **LANG-04**: User can access language choices in the footer without relying on flags.
- [ ] **LANG-05**: Mobile layouts keep language switching usable without crowding chat input or primary study controls.

### Terminology and Copy System

- [ ] **TERM-01**: User-visible UI no longer uses `AI` as the main product term on core pages.
- [ ] **TERM-02**: User-visible UI uses `Learning Assistant` for first-response learning help in English.
- [ ] **TERM-03**: User-visible UI uses `Lernassistent`, `Assistant d’apprentissage`, and `Assistente all’apprendimento` in German, French, and Italian.
- [ ] **TERM-04**: User-visible UI uses `Professional teacher support` and equivalent DE/FR/IT terms instead of `human backup` or `teacher backup`.
- [ ] **TERM-05**: Pricing and marketing copy avoids sales-heavy wording such as `what we are selling`, `buy now`, and generic `customers`.
- [ ] **TERM-06**: Developers can consult `docs/language/glossary.md` for approved terms and banned terms.
- [ ] **TERM-07**: Developers can consult `docs/language/copy-style-guide.md` for tone rules.
- [ ] **TERM-08**: Developers can consult `docs/language/terminology-replacement.md` for concrete replacement patterns and grep targets.

### Public, Auth, and Onboarding Localization

- [ ] **PUBLIC-01**: Homepage content supports English, German, French, and Italian.
- [ ] **PUBLIC-02**: Homepage CTA and flow copy use learning-support language rather than AI-first technology language.
- [ ] **PUBLIC-03**: Marketing navigation and footer labels support English, German, French, and Italian.
- [ ] **PUBLIC-04**: Login page supports English, German, French, and Italian.
- [ ] **PUBLIC-05**: Register page supports English, German, French, and Italian.
- [ ] **PUBLIC-06**: Student onboarding role/profile copy supports English, German, French, and Italian.
- [ ] **PUBLIC-07**: Parent and tutor onboarding copy, including tutor credential upload messaging, supports English, German, French, and Italian.

### Chat and Interaction Localization

- [ ] **CHAT-01**: Chat empty state supports English, German, French, and Italian.
- [ ] **CHAT-02**: Chat input placeholder supports English, German, French, and Italian.
- [ ] **CHAT-03**: Learning Assistant loading/thinking state supports English, German, French, and Italian.
- [ ] **CHAT-04**: Assistant response and teacher escalation copy support English, German, French, and Italian.
- [ ] **CHAT-05**: Teacher request CTA uses `Ask a teacher` style language in all four languages.
- [ ] **CHAT-06**: Form validation messages come from `errors` translations instead of hardcoded English.
- [ ] **CHAT-07**: Toast, empty, loading, and error states for core flows come from locale files.

### Core Role and Commercial Page Localization

- [ ] **CORE-01**: Parent dashboard supports English, German, French, and Italian.
- [ ] **CORE-02**: Parent report and learning-history surfaces support English, German, French, and Italian.
- [ ] **CORE-03**: Tutor request list/detail/status workflow supports English, German, French, and Italian.
- [ ] **CORE-04**: Pricing page supports English, German, French, and Italian with education-oriented wording.
- [ ] **CORE-05**: Billing, subscription, usage, and virtual checkout pages support English, German, French, and Italian.
- [ ] **CORE-06**: Support and feedback pages support English, German, French, and Italian.
- [ ] **CORE-07**: Profile and student learning-history P1 pages have baseline English, German, French, and Italian localization.
- [ ] **CORE-08**: Referral and tutor availability P1 pages have baseline English, German, French, and Italian localization.
- [ ] **CORE-09**: Admin overview P1 page has baseline English, German, French, and Italian localization.

### QA and Documentation

- [ ] **QA-01**: Translation QA checklist exists and covers EN/DE/FR/IT page and flow testing.
- [ ] **QA-02**: QA checks confirm no user-visible core-page `AI`, `AI tutor`, `chatbot`, `human backup`, or `teacher backup` wording remains.
- [ ] **QA-03**: QA checks confirm German, French, and Italian text does not break navbar, buttons, pricing cards, forms, or chat actions on mobile.
- [ ] **QA-04**: QA checks confirm language selection persists after refresh.
- [ ] **QA-05**: QA checks confirm core demo flows still run in English, German, French, and Italian.
- [ ] **QA-06**: README documents Phase 16 multilingual setup, language switching, terminology rules, and verification commands.
- [ ] **QA-07**: `npm run build` passes after Phase 16 changes.

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Phase 17 Design System and Accessibility

- **DS-01**: Team can review component documentation for Button, Card, Form, Table, Badge, layout primitives, and shared state components.
- **DS-02**: Team can review a consolidated token system for colors, typography, spacing, borders, shadows, and motion.
- **A11Y-01**: App has accessibility audit coverage for keyboard navigation, screen reader labels, focus states, language attributes, and color contrast.
- **QA-UI-01**: App has visual regression or screenshot comparison coverage for major route surfaces across supported languages.

### Future Localization

- **L10N-SEO-01**: App can support locale-aware SEO metadata and route strategy if STOA moves beyond demo/pilot surfaces.
- **L10N-CMS-01**: Team can manage high-volume translated content through a CMS or translation platform if content volume grows.
- **L10N-BE-01**: Formal backend can persist `preferredLanguage` across devices for authenticated users.
- **L10N-LEGAL-01**: Legal copy receives professional translation and legal review before broad public launch.

### Production Backend

- **BACKEND-01**: Formal backend implements production authentication, authorization, persistence, AI orchestration, payment webhooks, subscription enforcement, analytics storage, support workflows, admin operations, parent invitations, tutor verification, and preferred language persistence.
- **AWS-01**: Production infrastructure deploys through a separately planned backend/cloud milestone.

## Out of Scope

Explicitly excluded from v1.15 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| New business modules | Phase 16 optimizes language and terminology only. |
| Formal backend language preference system | Browser-local persistence is enough for the demo and frontend migration. |
| Translation CMS or TMS | Local JSON files are sufficient for this milestone. |
| Automatic machine translation pipeline | Phase 16 uses controlled copy and reviewed locale files, not automated translation. |
| Locale-prefixed routing and SEO localization | Useful later, but not required for demo/product flow usability. |
| Legal final review | Privacy/terms translations remain product drafts until legal review. |
| Email template localization | No email template system is in current frontend scope. |
| Regional pricing or currency localization | Phase 16 does not change pricing mechanics. |
| Full design-system/a11y hardening | Reserved for Phase 17 except layout fixes needed by multilingual copy. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| I18N-01 | Phase 92 | Planned |
| I18N-02 | Phase 92 | Planned |
| I18N-03 | Phase 92 | Planned |
| I18N-04 | Phase 92 | Planned |
| I18N-05 | Phase 92 | Planned |
| I18N-06 | Phase 92 | Planned |
| I18N-07 | Phase 92 | Planned |
| LANG-01 | Phase 92 | Planned |
| LANG-02 | Phase 92 | Planned |
| LANG-03 | Phase 92 | Planned |
| LANG-04 | Phase 92 | Planned |
| LANG-05 | Phase 92 | Planned |
| TERM-01 | Phase 93 | Planned |
| TERM-02 | Phase 93 | Planned |
| TERM-03 | Phase 93 | Planned |
| TERM-04 | Phase 93 | Planned |
| TERM-05 | Phase 93 | Planned |
| TERM-06 | Phase 93 | Planned |
| TERM-07 | Phase 93 | Planned |
| TERM-08 | Phase 93 | Planned |
| PUBLIC-01 | Phase 94 | Planned |
| PUBLIC-02 | Phase 94 | Planned |
| PUBLIC-03 | Phase 94 | Planned |
| PUBLIC-04 | Phase 94 | Planned |
| PUBLIC-05 | Phase 94 | Planned |
| PUBLIC-06 | Phase 94 | Planned |
| PUBLIC-07 | Phase 94 | Planned |
| CHAT-01 | Phase 95 | Planned |
| CHAT-02 | Phase 95 | Planned |
| CHAT-03 | Phase 95 | Planned |
| CHAT-04 | Phase 95 | Planned |
| CHAT-05 | Phase 95 | Planned |
| CHAT-06 | Phase 95 | Planned |
| CHAT-07 | Phase 95 | Planned |
| CORE-01 | Phase 96 | Planned |
| CORE-02 | Phase 96 | Planned |
| CORE-03 | Phase 96 | Planned |
| CORE-04 | Phase 96 | Planned |
| CORE-05 | Phase 96 | Planned |
| CORE-06 | Phase 96 | Planned |
| CORE-07 | Phase 96 | Planned |
| CORE-08 | Phase 96 | Planned |
| CORE-09 | Phase 96 | Planned |
| QA-01 | Phase 97 | Planned |
| QA-02 | Phase 97 | Planned |
| QA-03 | Phase 97 | Planned |
| QA-04 | Phase 97 | Planned |
| QA-05 | Phase 97 | Planned |
| QA-06 | Phase 97 | Planned |
| QA-07 | Phase 97 | Planned |

**Coverage:**
- v1.15 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 at Phase 16 planning*
