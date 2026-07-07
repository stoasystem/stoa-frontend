# Phase 284 Plan: Runtime Locale Enablement

## Objective

Make EN/DE/FR/IT selectable runtime languages.

## Tasks

- Add FR/IT to `supportedLanguages` and `languageOptions`.
- Import and register FR/IT resources in `src/i18n/index.ts`.
- Keep Romansh out of runtime controls.
- Verify build/type coverage.

## Deliverables

- `src/i18n/languages.ts`
- `src/i18n/index.ts`
