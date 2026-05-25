# Phase 17 Research: Stack

**Milestone:** Locale-specific copywriting, responsive typography, and multilingual UI refinement  
**Researched:** 2026-05-25  
**Confidence:** HIGH for codebase fit, MEDIUM for exact implementation scope until Phase 17 specs choose the final P0 page list.

## Existing Stack Fit

The current stack is enough for Phase 17. Do not add a new i18n framework, typography library, CMS, translation service, visual-regression SaaS, or runtime layout engine.

| Area | Existing Stack | Fit for Phase 17 |
| --- | --- | --- |
| UI | React 19 + TypeScript + Vite | Enough for rendering locale-specific copy and small component changes. |
| Localization | `i18next` + `react-i18next` with EN/DE/FR/IT JSON resources | Already supports the current namespace model and structured JSON arrays via `returnObjects`, which can be reused for title lines and comparison tables. |
| Styling | TailwindCSS 4 utilities + `src/styles/premium-theme.css` | Enough for responsive typography, `text-wrap: balance`, `break-words`, `min-w-0`, overflow handling, and locale-specific class hints. |
| QA | Playwright + existing E2E setup | Enough for locale and viewport smoke/visual checks. Add specs/helpers, not dependencies. |
| Docs | `docs/language/*` | Already has glossary, style guide, terminology audit command, and translation QA checklist. Phase 17 should extend these docs instead of adding tooling. |

## Recommended Additions and Changes

### 1. Extend Translation Data Shape

Prefer additive JSON keys over replacing the entire i18n model.

Recommended shape for homepage hero:

```json
{
  "hero": {
    "title": "Learn with clarity.",
    "titleLines": ["Lernen.", "Fragen.", "Verstehen."],
    "titleVariant": "stacked",
    "subtitle": "..."
  }
}
```

Implementation guidance:
- Keep `hero.title` for simple locales and backwards compatibility.
- Add `hero.titleLines` where line breaks are intentional, especially German.
- Add narrow layout hints only when they map to concrete CSS behavior, for example `titleVariant: "stacked" | "compact" | "standard"`.
- Do not encode Tailwind class strings directly in translation JSON; map stable hint values to classes in TypeScript.

### 2. Add Small Typed Helpers

Useful helper modules:

| Module | Purpose |
| --- | --- |
| `src/i18n/copyHelpers.ts` | Normalize `titleLines` vs `title`, return arrays safely, and avoid repeated `as string[]` casts in components. |
| `src/i18n/layoutHints.ts` | Map locale or translation hint values to known class names, such as compact hero type or stacked title rendering. |
| `src/i18n/terminology.ts` or test-local constant | Centralize banned user-facing terms for QA grep/test use if docs-only commands are not enough. |

Keep these helpers local and boring. They should not become a content management abstraction.

### 3. Update Home Components In Place

Primary integration point: `src/components/home/HomeHero.tsx`.

Recommended changes:
- Render `titleLines` as individual block spans when present.
- Preserve the visible `STOA` brand line.
- Use stable containers: `min-w-0`, `max-w-*`, `break-words`, and explicit responsive text sizes.
- Add locale-aware or variant-aware classes only through a helper, not inline language branching spread across components.

Secondary integration points:
- `HomeLearningFlow.tsx`, `HomeParentVisibility.tsx`, `HomeTeacherFallback.tsx`, `HomeCTASection.tsx`, `HomeMagazineImage.tsx`, and `HomeTrustSection.tsx` for copy fit and any remaining hardcoded English.
- `src/pages/onboarding/OnboardingPage.tsx` still contains hardcoded English pilot copy and likely belongs in the Phase 17 P0/P1 cleanup if onboarding is in scope.
- Pricing, billing, support, chat, parent, and tutor pages already use namespaces but need copy review and long-text layout checks.

### 4. CSS/Tailwind Adjustments, No Library

Use existing CSS and Tailwind utilities:
- Keep `letter-spacing: 0` for editorial headings.
- Use `text-wrap: balance` for headings and consider `text-wrap: pretty` for body copy only if browser support is acceptable for non-critical enhancement.
- Use `break-words`, `hyphens-auto`, `min-w-0`, `max-w-full`, `overflow-x-auto`, and responsive grid changes where long German/French/Italian text stresses cards and nav.
- Prefer slightly smaller responsive hero type for long locales over truncation.
- Keep buttons flexible: avoid fixed widths for translated labels unless paired with wrapping or responsive layout.

### 5. Playwright QA Changes

No new test dependency is needed.

Recommended changes:
- Add a Phase 17 locale QA spec that iterates `en`, `de`, `fr`, `it`, switches language through `LanguageSwitcher`, and checks homepage, register/onboarding, chat, parent, tutor, pricing, billing, and support smoke surfaces.
- Add mobile/tablet viewport checks inside the spec or add Playwright projects for mobile Chrome and tablet widths. This is a config/test change, not a package change.
- Add assertions for no obvious overflow on key containers: `document.documentElement.scrollWidth <= window.innerWidth + tolerance` on mobile, and targeted checks for hero title/buttons/nav/pricing cards.
- Keep terminology grep in docs and optionally mirror it in a Playwright or npm script only if Phase 17 wants CI enforcement.

## No-New-Dependency Guidance

Do not add:

- `i18next-browser-languagedetector`: Phase 16 already has explicit `stoa_language` persistence and browser-language fallback.
- ICU/FormatJS/Fluent: Phase 17 copy needs rewritten strings and simple structured arrays, not complex plural/message formatting.
- A headless CMS, translation management system, remote i18next backend, or machine translation pipeline.
- Hyphenation/polyfill packages: CSS `hyphens-auto`, wrapping, and shorter locale-specific copy are the right first move.
- Typography/font libraries: the issue is copy length and layout rules, not font loading.
- A new UI/component library or animation library.
- Percy/Chromatic/Applitools: useful later, but current Playwright smoke/viewport checks are sufficient for this milestone.

## Integration Points

| File/Area | Recommended Work |
| --- | --- |
| `src/i18n/locales/*/home.json` | Rewrite hero, CTA, flow, parent, teacher, and trust copy; add `titleLines`/layout hints where needed. |
| `src/i18n/locales/*/{auth,chat,parent,tutor,pricing,billing,support,common}.json` | Refine P0 copy and terminology; keep meaning aligned but not literal. |
| `src/components/home/HomeHero.tsx` | Support stacked title lines and class variants. |
| `src/components/home/*` | Remove hardcoded English visual card copy and verify long-text wrapping. |
| `src/layouts/MarketingLayout.tsx` and `src/layouts/AppLayout.tsx` | Check nav/button wrapping with DE/FR/IT labels. Existing flex-wrap/truncate patterns mostly fit. |
| `tests/e2e/*` | Add locale/viewport QA; existing tests are English-biased and some selectors will need locale-agnostic structure or test IDs if translated copy replaces labels. |
| `docs/language/*` | Extend glossary/style guide/QA matrix for Phase 17 copy rules and visual QA results. |

## Risks

| Risk | Mitigation |
| --- | --- |
| German hero/title copy breaks large serif layout | Use `titleLines`, shorter locale copy, and mapped `titleVariant` classes. |
| Translation JSON becomes a design config dumping ground | Allow only stable semantic hints; keep CSS class decisions in TypeScript/CSS. |
| Existing E2E selectors break when English labels change | Prefer role + stable route/state checks, targeted test IDs for controls, or language-specific expected labels in locale QA tests. |
| Hardcoded English remains outside i18n namespaces | Run the terminology grep plus targeted source review for P0 components/pages. |
| Layout QA becomes subjective and slow | Automate only smoke overflow checks and core-page screenshots; keep nuanced copy review in docs/manual QA. |

## Bottom Line

Phase 17 needs no dependency additions. Use the existing React/i18next/Tailwind/Playwright stack, add small typed helpers for structured localized copy, extend locale JSON with `titleLines` and semantic layout hints, tighten CSS utilities for long text, and add locale-aware Playwright checks.
