# Phase 99: Title and Layout Infrastructure - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

The frontend needs safe support for locale-specific title structures and layout hints before Phase 100 rewrites the German, French, Italian, and English P0 copy.
</domain>

<decisions>
## Implementation Decisions

- Keep translated strings in existing locale JSON files.
- Keep non-copy rendering hints in a typed helper, not in translation strings.
- Add optional `home.hero.titleLines` support while preserving `home.hero.title` as fallback.
- Avoid broad visual redesign or new dependencies.
</decisions>

<code_context>
## Existing Code Insights

- `src/components/home/HomeHero.tsx` currently assumes `home.hero.title` is one string.
- `src/i18n/languages.ts` already defines `SupportedLanguage`.
- `src/lib/utils.ts` already provides `cn`.
- `src/styles/premium-theme.css` owns premium hero typography classes.
</code_context>

<specifics>
## Specific Ideas

- Add `src/lib/localeLayout.ts`.
- Add layout hints for hero title variant, max width, title class, and action density.
- Update `HomeHero` to use `i18n.language`, `getLocaleLayout`, and a safe title-lines normalizer.
- Add a small scoped CSS class for stacked hero line rhythm.
</specifics>

<deferred>
## Deferred Ideas

Actual locale copy rewrites, terminology cleanup, and visual QA evidence are deferred to later phases.
</deferred>
