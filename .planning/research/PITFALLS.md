# Domain Pitfalls: Phase 17 Locale-Specific Copy and Multilingual Layout

**Domain:** Locale-specific product copy, responsive typography, and multilingual UI refinement for an existing React/i18next app  
**Project:** STOA Frontend  
**Researched:** 2026-05-25  
**Overall confidence:** HIGH for i18next/layout mechanics and current-code risks; MEDIUM for language-quality recommendations because final wording still needs native review.

## Critical Pitfalls

### Pitfall 1: Treating German as a Literal English Hero Translation

**What goes wrong:** German hero and section titles become long sentence-like compounds in large serif display typography. The current German hero title, `Lernunterstützung genau dann, wenn Schüler sie brauchen.`, is the clearest example: it is semantically close to English but too long for the homepage's `text-5xl sm:text-6xl lg:text-7xl` title treatment.

**Why it happens:** Teams preserve key-by-key equivalence instead of preserving intent, rhythm, and UI fit. German copy often compresses meaning into longer noun phrases or compounds, which is poor material for oversized hero lines.

**Consequences:** The premium first impression breaks first in German: awkward wraps, cramped line-height, uneven STOA/title balance, or accidental downscaling that weakens all locales.

**Warning signs:**
- German display headings read as full translated sentences.
- Words like `Lernunterstützung`, `Lehrpersonen-Unterstützung`, or `Hausaufgabenunterstützung` appear in hero-scale type.
- The German page only passes QA after shrinking the global hero font.
- English and German share the same title structure even when German needs stacked fragments.

**Prevention strategy:**
- Use locale-specific headline structures, not literal title parity. For Phase 17, use the preferred German direction `Lernen. Fragen. Verstehen.` and move detail into subtitle/body copy.
- Add support for optional stacked title lines where the locale needs it.
- Keep German hero lines short enough to scan at mobile and desktop sizes before adjusting CSS.
- Review German compounds in headings, CTAs, nav labels, pricing headers, and badges separately from body copy.

**Roadmap phase to address:** Phase 17 copy rewrite and hero typography refinement.

### Pitfall 2: Adding `titleLines` Without Safe Fallbacks

**What goes wrong:** A new `hero.titleLines` array fixes German but breaks other locales or fallback paths. With i18next, object/array reads require `returnObjects: true`; missing keys or unexpected scalar values can return a string/key instead of an array, and unsafe casts like `as string[]` can hide runtime failures.

**Why it happens:** Current `HomeHero` renders a single `home:hero.title` string. Moving to arrays is a shape change, not just copy editing. The app already uses `returnObjects` for bullets and arrays, but without validation wrappers.

**Consequences:** Homepage can render raw missing-key text, duplicate fallback titles, fail at `.map`, or silently show English where the locale-specific layout was supposed to appear.

**Warning signs:**
- Code casts `t('hero.titleLines', { returnObjects: true }) as string[]` without `Array.isArray`.
- Only German receives `titleLines`; EN/FR/IT rely on an implicit missing-key behavior.
- `hero.title` and `hero.titleLines` diverge semantically.
- Tests check visible text in one locale only.

**Prevention strategy:**
- Keep `hero.title` as the canonical single-line fallback for every locale.
- Add `hero.titleLines` only as an optional layout hint and normalize it in component code: if the resolved value is not a non-empty array, render `[t('hero.title')]`.
- Validate the locale shape with a lightweight script or TypeScript resource typing before build closure.
- Document the rule in the copy style guide: `titleLines` is for layout, not a separate message.

**Roadmap phase to address:** Phase 17 implementation slice for homepage hero title structure.

### Pitfall 3: Responsive Typography Fixes That Hide Copy Problems

**What goes wrong:** Long multilingual text is "fixed" by globally reducing font sizes, clipping, truncating, or applying aggressive `word-break: break-all`. This preserves the build but damages the brand and readability.

**Why it happens:** Visual overflow is treated as a CSS-only issue. MDN documents that unbreakable text can overflow containers by default and that `overflow-wrap` can prevent overflow, but language-specific copy still needs editorial control. W3C language guidance also matters because `lang` helps user agents make language-sensitive text decisions.

**Consequences:** German looks chopped, French/Italian CTAs wrap badly, buttons grow unpredictably, cards shift height, and hero copy stops feeling premium.

**Warning signs:**
- Button labels are truncated with ellipses.
- `break-all` appears on headings or CTAs.
- CTA button height is fixed while labels can wrap to two lines.
- German passes desktop but overflows at 320-390px widths.
- French apostrophes and Italian prepositions create awkward line breaks in compact buttons.

**Prevention strategy:**
- Prefer shorter locale copy first, then layout hints.
- Use stable responsive constraints: `min-w-0`, sensible `max-w`, `leading-tight` only where tested, and wrapping-friendly button/card containers.
- Use `overflow-wrap: break-word` or Tailwind `break-words` for defensive containment, not as the primary design.
- Keep `document.documentElement.lang` updates in QA because language-sensitive text handling depends on correct language metadata.
- Test at least 320px, 390px, 768px, 1024px, and 1440px for EN/DE/FR/IT on homepage and pricing.

**Roadmap phase to address:** Phase 17 responsive typography and visual QA slice.

### Pitfall 4: Leaving Commercial Plan Data Outside the Locale System

**What goes wrong:** Pricing page chrome localizes, but plan cards still show English plan names, audiences, CTAs, and feature lists from mock/API billing data. Current `PlanCard` consumes `BillingPlan` strings from `mockBillingPlans`, which still include terms like `Limited AI questions`, `AI learning chat`, and `Human teacher help quota`.

**Why it happens:** The page body uses `pricing.json`, while the repeated plan cards are data-driven from `useBillingPlansQuery`. Data contracts are mistaken for presentation-ready copy.

**Consequences:** Phase 17 can appear to pass locale-file review while users still see English, AI-heavy, or sales-heavy wording in the most conversion-sensitive pricing cards.

**Warning signs:**
- `/pricing` heading changes language but plan names remain `Free Trial`, `Student Plan`, `Family Plan`, `Tutor-supported Plan`.
- Pricing-card CTAs remain `Select student` or `Start free trial` in DE/FR/IT.
- Grep finds banned terms in `src/data`, but the audit only scans `src/pages`, `src/components`, and `src/i18n`.
- Backend/demo fallback data is rendered directly as marketing copy.

**Prevention strategy:**
- For Phase 17, map stable plan IDs to localized display copy in the frontend, or add localized display fields to the demo API contract without changing payment functionality.
- Keep numeric/business fields (`id`, `priceMonthly`, `currency`, `recommended`) data-driven; keep user-facing plan names, audiences, features, and CTAs locale-driven.
- Expand terminology grep to include rendered data sources used by P0/P1 UI.

**Roadmap phase to address:** Phase 17 pricing and billing copy refinement.

### Pitfall 5: Translation-Key Type Safety Is Assumed but Not Implemented

**What goes wrong:** Missing or misspelled keys compile, then show fallback text, raw keys, or wrong namespace copy at runtime. Current setup defines typed language and namespace constants, but there is no `i18next.d.ts`/`CustomTypeOptions` augmentation for resource-key typing.

**Why it happens:** TypeScript is present, but `t('some.key')` remains stringly typed unless i18next resource types are wired into `CustomTypeOptions`. i18next's current TypeScript docs recommend resource typing and note newer selector support for safer key access.

**Consequences:** Phase 17's copy-heavy changes create many small key edits, exactly where a missing key can slip through. English fallback can mask the issue in non-English QA unless raw key detection is explicit.

**Warning signs:**
- New keys are added to `en` but not to `de`, `fr`, and `it`.
- `t()` calls use ad hoc namespace prefixes rather than consistent `useTranslation(namespace)`.
- `returnObjects` calls are cast instead of typed or validated.
- Review relies on `npm run build` only.

**Prevention strategy:**
- Add or schedule a typed i18next resource declaration for the locale resources.
- Add a locale-shape parity check for every namespace under `src/i18n/locales/{en,de,fr,it}`.
- During Phase 17, require QA to search for raw key patterns like `home:`, `.titleLines`, or visible dotted keys.
- Keep fallbackLng set to English, but treat fallback rendering on P0 pages as a QA failure, not success.

**Roadmap phase to address:** Phase 17 build/QA closure; deeper selector migration can be deferred if time-boxed.

## Moderate Pitfalls

### Pitfall 6: French and Italian CTAs Are Reviewed as Sentences, Not UI Controls

**What goes wrong:** French and Italian CTAs read naturally in isolation but become too long inside rounded buttons, nav items, pricing badges, or mobile stacked controls.

**Warning signs:**
- FR/IT CTAs exceed one line in desktop nav or card footers.
- A CTA includes both action and explanation, such as "discover how..." plus extra context.
- Button width changes between locales enough to shift adjacent controls.

**Prevention strategy:**
- Write CTAs as commands, not explanations.
- Put nuance in subtitles, helper copy, or card body text.
- QA every primary and secondary CTA in EN/DE/FR/IT on homepage, pricing, register/onboarding, chat, support, and billing.

**Roadmap phase to address:** Phase 17 P0 copy refinement and CTA layout QA.

### Pitfall 7: Visible Terminology Audits Produce False Positives and False Negatives

**What goes wrong:** Grep catches internal identifiers such as `AIResponseFeedback` and `aiMessagesUsed`, but misses user-visible strings embedded in mock data, hardcoded page arrays, alt text, or old landing pages. Conversely, teams may waste time renaming safe internal API fields.

**Warning signs:**
- Audit output includes TypeScript type names and analytics event names mixed with actual UI strings.
- Hardcoded copy remains in `src/pages/landing`, `src/pages/support`, `src/pages/onboarding`, or mock data.
- `AI` is removed from locale files, but rendered plan features still show AI-heavy wording.

**Prevention strategy:**
- Split terminology audit into two tracks: user-visible rendered strings versus internal technical identifiers.
- Include `src/data` and route-specific hardcoded arrays when those strings render to users.
- Keep internal identifiers stable unless they leak into UI; renaming model/API fields is outside Phase 17 unless required by visible copy.

**Roadmap phase to address:** Phase 17 terminology cleanup and QA closure.

### Pitfall 8: QA Matrix Covers Languages but Not Surfaces, States, and Widths

**What goes wrong:** QA checks the homepage language switcher and one desktop page per locale, while missing mobile nav, pricing tables, chat empty/loading/error states, teacher request cards, billing locked states, support forms, and onboarding steps.

**Warning signs:**
- Checklist says "DE/FR/IT checked" without route, viewport, and state evidence.
- E2E tests still assert only English text, for example `/pricing` heading matching `Pricing`.
- No screenshot evidence exists for German hero, pricing cards, and CTA buttons at mobile widths.

**Prevention strategy:**
- Use a matrix with columns for locale, route, viewport, state, and result.
- Minimum Phase 17 matrix: `/`, `/pricing`, `/login`, `/register`, `/chat`, `/parent`, `/tutor`, `/billing`, `/support`; EN/DE/FR/IT; 390px and desktop.
- Add targeted Playwright checks for German hero line stability, pricing plan text localization, language persistence, and absence of banned visible terms.

**Roadmap phase to address:** Phase 17 visual QA, documentation, and build verification.

### Pitfall 9: Locale-Specific Copy Drifts From Shared Product Meaning

**What goes wrong:** Copy becomes natural in each language but no longer says the same product promise. For example, French may become more teacher-led, Italian warmer but less precise, or German too terse to explain the parent/teacher model.

**Warning signs:**
- Locale copy cannot be mapped back to the approved glossary concepts.
- Teacher support sounds like a replacement teacher, fallback machinery, or live tutoring product.
- Parent copy becomes fear-based or overly surveillance-oriented.

**Prevention strategy:**
- Review every rewritten cluster against the Phase 16 glossary: Learning Assistant first, professional teacher support when needed, parents stay informed.
- Allow sentence structure to vary, but keep product roles and boundaries stable.
- Use a four-language copy review table for hero, CTAs, chat, parent, tutor, pricing, billing, and support.

**Roadmap phase to address:** Phase 17 locale-specific copywriting rules and P0 copy review.

### Pitfall 10: Hardcoded English Remains in "Small" UI Details

**What goes wrong:** Hero and pricing copy are fixed, but badges, image overlays, alt text, recommended badges, checkout result links, upload aria labels, error pages, and support/onboarding arrays still show English.

**Warning signs:**
- Components import `useTranslation` but nearby child components still return literal English.
- Shared components such as `RecommendedPlanBadge` return fixed labels.
- Image overlay labels are not locale-backed.

**Prevention strategy:**
- Audit user-visible JSX strings in `src/pages`, `src/components`, and rendered `src/data`.
- Treat alt text and aria labels as user-facing copy for Phase 17 when the component is in a P0 surface.
- Prioritize visible P0/P1 surfaces over archived/duplicate routes.

**Roadmap phase to address:** Phase 17 P0 surface cleanup; non-core legacy routes can become documented follow-up.

## Minor Pitfalls

### Pitfall 11: Overusing Apostrophes, Slashes, and Parenthetical Explanations

**What goes wrong:** French and Italian copy becomes typographically noisy in compact UI because apostrophes, explanatory commas, and parentheticals pile up in buttons, badges, and table cells.

**Prevention strategy:** Keep compact UI labels short and literal; reserve elegant phrasing for body copy and cards.

**Roadmap phase to address:** Phase 17 copy polish.

### Pitfall 12: Changing Business Semantics While Editing Copy

**What goes wrong:** Copy refinement accidentally changes product functionality: new plan promises, new teacher availability claims, new backend language preference behavior, or new support obligations.

**Prevention strategy:** Treat Phase 17 as copy/layout only. Do not add new routes, plans, backend fields, legal claims, CMS/TMS, automatic translation, regional pricing, or SEO localization.

**Roadmap phase to address:** Phase 17 scope control and roadmap review.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
| --- | --- | --- |
| Phase 17 copy rules | Literal translation persists under "meaning parity" | Define meaning parity as concept parity, not sentence parity. |
| Phase 17 German hero | Long German title forces global font-size reduction | Use short German title lines and move detail into subtitle/body. |
| Phase 17 title structure | `titleLines` breaks locales without arrays | Normalize optional arrays with fallback to `hero.title`. |
| Phase 17 homepage sections | Trust/demo/backend copy remains developer-facing | Rewrite or defer developer-readiness claims outside public homepage copy. |
| Phase 17 pricing | Plan cards remain English/API-driven | Localize plan display fields by plan ID while preserving business data. |
| Phase 17 typography | Overflow is solved with truncation | Shorten copy first, then use wrapping-friendly CSS. |
| Phase 17 terminology audit | Internal identifiers are renamed while visible mock data is missed | Separate rendered-copy audit from internal identifier audit. |
| Phase 17 QA | Matrix checks locale switching but not visual stability | Record locale + route + viewport + state for P0 surfaces. |
| Phase 17 scope | Team adds localization infrastructure | Keep local JSON/i18next; defer CMS, TMS, SEO routing, backend preference sync, legal translation. |

## Sources

- Project context: `.planning/PROJECT.md`
- Phase 16 language docs: `docs/language/copy-style-guide.md`, `docs/language/glossary.md`, `docs/language/terminology-replacement.md`, `docs/language/translation-qa-checklist.md`
- Current implementation: `src/i18n/index.ts`, `src/i18n/languages.ts`, `src/i18n/locales/{en,de,fr,it}/home.json`, `src/i18n/locales/{en,de,fr,it}/pricing.json`, `src/components/home/*`, `src/pages/pricing/PricingPage.tsx`, `src/components/billing/PlanCard.tsx`, `src/data/phase11MockData.ts`
- Context7 i18next docs: `/i18next/i18next`, topics `CustomTypeOptions`, `returnObjects`, `fallbackLng`, `enableSelector`
- Context7 react-i18next docs: `/i18next/react-i18next`, topics `useTranslation`, namespaces, `Trans`, TypeScript setup
- i18next TypeScript docs: https://www.i18next.com/overview/typescript
- i18next fallback docs: https://www.i18next.com/principles/fallback
- react-i18next multiple namespace docs: https://react.i18next.com/guides/multiple-translation-files
- MDN `overflow-wrap`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-wrap
- MDN wrapping and breaking text: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Text/Wrapping_breaking_text
- W3C language attributes guidance: https://www.w3.org/International/geo/html-tech/tech-lang.html
