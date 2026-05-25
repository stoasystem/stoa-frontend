# Project Research Summary

**Project:** STOA Frontend
**Domain:** Locale-specific product copywriting, responsive typography, and multilingual UI refinement
**Researched:** 2026-05-25
**Confidence:** HIGH

## Executive Summary

Phase 17 is a refinement milestone for an existing React/i18next STOA frontend, not a localization infrastructure rebuild. Phase 16 already delivered English, German, French, and Italian language switching, static JSON resources, terminology docs, and QA checklists. The expert approach is to treat each language as local product copy: preserve product meaning and tone, but let sentence structure, title rhythm, and layout structure vary by locale.

The recommended implementation is narrow: keep the current React 19, TypeScript, Vite, i18next, TailwindCSS 4, and Playwright stack; add optional `titleLines` support for large localized headings; add a small typed `src/i18n/localeLayout.ts` helper for layout hints; rewrite P0 copy across the main user surfaces; and document copy/visual QA results. The homepage hero is the highest-risk integration point because the current German title is too long for large serif display typography and should become short stacked copy such as `Lernen. Fragen. Verstehen.`.

The main risks are overbuilding infrastructure, hiding copy problems with global CSS shrinkage, leaving English or banned terminology in data-driven UI, and adding structured translation keys without safe fallbacks. Mitigate these with copy rules first, localized plan/display text, typed layout hints outside translation JSON, defensive array normalization, terminology grep across rendered sources, and a route x locale x viewport QA matrix.

## Key Findings

### Recommended Stack

No new runtime dependency is recommended. Phase 17 should extend the existing i18next JSON resources, Tailwind/premium theme utilities, and Playwright QA instead of adding a CMS, TMS, language detector, ICU/FormatJS, hyphenation library, component library, visual-regression SaaS, or translation automation.

**Core technologies:**
- React 19 + TypeScript + Vite: existing app foundation for component and JSON-resource changes.
- i18next + react-i18next: existing EN/DE/FR/IT namespace model; supports `returnObjects` for structured arrays such as `titleLines`.
- TailwindCSS 4 + `src/styles/premium-theme.css`: enough for `text-wrap`, `break-words`, `min-w-0`, flexible buttons, and scoped locale typography hooks.
- Playwright: existing E2E setup can add locale/viewport smoke checks without new tooling.
- `docs/language/*`: existing glossary, style guide, terminology replacement, and QA checklist should be extended.

**Stack additions/changes:**
- Add `src/i18n/localeLayout.ts` for typed layout hints only.
- Add optional locale JSON keys such as `home.hero.titleLines`; preserve `home.hero.title` as fallback.
- Optionally add a tiny copy helper for safe title array normalization if repeated outside `HomeHero`.

### Expected Features

**Must have (table stakes):**
- Locale copy rules for EN/DE/FR/IT, including when locales may diverge structurally while preserving STOA meaning and tone.
- German, French, and Italian copy guidance covering sentence length, CTA tone, punctuation, compounds, and UI fit.
- English source-copy refresh where current copy is too technical, too long, or not education-centered.
- Homepage hero rewrite in all four languages, with German stacked title support.
- P0 namespace rewrites for homepage, register/onboarding, chat, pricing, billing, parent, tutor, support, common/error/toast states.
- `titleLines` rendering for large localized titles, starting in `HomeHero`.
- `localeLayout.ts` hints for high-risk hero titles, buttons, nav labels, cards, pricing cards, and long text.
- Terminology cleanup for user-visible `AI`, `Human backup`, `Teacher backup`, `What we are selling`, `Buy now`, `Customers`, and sales-heavy/customer-heavy phrasing.
- Copy review matrix and visual QA by locale across P0 routes and mobile/desktop widths.
- `npm run lint`, `npm run build`, and terminology grep closure.

**Should have (differentiators):**
- Page-level locale fit notes documenting acceptable wraps and risky components.
- Small shared helper/component for localized title structures if more than one large heading needs arrays.
- Locale-aware Playwright smoke checks for language switching, German hero stability, and no horizontal overflow.
- Documented copy lint/grep bundle for banned user-facing terms.

**Defer (v2+):**
- New languages, locale-prefixed routing, SEO localization, backend language preference sync, email-template localization, regional pricing/currency, legal-document final translation, CMS/TMS, machine translation, visual-regression platform, and broad design-system/a11y rebuilds.

### Architecture Approach

Phase 17 should sit on top of the Phase 16 i18n foundation. Keep static locale resources, language switcher behavior, `stoa_language` localStorage persistence, root `<html lang>` synchronization, and namespace structure unchanged. Locale JSON remains the source of copy; `localeLayout.ts` supplies non-copy rendering hints; components use `useTranslation()` plus `getLocaleLayout()` only where locale text stresses the UI.

**Major components:**
1. `src/i18n/locales/{en,de,fr,it}/*.json` - product copy source, including optional structured keys such as `home.hero.titleLines`.
2. `src/i18n/localeLayout.ts` - typed layout-density and class hints with English fallback; no translated strings.
3. `src/components/home/HomeHero.tsx` - first integration point for `titleLines`, layout hints, and stable hero typography.
4. P0 components/pages - home sections, register/onboarding, chat, pricing/billing, parent, tutor, support, common errors/toasts.
5. `docs/language/*` - copy governance, glossary updates, QA matrix, visual QA record, and maintenance notes.
6. Playwright/tests or documented QA commands - locale switching, viewport checks, overflow checks, terminology checks.

### Critical Pitfalls

1. **Literal German hero translation** - avoid long sentence-like German headings in display type; use short local title lines and move detail into subtitle/body.
2. **Unsafe `titleLines` shape change** - keep `hero.title` required, normalize optional arrays defensively, and test/fallback across all locales.
3. **CSS fixes that hide copy problems** - shorten local copy first; then use wrapping, stable constraints, and scoped layout hints. Do not truncate essential labels or globally shrink typography.
4. **Data-driven English plan copy** - pricing/billing plan cards may render English/mock data outside locale files; map stable plan IDs to localized display copy while preserving numeric/business fields.
5. **Terminology audit blind spots** - split rendered-copy audit from internal identifiers and include `src/data` plus hardcoded component/page strings that appear in P0 UI.
6. **QA too shallow** - language switching alone is insufficient; track locale, route, viewport, state, terminology, and visual fit.

## Implications for Roadmap

Based on research, suggested Phase 17 implementation structure:

### Phase 1: Copy Governance and Scope Lock
**Rationale:** Copy rules must precede rewrites so locale divergence is intentional rather than ad hoc.
**Delivers:** `docs/language/locale-copy-rules.md`, DE/FR/IT rules, glossary/style-guide updates, banned terminology rules, P0 surface list.
**Addresses:** LCOPY-01 through LCOPY-05, TERM-17-02.
**Avoids:** Product-meaning drift, literal translation, scope creep into new languages or business features.

### Phase 2: Title and Layout Infrastructure
**Rationale:** The German hero problem requires component support before copy can be finalized.
**Delivers:** `src/i18n/localeLayout.ts`, optional `home.hero.titleLines` schema, safe title-line normalization, `HomeHero` rendering update, scoped typography/action classes.
**Uses:** i18next `returnObjects`, Tailwind utilities, `premium-theme.css`, existing `<html lang>`.
**Avoids:** Unsafe array casts, per-language JSX branching, layout metadata in translation JSON.

### Phase 3: Homepage and P0 Copy Rewrite
**Rationale:** Once structure exists, rewrite the visible P0 surfaces with natural local copy and stable UI fit.
**Delivers:** EN/DE/FR/IT copy for home, register/onboarding, chat, parent/report, tutor, pricing, billing, support, common/errors/toasts; localized pricing display text for plan cards where needed.
**Addresses:** P0COPY-01 through P0COPY-09, LAYOUT-01, TERM-17-01.
**Avoids:** English remnants, AI-heavy/sales-heavy terms, German/French/Italian overlong CTAs.

### Phase 4: Responsive Typography and Visual Fit Pass
**Rationale:** Rewritten copy must be tested in real components before closure.
**Delivers:** Targeted component/CSS fixes for hero, nav, buttons, badges, cards, pricing, chat controls, auth forms, and support sections; no broad design-system rewrite.
**Addresses:** LAYOUT-03 through LAYOUT-05.
**Avoids:** Truncation, `break-all`, fixed button heights, sibling card width shifts, global type shrinkage.

### Phase 5: QA Evidence and Handoff
**Rationale:** The milestone is only complete if natural copy and layout stability are verified.
**Delivers:** `docs/language/copy-review-matrix.md`, `docs/language/visual-qa-by-locale.md`, updated translation QA checklist, README notes, terminology grep output, `npm run lint`, `npm run build`, optional Playwright locale smoke spec.
**Addresses:** QA-COPY-01, QA-LOCALE-01, QA-LOCALE-02, DOCS-17-02, QA-17-01.
**Avoids:** Desktop-only QA, homepage-only QA, fallback/raw-key misses.

### Phase Ordering Rationale

- Governance first prevents copy rewrites from changing product semantics or creating a new translation style per page.
- Title/layout infrastructure comes before homepage copy because `titleLines` is a data shape and rendering change.
- P0 rewrites should happen before detailed CSS tuning so layout fixes respond to final copy, not temporary text.
- Visual QA and docs close last because they need the final route/content/layout state.
- Keep the phase P0-focused; P1/legacy pages should receive only shared/common cleanup unless visible risk is found.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** Pricing/billing plan cards need code inspection to decide whether localized display fields come from locale files, demo data mapping, or API-contract-shaped fallback data.
- **Phase 4:** Exact viewport and route availability should be confirmed before finalizing Playwright automation or screenshot evidence.
- **Phase 5:** Terminology grep needs calibration to avoid renaming internal identifiers while still catching rendered mock data and hardcoded strings.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Documentation and glossary/style-guide updates are well-defined from existing language docs.
- **Phase 2:** i18next optional arrays, TypeScript layout helpers, and scoped CSS/Tailwind classes are standard local code changes.
- **Phase 5 build/lint closure:** Standard npm and grep verification is already established.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing React/i18next/Tailwind/Playwright stack fits; research explicitly recommends no new dependencies. |
| Features | HIGH | P0 surfaces, deliverables, anti-features, and requirement categories are clear from PROJECT and Phase 16 language artifacts. |
| Architecture | HIGH | Integration points are verified against current i18n, `HomeHero`, theme CSS, and namespace structure. |
| Pitfalls | HIGH | Risks are grounded in current code paths, known German hero issue, i18next behavior, and existing mock/data rendering patterns. |

**Overall confidence:** HIGH

### Gaps to Address

- Native copy quality: final DE/FR/IT wording should be reviewed by fluent/native reviewers where possible.
- Legal-sensitive copy: privacy/terms and legal commitments should not be treated as final legal translations in Phase 17.
- Route/state coverage: exact P0 state paths for parent reports, tutor request detail, billing result states, and support ticket states should be confirmed during planning.
- Type safety depth: full i18next `CustomTypeOptions` resource typing is valuable but may be deferred if a simpler locale parity check covers Phase 17 risk.
- Visual automation depth: lightweight Playwright smoke checks are enough now; screenshot diff tooling can wait.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` - Phase 17 goal, scope, constraints, preferred hero copy direction, out-of-scope boundaries.
- `.planning/research/STACK.md` - stack fit, no-new-dependency guidance, implementation additions, QA direction.
- `.planning/research/FEATURES.md` - P0 surface inventory, table stakes, deliverables, anti-features, requirement categories.
- `.planning/research/ARCHITECTURE.md` - i18n foundation, `HomeHero` integration, `localeLayout.ts`, data flow, build order.
- `.planning/research/PITFALLS.md` - critical/moderate pitfalls, prevention strategies, phase-specific warnings.

### Supporting implementation context
- `docs/language/copy-style-guide.md`, `docs/language/glossary.md`, `docs/language/terminology-replacement.md`, `docs/language/translation-qa-checklist.md` - Phase 16 language system.
- `src/i18n/index.ts`, `src/i18n/languages.ts`, `src/i18n/namespaces.ts`, `src/i18n/locales/{en,de,fr,it}/*.json` - current localization architecture.
- `src/components/home/HomeHero.tsx`, `src/components/home/*`, `src/styles/premium-theme.css` - high-risk typography and homepage rendering surfaces.
- `src/pages/pricing/PricingPage.tsx`, `src/components/billing/PlanCard.tsx`, `src/data/phase11MockData.ts` - data-driven commercial copy risk.

---
*Research completed: 2026-05-25*
*Ready for roadmap: yes*
