# Phase 17 Research: Architecture

**Project:** STOA Frontend
**Phase:** v1.16 Phase 17 - Locale-Specific Copywriting, Responsive Typography, and Multilingual UI Refinement
**Researched:** 2026-05-25
**Overall confidence:** HIGH

## Recommendation

Phase 17 should integrate as a narrow copy and responsive-layout refinement layer on top of the Phase 16 i18n foundation. Keep i18next, the existing `src/i18n/locales/{en,de,fr,it}` namespace structure, `LanguageSwitcher`, `stoa_language` persistence, and root `<html lang>` synchronization unchanged. Do not introduce locale routing, a CMS, automatic translation, backend preference persistence, or a new design system.

The architectural change worth adding is a small typed locale layout module, `src/i18n/localeLayout.ts`, that stores non-copy layout hints for supported languages and high-risk components. It should not contain translated strings. Locale files remain the source of text; `localeLayout.ts` only describes rendering density, typography variant, and wrapping behavior that components can apply consistently.

The highest-priority component integration is `src/components/home/HomeHero.tsx`. The current implementation renders `STOA` plus a single `home:hero.title` string inside large serif display typography. That works poorly for the known German title. Phase 17 should support `home.hero.titleLines` as an optional array in locale files, with `home.hero.title` preserved as the fallback/plain title. This lets German use explicit stacked title copy such as `["Lernen.", "Fragen.", "Verstehen."]` while English, French, and Italian can use one concise line where appropriate.

## Existing Architecture

### I18n Foundation

Phase 16 already established:

- `src/main.tsx` imports `@/i18n` before rendering React.
- `src/i18n/index.ts` initializes `i18next` and `react-i18next`.
- Resources are loaded statically from `src/i18n/locales/{en,de,fr,it}`.
- `src/i18n/languages.ts` defines `en`, `de`, `fr`, and `it`, plus `LANGUAGE_STORAGE_KEY = 'stoa_language'`.
- Language initialization reads `localStorage`, falls back to browser language, then English.
- `i18n.on('languageChanged')` updates `<html lang>` and persists the selected language.
- `src/i18n/namespaces.ts` defines `common`, `home`, `auth`, `chat`, `parent`, `tutor`, `pricing`, `billing`, `support`, `admin`, and `errors`.

This is enough infrastructure for Phase 17. The work should refine the data and rendering, not replace the localization system.

### Current Home Hero Rendering

`HomeHero` currently:

- reads copy via `useTranslation(['home', 'common'])`;
- reads bullets with `returnObjects`;
- renders `STOA` as one block and `home:hero.title` as one accented block;
- uses fixed Tailwind breakpoint sizes: `text-5xl sm:text-6xl lg:text-7xl`;
- uses `break-words` and `editorial-heading editorial-title-shell`.

The weak point is that `hero.title` is treated as a single display line. German, French, and Italian sometimes need different sentence structures, not literal copies forced into one display treatment.

### Current Typography Hooks

`src/styles/premium-theme.css` already provides:

- `.editorial-heading` with serif font, `letter-spacing: 0`, and `text-wrap: balance`;
- `.editorial-title-shell` for the decorative rule;
- `.editorial-accent` for highlighted title text;
- `html[lang]` is already synchronized by i18n, making language-scoped CSS possible without adding global state.

Phase 17 should extend these hooks narrowly. It should not replace the current Tailwind/theme structure.

## Recommended Integration Points

### Locale Files

Keep the existing namespace structure:

```text
src/i18n/locales/
  en/home.json
  de/home.json
  fr/home.json
  it/home.json
  ...same namespaces as Phase 16
```

Add optional structured copy only where the UI genuinely needs structure. For `home.hero`, use this shape:

```json
{
  "hero": {
    "eyebrow": "Learning Assistant first, teacher when needed",
    "title": "Learn with clarity.",
    "titleLines": ["Learn with clarity."],
    "subtitle": "Students ask questions, receive clear explanations, and can request a real teacher when they need more help."
  }
}
```

Recommended rules:

- `title` remains required as the plain text/fallback title.
- `titleLines` is optional and only used by components that need explicit line control.
- `titleLines` contains complete human-written lines, not fragments assembled by code.
- Do not create `homeHeroTitleLine1`, `homeHeroTitleLine2`, etc.; arrays are easier to render and review.
- Do not put layout metadata such as `compact`, `fontSize`, or `className` in JSON locale files.
- Keep every namespace present for all four languages when adding keys.

For the preferred Phase 17 hero direction:

```json
// en/home.json
"title": "Learn with clarity.",
"titleLines": ["Learn with clarity."]

// de/home.json
"title": "Lernen. Fragen. Verstehen.",
"titleLines": ["Lernen.", "Fragen.", "Verstehen."]

// fr/home.json
"title": "Comprendre avec confiance.",
"titleLines": ["Comprendre avec confiance."]

// it/home.json
"title": "Studiare con piu chiarezza.",
"titleLines": ["Studiare con piu chiarezza."]
```

Use the correct accents in the actual Italian copy if the product copy review requires them; the example above is ASCII only for this research note.

### `HomeHero` Title Rendering

Modify `HomeHero` to resolve title lines safely:

```tsx
const title = t('home:hero.title')
const rawTitleLines = t('home:hero.titleLines', {
  returnObjects: true,
  defaultValue: [],
})
const titleLines = Array.isArray(rawTitleLines) && rawTitleLines.every((line) => typeof line === 'string')
  ? rawTitleLines
  : [title]
```

Render each line as a block inside the accented title area:

```tsx
<h1 className={cn('editorial-heading editorial-title-shell break-words text-5xl font-semibold leading-[0.95] text-foreground sm:text-6xl lg:text-7xl', layout.homeHero.titleClassName)}>
  <span className="block">STOA</span>
  <span className="editorial-accent block" aria-label={title}>
    {titleLines.map((line, index) => (
      <span key={`${line}-${index}`} className={cn('block', layout.homeHero.titleLineClassName)}>
        {line}
      </span>
    ))}
  </span>
</h1>
```

Implementation notes:

- Use the existing `cn` helper from `src/lib/utils.ts` if extra conditional classes are needed.
- Keep `home:hero.title` as the accessible plain title and fallback.
- Do not hardcode `if (language === 'de')` inside `HomeHero`.
- Do not split a sentence in JSX; use `titleLines` for copy-approved line breaks.
- Do not move all home sections into a generic translation renderer. That would be a broad refactor with little benefit.

### `src/i18n/localeLayout.ts`

Add a small typed layout module for rendering hints. This file should depend only on `SupportedLanguage` and should export a helper that falls back to English.

Recommended shape:

```ts
import { isSupportedLanguage, type SupportedLanguage } from '@/i18n/languages'

type CopyDensity = 'standard' | 'compact' | 'long'
type HeroTitleVariant = 'singleLine' | 'stacked' | 'compactStacked'

export type LocaleLayout = {
  copyDensity: CopyDensity
  homeHero: {
    titleVariant: HeroTitleVariant
    titleClassName: string
    titleLineClassName: string
    subtitleClassName: string
    ctaClassName: string
  }
  navigation: {
    labelClassName: string
  }
  cards: {
    titleClassName: string
    bodyClassName: string
  }
}

export const localeLayout: Record<SupportedLanguage, LocaleLayout> = {
  en: {
    copyDensity: 'standard',
    homeHero: {
      titleVariant: 'singleLine',
      titleClassName: '',
      titleLineClassName: '',
      subtitleClassName: '',
      ctaClassName: '',
    },
    navigation: { labelClassName: '' },
    cards: { titleClassName: '', bodyClassName: '' },
  },
  de: {
    copyDensity: 'long',
    homeHero: {
      titleVariant: 'compactStacked',
      titleClassName: 'max-w-2xl lg:text-6xl',
      titleLineClassName: 'leading-[0.98]',
      subtitleClassName: 'max-w-xl',
      ctaClassName: 'whitespace-normal text-center',
    },
    navigation: { labelClassName: 'max-w-36 whitespace-normal leading-tight' },
    cards: { titleClassName: 'leading-snug', bodyClassName: 'leading-7' },
  },
  fr: {
    copyDensity: 'long',
    homeHero: {
      titleVariant: 'singleLine',
      titleClassName: 'max-w-3xl',
      titleLineClassName: '',
      subtitleClassName: 'max-w-2xl',
      ctaClassName: 'whitespace-normal text-center',
    },
    navigation: { labelClassName: 'whitespace-normal leading-tight' },
    cards: { titleClassName: 'leading-snug', bodyClassName: 'leading-7' },
  },
  it: {
    copyDensity: 'standard',
    homeHero: {
      titleVariant: 'singleLine',
      titleClassName: 'max-w-3xl',
      titleLineClassName: '',
      subtitleClassName: 'max-w-2xl',
      ctaClassName: 'whitespace-normal text-center',
    },
    navigation: { labelClassName: 'whitespace-normal leading-tight' },
    cards: { titleClassName: 'leading-snug', bodyClassName: 'leading-7' },
  },
}

export function getLocaleLayout(language: string | null | undefined): LocaleLayout {
  return localeLayout[isSupportedLanguage(language) ? language : 'en']
}
```

Use this module only where locale-specific layout is actually needed:

- `HomeHero` title/subtitle/CTA area.
- Marketing navigation if labels crowd.
- Pricing cards if long plan text breaks card rhythm.
- Auth/onboarding form buttons if translated actions become too long.

Do not import it into every component by default. Broad application would create unnecessary coupling and make routine copy changes feel like layout work.

### Component-Level Locale Variants

Use component-level variants for layout, not for copy. The preferred pattern is:

```tsx
const { t, i18n } = useTranslation(['home', 'common'])
const layout = getLocaleLayout(i18n.resolvedLanguage ?? i18n.language)
```

Then apply scoped class hooks:

```tsx
<section data-locale-copy-density={layout.copyDensity}>
  ...
</section>
```

Recommended rules:

- Centralize layout decisions in `localeLayout.ts`.
- Keep translated text in JSON files.
- Prefer `titleLines` and array/list rendering for intentional copy structure.
- Prefer stable CSS/Tailwind classes over runtime text measurement.
- Avoid truncating user-facing instructions. Use wrapping and stable dimensions instead.
- Avoid per-language branching inside JSX except through typed layout data.

### CSS and Typography Hooks

Extend `src/styles/premium-theme.css` rather than adding a new global stylesheet. Keep hooks scoped and named around the copy/layout problem:

```css
.locale-display-title {
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.locale-display-title-line {
  display: block;
}

html[lang="de"] .locale-display-title {
  line-height: 0.98;
}

html[lang="fr"] .locale-action,
html[lang="de"] .locale-action,
html[lang="it"] .locale-action {
  white-space: normal;
  min-height: 3rem;
}
```

Typography constraints:

- Keep `letter-spacing: 0`; do not use negative tracking to force long copy into a box.
- Do not use viewport-width font scaling. Continue using explicit breakpoint classes or scoped classes.
- Prefer shorter local copy before shrinking typography.
- Keep hero title dimensions stable across language switching so the page does not jump dramatically.
- Buttons should wrap or grow vertically before truncating important action text.
- Cards should have stable grid behavior; long translated text should not change sibling card widths.

### Documentation Integration

Update existing docs rather than adding a parallel copy system:

- `docs/language/copy-style-guide.md`: add Phase 17 locale-specific voice rules.
- `docs/language/glossary.md`: add refined Phase 17 terms if product copy changes approved wording.
- `docs/language/translation-qa-checklist.md`: add visual QA matrix by locale and viewport.
- `docs/language/terminology-replacement.md`: keep banned terms audit current.
- `README.md`: briefly document language switching, local copy rules, and verification commands if the phase plan includes README closure.

The architecture research output itself should not become the operational checklist; keep the active checklist in `docs/language/translation-qa-checklist.md`.

## New vs Modified Files

### New Files

| File | Purpose | Notes |
| --- | --- | --- |
| `src/i18n/localeLayout.ts` | Typed locale-specific layout hints | No translated strings; no dependencies beyond `languages.ts`. |

### Modified Files

| File | Change | Scope |
| --- | --- | --- |
| `src/i18n/locales/en/home.json` | Rewrite hero and P0 homepage copy; add optional `hero.titleLines` | Copy only. |
| `src/i18n/locales/de/home.json` | Rewrite German hero with short/stacked title; refine long section copy | Copy only. |
| `src/i18n/locales/fr/home.json` | Rewrite French hero and section copy for natural local phrasing | Copy only. |
| `src/i18n/locales/it/home.json` | Rewrite Italian hero and section copy for natural local phrasing | Copy only. |
| `src/i18n/locales/*/{auth,chat,parent,tutor,pricing,billing,support,admin,errors}.json` | Refine P0 strings where Phase 17 requires better local copy | Avoid reshaping unless needed. |
| `src/components/home/HomeHero.tsx` | Render optional `titleLines`; consume `localeLayout`; add scoped title/action classes | Highest-priority component change. |
| `src/components/home/*.tsx` | Apply limited wrapping/density classes if visual QA finds breaks | Do not redesign sections. |
| `src/layouts/MarketingLayout.tsx` / navigation components | Apply navigation label class if labels crowd | Only if QA finds breakage. |
| `src/styles/premium-theme.css` | Add scoped locale typography/action hooks | No theme rewrite. |
| `docs/language/*.md` | Add Phase 17 copy and visual QA guidance | Keep Phase 16 terminology decisions. |
| `README.md` | Add concise Phase 17 verification notes if required | No broad README rewrite. |

### Files to Avoid Modifying

| File/Area | Reason |
| --- | --- |
| `src/i18n/index.ts` | Initialization already satisfies Phase 17 needs. |
| `src/i18n/languages.ts` | No new languages or persistence changes in scope. |
| `src/i18n/namespaces.ts` | Existing namespace set is sufficient. |
| `src/lib/api.ts`, API services, query hooks | Phase 17 has no backend/API behavior changes. |
| Auth stores, route guards, demo backend | Language persistence remains browser-local; no production preference system. |
| Major layout primitives/design system | Broad refactors are out of scope unless a specific locale break requires a small fix. |

## Data Flow

```text
Browser/localStorage
  -> getInitialLanguage()
  -> i18next active language
  -> <html lang="{language}">
  -> React components use useTranslation()
  -> component reads locale JSON copy
  -> component reads getLocaleLayout(i18n.resolvedLanguage)
  -> JSX renders structured copy such as titleLines
  -> scoped Tailwind/CSS hooks control wrapping and density
```

Important boundaries:

- Copy data flows from locale JSON into components.
- Layout hints flow from `localeLayout.ts` into components.
- Language state flows from i18next and `localStorage`.
- CSS can use `<html lang>` for broad language-specific behavior.
- No API request should be introduced for Phase 17 language or layout decisions.

## Build Order

1. **Copy rules first**
   Update docs/language guidance so copywriters and implementers agree on locale-specific structure, banned terms, and visual QA rules.

2. **Add `localeLayout.ts`**
   Add the typed layout hint module with conservative defaults and English fallback.

3. **Update `HomeHero` rendering**
   Add optional `titleLines` support, use `getLocaleLayout`, and add scoped classes/data attributes. Verify English fallback still works if `titleLines` is missing.

4. **Rewrite homepage locale copy**
   Update the four `home.json` files. Keep key names stable unless adding optional structured keys such as `titleLines`.

5. **Apply minimal CSS hooks**
   Add only the typography/action hooks needed by visual QA. Prefer copy shortening before adding more CSS.

6. **Refine P0 locale copy**
   Work namespace by namespace: `auth`, `chat`, `parent`, `tutor`, `pricing`, `billing`, `support`, `admin`, `errors`. Avoid component changes unless text overflows.

7. **Run terminology and build checks**
   Run the existing banned-term `rg` audit, `npm run lint`, and `npm run build`.

8. **Run visual QA**
   Check `/`, auth/register, `/chat`, parent/report, tutor, pricing, billing, and support in EN/DE/FR/IT at mobile, tablet, and desktop widths.

## Visual QA Workflow

Use the existing app and language switcher; do not build a new visual regression platform in Phase 17 unless the phase plan explicitly asks for it.

Recommended manual matrix:

| Viewport | Purpose |
| --- | --- |
| 390px mobile | Long CTA, navbar/menu, stacked hero, form labels. |
| 768px tablet | Two-column transitions, card wrapping, onboarding forms. |
| 1280px desktop | Hero display typography, marketing navigation, pricing card rhythm. |

Recommended routes:

- `/`
- `/login`
- `/register`
- `/chat`
- `/parent`
- `/parent/report` or nearest child report route
- `/tutor`
- `/pricing`
- `/billing`
- `/support`

Checks:

- Switch EN -> DE -> FR -> IT without reload.
- Refresh and confirm `stoa_language` persists.
- Inspect that `<html lang>` matches the selected language.
- Confirm German hero title is stacked and no longer a long single display sentence.
- Confirm buttons wrap cleanly without clipping icons or labels.
- Confirm pricing/billing cards keep stable sibling widths.
- Confirm chat action labels do not overflow compact controls.
- Confirm no user-visible P0 copy uses banned AI-heavy/sales-heavy terms.

Automated checks can stay lightweight:

```bash
npm run lint
npm run build
rg "\bAI\b|AI-|AI |Artificial Intelligence|Chatbot|Robot Tutor|Virtual Teacher|Automated Teacher|Human backup|Teacher Backup|teacher backup|human tutor|What STOA is selling|What we are selling|Buy now|Customers|frontend enforce" src/pages src/components src/i18n -n
```

If Playwright coverage is added, prefer a small locale smoke test that opens `/`, changes language, and asserts the hero title for each language. Do not try to encode every copy line into E2E tests.

## Patterns to Follow

### Structured Copy, Not Fragment Assembly

**What:** Put complete copy units in locale JSON. Use arrays only when the UI displays true repeated/stacked units.

**Example:**

```json
"title": "Lernen. Fragen. Verstehen.",
"titleLines": ["Lernen.", "Fragen.", "Verstehen."]
```

**Why:** German, French, Italian, and English can use different grammar and rhythm without JSX assembling partial sentences.

### Typed Layout Hints

**What:** Use `localeLayout.ts` for per-language class hints.

**Why:** It avoids scattered `language === 'de'` checks while keeping layout decisions outside translation files.

### Scoped CSS Hooks

**What:** Add classes like `.locale-display-title` and `.locale-action`, optionally using `html[lang="de"]`.

**Why:** The app already syncs `<html lang>`, so CSS can respond to language without extra React state.

## Anti-Patterns to Avoid

### Hardcoded Per-Language JSX Copy

**What:** Writing `language === 'de' ? '...' : '...'` in components.

**Why bad:** It bypasses i18n files, makes copy review harder, and spreads translation logic through UI code.

**Instead:** Add keys to locale JSON and render them through `useTranslation`.

### Layout Metadata in Translation JSON

**What:** Adding keys such as `"fontSize": "small"` or `"compact": true` to `home.json`.

**Why bad:** Copy files become a mixed content/layout API and are harder to review across locales.

**Instead:** Use `localeLayout.ts` for non-copy hints.

### Broad Design-System Refactor

**What:** Rebuilding typography tokens, card primitives, navigation, or page layout foundations as part of copy polish.

**Why bad:** Phase 17 is copy and locale fit work; broad refactors increase regression risk across many shipped surfaces.

**Instead:** Patch the high-risk components and add limited CSS hooks.

### Shrinking Text Until It Fits

**What:** Solving every long label by reducing font size.

**Why bad:** It degrades readability and hides copy quality problems.

**Instead:** Rewrite local copy first, then use wrapping, stable min heights, and scoped responsive classes.

## Constraints

- Keep Phase 17 limited to localized copy quality, responsive typography, and multilingual UI fit.
- Do not add new product features, routes, languages, backend APIs, CMS/TMS integration, machine translation, or cross-device language preference persistence.
- Do not change `stoa_language` behavior.
- Do not change API mode, demo backend, auth, streaming, upload, billing, or role-guard logic.
- Keep the frontend decoupled from model providers.
- Preserve English fallback behavior for missing optional keys.
- Preserve existing namespace imports and static JSON resources.
- Keep locale copy education-centered and avoid user-visible banned terms from the Phase 16 docs.
- Prefer local component and CSS patches over broad refactors.
- Treat legal copy and final professional/legal translation review as future work unless explicitly planned.

## Research Flags

| Area | Confidence | Notes |
| --- | --- | --- |
| Existing i18n integration | HIGH | Verified in `src/i18n/index.ts`, `languages.ts`, `namespaces.ts`, and `src/main.tsx`. |
| HomeHero architecture | HIGH | Verified current single-string title rendering in `HomeHero.tsx`; German overflow issue is documented in `.planning/PROJECT.md`. |
| Locale layout module | HIGH | Fits existing TypeScript/Tailwind style and avoids broad refactors. |
| CSS hook approach | HIGH | Existing `premium-theme.css` and synchronized `<html lang>` support scoped language styles. |
| Visual QA scope | MEDIUM | Routes and commands are known, but exact route availability and screenshot automation details should be confirmed during phase planning. |

## Sources

- `.planning/PROJECT.md` - Phase 17 goal, scope, German hero issue, constraints, and decisions.
- `.planning/ROADMAP.md` - Phase 16 i18n foundation and localization completion criteria.
- `src/i18n/index.ts` - i18next initialization, resources, fallback, `<html lang>`, and `stoa_language` persistence.
- `src/i18n/languages.ts` - supported language list and initial language resolution.
- `src/i18n/namespaces.ts` - namespace structure.
- `src/i18n/locales/{en,de,fr,it}/home.json` - current homepage copy shape and known single-title issue.
- `src/components/home/HomeHero.tsx` - current hero title rendering and layout classes.
- `src/components/home/*.tsx` - current homepage section translation usage.
- `src/styles/premium-theme.css` and `src/index.css` - current typography/theme hooks.
- `docs/language/glossary.md`, `copy-style-guide.md`, `terminology-replacement.md`, and `translation-qa-checklist.md` - Phase 16 terminology and QA rules.
- `package.json` - available verification scripts.
