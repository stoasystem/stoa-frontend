# Phase 102: QA Evidence, Documentation, and Handoff - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Phase 102 closes Phase 17 with copy review evidence, visual QA evidence, terminology audit evidence, README updates, and handoff risks. No new product features are in scope.
</domain>

<decisions>
## Implementation Decisions

- Record both copy quality and layout fit because Phase 17 is about natural localized copy in stable UI, not literal translation.
- Use product-copy approval language while explicitly preserving native-speaker and legal-sensitive review as handoff gaps.
- Treat intentionally scrollable pricing comparison tables as controlled overflow, but fail page-level horizontal overflow and visible text outside the viewport.
- Fix any small responsive regression found by QA if it blocks Phase 17 acceptance and does not expand product behavior.
</decisions>

<code_context>
## Existing Code Insights

Phase 102 depends on:

- Locale files under `src/i18n/locales/{en,de,fr,it}`.
- `HomeHero` title and layout handling from Phase 99.
- P0 copy rewrites from Phase 100.
- Responsive safeguards from Phase 101.
- Public and authenticated routes loaded through the Vite dev server and demo backend.
</code_context>

<specifics>
## Specific Ideas

- Add `docs/language/copy-review-matrix.md`.
- Add `docs/language/visual-qa-by-locale.md`.
- Update README with Phase 17 rules, examples, and terminology warnings.
- Run terminology grep, TypeScript/build, and browser visual QA.
</specifics>

<deferred>
## Deferred Ideas

- Native-speaker copy review.
- Legal-sensitive translation review.
- Screenshot-based cross-locale visual regression automation.
- Broader accessibility and design-system hardening in Phase 18.
</deferred>
