# Phase 285 Plan: Language Controls Implementation

## Objective

Implement app-wide and Home V2 language controls for four launch languages.

## Tasks

- Let shared `LanguageSwitcher` inherit EN/DE/FR/IT from `languageOptions`.
- Add Home V2 desktop segmented micro-control.
- Add Home V2 mobile menu language chips.
- Style controls to feel premium and restrained.
- Cover controls with E2E tests.

## Deliverables

- `src/components/home-v2/HomeV2PremiumHeader.tsx`
- `src/styles/home-v2-premium.css`
- `tests/e2e/home-v2.spec.ts`
- `tests/e2e/localization-preferences.spec.ts`
