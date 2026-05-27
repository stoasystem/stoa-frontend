# Phase 179: Four-Language Mobile Fit and Accessibility QA - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>

## Phase Boundary

Verify that the homepage Practice entry renders across English, German, French, and Italian without layout, motion, or accessibility regressions.

This phase owns verification and small UI fit fixes only. It should not expand curriculum, add new routes, or change the product hierarchy.

</domain>

<decisions>

## Implementation Decisions

### the agent's Discretion

Use browser checks and code inspection to validate viewport fit, long localized labels, keyboard-visible actions, and reduced-motion-safe class usage. Make small layout fixes if checks reveal overflow.

</decisions>

<code_context>

## Existing Code Insights

- Phase 178 added `PracticeEntryCard` and `HomePracticePreview`.
- Buttons use wrapped `h-auto min-h-11 whitespace-normal` classes in the Practice entry card.
- `HomePracticePreview` uses ordered list semantics for topic preview.
- `PracticeEntryCard` uses `motion-safe:hover` so hover movement should respect reduced-motion preferences.

</code_context>

<specifics>

## Specific Ideas

- Check EN/DE/FR/IT at 320, 375, 430, 768, 1024, and 1440 viewport widths.
- Validate no horizontal overflow via `document.documentElement.scrollWidth <= clientWidth`.
- Capture mobile screenshots for long-label locales.
- Confirm Start Practice and secondary links are present in the accessible link order.

</specifics>

<deferred>

## Deferred Ideas

- Demo-flow docs and README evidence belong to Phase 180.

</deferred>
