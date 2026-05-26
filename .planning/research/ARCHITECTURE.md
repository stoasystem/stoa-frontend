# Phase 20 Research: Architecture

**Milestone:** v1.19 Phase 20

## Integration Points

### Locale Files

Primary write scope:

```text
src/i18n/locales/en/
src/i18n/locales/de/
src/i18n/locales/fr/
src/i18n/locales/it/
```

Most Phase 20 copy changes should happen in existing namespace JSON files:

- `home.json`
- `auth.json`
- `chat.json`
- `parent.json`
- `pricing.json`
- `billing.json`
- `support.json`
- `common.json`
- `errors.json`
- `tutor.json` where needed

### Layout Hints

Primary layout file:

```text
src/lib/localeLayout.ts
```

Existing `HomeHero` already consumes this file. Phase 20 can extend it if a documented UI need appears, but should avoid speculative layout knobs.

Candidate additions:

- CTA size or variant hints beyond current `buttonSize`.
- Short/long CTA guidance if components need mobile labels.
- Max-width classes for dense cards or hero actions.
- Locale-specific wrapping classes for action rows.

### Components

Likely components to inspect or update:

- `src/components/home/HomeHero.tsx`
- `src/components/home/HomeCTASection.tsx`
- `src/layouts/MarketingLayout.tsx`
- `src/components/auth/RegisterRoleStep.tsx`
- `src/components/chat/TeacherRequestInlineAction.tsx`
- `src/components/billing/PlanCard.tsx`
- `src/components/common/PageHeader.tsx`
- `src/components/common/LanguageSwitcher.tsx`

Existing safeguards include `min-w-0`, `break-words`, `whitespace-normal`, flexible action rows, and German stacked hero lines. Phase 20 should reuse these patterns.

### Documentation

Required docs:

```text
docs/language/main-website-german-style-study.md
docs/language/main-website-german-copy-reference.md
docs/language/english-copy-rules.md
docs/language/german-copy-rules.md
docs/language/french-copy-rules.md
docs/language/italian-copy-rules.md
docs/language/cross-locale-copy-review-matrix.md
docs/language/cross-locale-visual-qa.md
```

Existing docs can be updated rather than duplicated when they already exist.

## Data Flow

1. Locale JSON provides product copy by namespace.
2. Components call `t(...)` from `react-i18next`.
3. `localeLayout.ts` provides language-specific visual hints.
4. Components combine copy and layout hints to keep page structure stable.
5. Visual QA checks rendered routes by locale and viewport.

## Build Order

1. Source safety and German style study.
2. Language rules and copy review matrix.
3. Locale JSON copy refinement.
4. Locale layout and component adaptation.
5. Visual QA documentation and README.
6. Build/dev verification and source safety recheck.

