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

## Phases

<details open>
<summary>✅ v1.15 Phase 16: Multilingual Language Optimization and AI Terminology Replacement (Phases 92-97)</summary>

**Milestone Goal:** Make STOA usable across English, German, French, and Italian while replacing user-visible AI-heavy terminology with calmer education-centered language.

- [x] **Phase 92: I18n Foundation and Language Switching** - Add i18next/react-i18next, locale scaffolding, language constants, persistence, root language updates, and switcher placement.
- [x] **Phase 93: Glossary, Copy System, and Terminology Audit** - Document approved terminology, banned terms, copy tone, and replacement rules; prepare audit checks for user-facing AI-heavy copy.
- [x] **Phase 94: Public, Auth, and Onboarding Localization** - Localize homepage, marketing navigation/footer, login, register, and role onboarding in EN/DE/FR/IT.
- [x] **Phase 95: Chat and Interaction Localization** - Localize chat, teacher escalation, validation, toast, loading, empty, and error states with Learning Assistant language.
- [x] **Phase 96: Core Role, Commercial, and P1 Page Localization** - Localize parent, tutor, pricing, billing, support, profile/history/referral/tutor availability/admin overview surfaces.
- [x] **Phase 97: Multilingual QA, Documentation, and Build Closure** - Verify four-language demo flows, long-copy layout, terminology cleanup, persistence, README, and build.

### Phase 92: I18n Foundation and Language Switching

**Goal**: Establish the frontend multilingual architecture and language switcher without changing product functionality.
**Depends on**: Phase 91
**Requirements**: [I18N-01, I18N-02, I18N-03, I18N-04, I18N-05, I18N-06, I18N-07, LANG-01, LANG-02, LANG-03, LANG-04, LANG-05]
**Success Criteria** (what must be TRUE):
  1. `i18next` and `react-i18next` initialize before React renders, with English fallback and EN/DE/FR/IT resources.
  2. Locale files exist under `src/i18n/locales/{en,de,fr,it}` with namespace scaffolding for common, home, auth, chat, parent, tutor, pricing, billing, support, admin, and errors.
  3. `LanguageSwitcher` changes language, persists `stoa_language`, and updates `document.documentElement.lang`.
  4. Language switching appears in marketing navigation, auth pages, app menu/user area, and footer without crowding mobile layouts.
  5. Auth/demo contract types can carry optional `preferredLanguage` without requiring backend persistence.
**Plans**: 1/1

### Phase 93: Glossary, Copy System, and Terminology Audit

**Goal**: Define the STOA language system so user-facing copy becomes education-oriented and avoids AI-heavy or sales-heavy phrasing.
**Depends on**: Phase 92
**Requirements**: [TERM-01, TERM-02, TERM-03, TERM-04, TERM-05, TERM-06, TERM-07, TERM-08]
**Success Criteria** (what must be TRUE):
  1. `docs/language/glossary.md` defines approved EN/DE/FR/IT terms for Learning Assistant, professional teacher support, learning progress, parent dashboard, ask a teacher, and start learning.
  2. `docs/language/copy-style-guide.md` defines clear, calm, trustworthy, education-oriented tone rules and anti-patterns.
  3. `docs/language/terminology-replacement.md` lists banned user-facing terms and concrete replacements.
  4. A source audit identifies current user-visible `AI`, `AI tutor`, `AI answer`, `human backup`, `teacher backup`, `what we are selling`, `buy now`, `customers`, and overly technical/sales-heavy wording.
  5. Planned locale keys use the approved terminology system rather than translating deprecated copy literally.
**Plans**: 1/1

### Phase 94: Public, Auth, and Onboarding Localization

**Goal**: Localize the first impression and registration path for four languages while preserving the premium Phase 15 layout.
**Depends on**: Phase 93
**Requirements**: [PUBLIC-01, PUBLIC-02, PUBLIC-03, PUBLIC-04, PUBLIC-05, PUBLIC-06, PUBLIC-07]
**Success Criteria** (what must be TRUE):
  1. Homepage hero, learning flow, parent visibility, teacher support, CTA section, and footer render from locale files in EN/DE/FR/IT.
  2. Marketing navigation labels and CTAs render from locale files in EN/DE/FR/IT.
  3. Login and register pages render from locale files in EN/DE/FR/IT.
  4. Student, parent, and tutor onboarding steps render role labels, fields, helper text, upload messaging, and completion copy from locale files.
  5. Public/auth/onboarding copy uses Learning Assistant and professional teacher support terminology instead of AI-first technology language.
**Plans**: 1/1

### Phase 95: Chat and Interaction Localization

**Goal**: Localize the student learning loop and shared interaction states so the main demo flow works naturally in all four languages.
**Depends on**: Phase 94
**Requirements**: [CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07]
**Success Criteria** (what must be TRUE):
  1. Chat empty state, input placeholder, send controls, and conversation labels render in EN/DE/FR/IT.
  2. Learning Assistant loading/preparing states render in EN/DE/FR/IT and avoid user-facing `AI is thinking` phrasing.
  3. Assistant response feedback and teacher escalation CTA render in EN/DE/FR/IT.
  4. Form validation strings come from `errors` translations instead of hardcoded English.
  5. Toast, empty, loading, and error states for login/register/chat/upload/profile/support/checkout core flows use locale keys.
**Plans**: 1/1

### Phase 96: Core Role, Commercial, and P1 Page Localization

**Goal**: Localize the parent, tutor, pricing, billing, support, and priority secondary app surfaces needed for demos.
**Depends on**: Phase 95
**Requirements**: [CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, CORE-09]
**Success Criteria** (what must be TRUE):
  1. Parent dashboard, child report, and child learning-history surfaces render in EN/DE/FR/IT.
  2. Tutor request list/detail/status workflow renders in EN/DE/FR/IT.
  3. Pricing, billing, subscription, usage, and virtual checkout pages render in EN/DE/FR/IT with education-oriented commercial copy.
  4. Support and feedback pages render in EN/DE/FR/IT.
  5. Profile, student learning history, referral, tutor availability, and admin overview have baseline EN/DE/FR/IT localization.
**Plans**: 1/1

### Phase 97: Multilingual QA, Documentation, and Build Closure

**Goal**: Close Phase 16 with four-language flow checks, long-copy layout validation, terminology checks, README updates, and build verification.
**Depends on**: Phase 96
**Requirements**: [QA-01, QA-02, QA-03, QA-04, QA-05, QA-06, QA-07]
**Success Criteria** (what must be TRUE):
  1. `docs/language/translation-qa-checklist.md` covers EN/DE/FR/IT core pages, demo flows, persistence, long-copy layout, and terminology.
  2. QA checks verify no user-visible core-page `AI`, `AI tutor`, `chatbot`, `human backup`, or `teacher backup` wording remains.
  3. Mobile checks verify German, French, and Italian text does not break navbar, buttons, pricing cards, forms, or chat actions.
  4. Language selection persists after refresh.
  5. README documents Phase 16 setup, language switching, terminology rules, and verification commands, and `npm run build` passes.
**Plans**: 1/1

</details>

<details>
<summary>✅ Previous shipped milestones (Phases 1-91)</summary>

Phases 1-91 shipped the STOA frontend foundation, product UI, backend chat integration, streaming/file uploads, authenticated roles, parent/tutor/admin MVP flows, staging/QA, production/pilot readiness, pricing validation, virtual checkout, launch-ready legal drafts, paid launch frontend, parent acquisition, referrals, tutor availability, support tickets, admin analytics, UTM tracking, platform/organization demos, learning-intelligence demos, curriculum graph UI, weak-point diagnosis UI, monthly parent report, retention UI, partnership onboarding, information architecture, route inventory, role-based navigation, breadcrumbs, page-flow helpers, mobile navigation, final demo flow, stable demo backend support, API mode configuration, real backend readiness, AWS readiness notes, Phase 15 homepage/onboarding refinement, premium UI polish, and inline teacher escalation.

See `.planning/MILESTONES.md` and archived milestone audit files for detailed shipped scope and verification evidence.

</details>

## Progress

**Execution Order:**
Phase 16 phases planned in numeric order: 92 -> 93 -> 94 -> 95 -> 96 -> 97

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 92. I18n Foundation and Language Switching | v1.15 | 1/1 | Complete | 2026-05-25 |
| 93. Glossary, Copy System, and Terminology Audit | v1.15 | 1/1 | Complete | 2026-05-25 |
| 94. Public, Auth, and Onboarding Localization | v1.15 | 1/1 | Complete | 2026-05-25 |
| 95. Chat and Interaction Localization | v1.15 | 1/1 | Complete | 2026-05-25 |
| 96. Core Role, Commercial, and P1 Page Localization | v1.15 | 1/1 | Complete | 2026-05-25 |
| 97. Multilingual QA, Documentation, and Build Closure | v1.15 | 1/1 | Complete | 2026-05-25 |
