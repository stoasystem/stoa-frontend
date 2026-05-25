# Requirements: STOA Frontend

**Defined:** 2026-05-26
**Milestone:** v1.18 Phase 19: Brand-Aligned Visual Refinement with Main Website Design Translation
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, stable demo backend support, documented API contracts, coherent demo flows, multilingual Swiss-market language support, natural locale-specific product copy, production-facing user language, brand-aligned visual design, and a clean path to future real backend integration.

## v1.18 Requirements

Requirements for Phase 19. Each requirement maps to exactly one roadmap phase.

### Read-Only Source Audit

- [ ] **SAFE19-01**: Developers can review `docs/design/main-website-readonly-audit.md` to confirm `/Users/zhdeng/newweb` was used only as a read-only design reference.
- [ ] **SAFE19-02**: The audit records pre-work and post-work `git status` for `/Users/zhdeng/newweb`, including the pre-existing `img/team/.DS_Store` modification if it remains present.
- [ ] **SAFE19-03**: Phase 19 does not write, format, install dependencies, delete, move, rename, commit, or otherwise modify files inside `/Users/zhdeng/newweb`.
- [ ] **SAFE19-04**: No files, components, CSS files, or image assets are copied directly from `/Users/zhdeng/newweb` into `stoa-frontend`.
- [ ] **SAFE19-05**: The source audit records the main website's colors, typography, spacing, layout, buttons, cards, hero treatment, image style, and overall brand tone.
- [ ] **SAFE19-06**: The source audit distinguishes reusable design signals from source-specific implementation details that must not be imported into the learning platform.

### Design Translation Documentation

- [ ] **TRANS19-01**: `docs/design/main-website-design-translation.md` defines the relationship as same brand family, different product surface.
- [ ] **TRANS19-02**: The translation doc summarizes the company homepage design language using evidence from `/Users/zhdeng/newweb`.
- [ ] **TRANS19-03**: The translation doc specifies what the learning platform should share with the homepage: brand tone, visual warmth, editorial title rhythm, restrained buttons, photography-informed composition, and premium education feel.
- [ ] **TRANS19-04**: The translation doc specifies what must remain different: app density, dashboard scannability, chat usability, form clarity, and product identity.
- [ ] **TRANS19-05**: The translation doc includes adaptation rules for homepage, auth, chat, dashboards, parent report, pricing, and billing.
- [ ] **TRANS19-06**: The translation doc explicitly prohibits direct copying of homepage CSS, components, fonts at identical scale, and image assets.

### Token and Theme Refinement

- [ ] **TOKEN19-01**: `docs/design/learning-platform-token-adjustment.md` proposes derived app tokens based on the source website's burgundy, charcoal, warm grey, white, and muted grey signals.
- [ ] **TOKEN19-02**: `src/styles/brand-tokens.css` or equivalent introduces translated brand variables for brand, accent, surface, text, border, and interactive roles.
- [ ] **TOKEN19-03**: `src/styles/platform-theme.css` or equivalent applies app-specific theme refinements without replacing the existing STOA design system wholesale.
- [ ] **TOKEN19-04**: The token refinement reduces bright SaaS blue/teal dominance while preserving clear, accessible interactive affordances.
- [ ] **TOKEN19-05**: Typography tokens or CSS helpers support editorial display headings for public/auth/report surfaces and readable UI typography for app surfaces.
- [ ] **TOKEN19-06**: Theme changes preserve Phase 17 multilingual layout safeguards, including German stacked hero support and long-label wrapping.
- [ ] **TOKEN19-07**: Theme changes remain dependency-free and do not import external website CSS or JavaScript.

### Shared Component Refinement

- [ ] **COMP19-01**: Button variants are visually refined to feel more STOA-branded, restrained, and premium while keeping accessible focus, disabled, hover, and pending states.
- [ ] **COMP19-02**: Card variants are refined to reduce cheap SaaS card feel through subtler borders, surfaces, shadows, padding, and radius.
- [ ] **COMP19-03**: Badge/status variants remain clear but avoid overly bright red/green/blue styling.
- [ ] **COMP19-04**: Input, textarea, select, and form surfaces retain clear app usability while visually aligning with the translated token system.
- [ ] **COMP19-05**: PageHeader, SectionHeader, AppLogo, navigation, and sidebar surfaces receive brand-aligned treatment without making dashboards feel like marketing pages.
- [ ] **COMP19-06**: Chat bubbles, chat input, teacher-support actions, pricing cards, billing cards, and report cards use the translated brand language without sacrificing readability.

### Page-Level Visual Alignment

- [ ] **PAGE19-01**: Homepage visual rhythm, typography, CTA treatment, imagery treatment, and section spacing feel aligned with the main website while remaining the learning platform entry point.
- [ ] **PAGE19-02**: Login and register/onboarding pages feel brand-aligned, trustworthy, and premium without adding onboarding functionality.
- [ ] **PAGE19-03**: Chat uses subtle brand accents, softer message surfaces, and professional teacher-support treatment while remaining product-app focused.
- [ ] **PAGE19-04**: Student dashboard remains clear and practical while using the translated card, heading, and accent system.
- [ ] **PAGE19-05**: Parent dashboard and parent report feel like high-quality education service surfaces with premium sectioning and calm report visuals.
- [ ] **PAGE19-06**: Pricing and billing pages use the translated brand language while preserving product-safe Phase 18 copy and payment-readiness boundaries.
- [ ] **PAGE19-07**: Tutor dashboard, tutor request detail, support, profile, learning history, and referral pages receive basic visual alignment.
- [ ] **PAGE19-08**: Admin, organization, curriculum graph, advanced analytics, and partnership pages receive token-level consistency without deep redesign.
- [ ] **PAGE19-09**: Page-level changes do not add new business features, routes, backend behavior, payment behavior, or new languages.

### Visual Compatibility QA and Build Evidence

- [ ] **QA19-01**: `docs/design/visual-compatibility-qa.md` compares the company homepage and learning platform across homepage, register, chat, parent report, pricing, and billing.
- [ ] **QA19-02**: Visual QA records brand similarity, product independence, and visual quality ratings, targeting medium-high brand similarity, high product independence, and high visual quality.
- [ ] **QA19-03**: QA confirms the learning platform does not look like a direct copy of the company homepage.
- [ ] **QA19-04**: QA confirms Chat and dashboards remain usable, scannable, and app-like.
- [ ] **QA19-05**: QA confirms homepage/auth/report pages carry the strongest brand alignment without breaking app identity.
- [ ] **QA19-06**: QA confirms English, German, French, and Italian P0 layouts remain stable after token and style changes.
- [ ] **QA19-07**: QA confirms mobile layouts remain stable for P0 pages.
- [ ] **QA19-08**: Verification confirms `npm run build` passes after visual changes.
- [ ] **QA19-09**: Verification documents `npm install` and `npm run dev` status or rationale, consistent with repository hygiene.
- [ ] **QA19-10**: README documents Phase 19 scope, read-only source policy, design translation goals, and non-copying rule.

## Future Requirements

Deferred to later milestones. Tracked but not in the current roadmap.

### Phase 20 Accessibility, Cross-Browser QA, and Release Quality Gate

- **A11Y20-01**: App has accessibility audit coverage for keyboard navigation, screen reader labels, focus states, language attributes, color contrast, route changes, forms, and chat status updates.
- **A11Y20-02**: Critical workflows are usable with keyboard-only navigation and announce dynamic loading, error, and success states to assistive technologies.
- **XBROWSER20-01**: App has cross-browser QA evidence for supported browsers and mobile device classes.
- **VISUAL20-01**: App has visual regression or screenshot comparison coverage for major route surfaces across supported languages and viewports.
- **PERF20-01**: App has a performance sanity check for core flows and public pages.
- **RELEASE20-01**: Team can run a final pre-launch release quality gate with accessibility, browser, locale, performance, and documentation criteria.

## Out of Scope

Explicitly excluded from v1.18 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Modifying `/Users/zhdeng/newweb` | The company homepage source is read-only for Phase 19. |
| Copying homepage components, CSS, or assets | Phase 19 translates design language; it does not clone the source website. |
| New product functionality | Phase 19 is visual alignment only. |
| New routes or page expansion | Existing surfaces are refined without expanding information architecture. |
| New dependencies | Existing CSS/Tailwind/component stack is sufficient. |
| New languages | Phase 19 keeps English, German, French, and Italian only. |
| Production backend or payment changes | Visual work must not change data contracts, payment behavior, or backend architecture. |
| Full accessibility release gate | Deferred to Phase 20, except visual changes must not knowingly degrade accessibility. |
| Full redesign | Phase 19 performs small-scope calibration, not a rebuild. |
| Marketing page clone | Chat, dashboards, and admin surfaces must remain app-like and usable. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SAFE19-01 | Phase 108 | Planned |
| SAFE19-02 | Phase 108 | Planned |
| SAFE19-03 | Phase 108 | Planned |
| SAFE19-04 | Phase 108 | Planned |
| SAFE19-05 | Phase 108 | Planned |
| SAFE19-06 | Phase 108 | Planned |
| TRANS19-01 | Phase 108 | Planned |
| TRANS19-02 | Phase 108 | Planned |
| TRANS19-03 | Phase 108 | Planned |
| TRANS19-04 | Phase 108 | Planned |
| TRANS19-05 | Phase 108 | Planned |
| TRANS19-06 | Phase 108 | Planned |
| TOKEN19-01 | Phase 109 | Planned |
| TOKEN19-02 | Phase 109 | Planned |
| TOKEN19-03 | Phase 109 | Planned |
| TOKEN19-04 | Phase 109 | Planned |
| TOKEN19-05 | Phase 109 | Planned |
| TOKEN19-06 | Phase 109 | Planned |
| TOKEN19-07 | Phase 109 | Planned |
| COMP19-01 | Phase 110 | Planned |
| COMP19-02 | Phase 110 | Planned |
| COMP19-03 | Phase 110 | Planned |
| COMP19-04 | Phase 110 | Planned |
| COMP19-05 | Phase 110 | Planned |
| COMP19-06 | Phase 110 | Planned |
| PAGE19-01 | Phase 111 | Planned |
| PAGE19-02 | Phase 111 | Planned |
| PAGE19-03 | Phase 112 | Planned |
| PAGE19-04 | Phase 112 | Planned |
| PAGE19-05 | Phase 112 | Planned |
| PAGE19-06 | Phase 112 | Planned |
| PAGE19-07 | Phase 112 | Planned |
| PAGE19-08 | Phase 112 | Planned |
| PAGE19-09 | Phase 112 | Planned |
| QA19-01 | Phase 112 | Planned |
| QA19-02 | Phase 112 | Planned |
| QA19-03 | Phase 112 | Planned |
| QA19-04 | Phase 112 | Planned |
| QA19-05 | Phase 112 | Planned |
| QA19-06 | Phase 112 | Planned |
| QA19-07 | Phase 112 | Planned |
| QA19-08 | Phase 112 | Planned |
| QA19-09 | Phase 112 | Planned |
| QA19-10 | Phase 112 | Planned |

**Coverage:**
- v1.18 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2026-05-26*

