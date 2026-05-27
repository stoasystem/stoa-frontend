# Phase 189: Roadmap Visual Design, Localization, and Documentation - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

The roadmap should feel like a calm STOA learning path on desktop and mobile, with four-language copy and durable documentation.
</domain>

<decisions>
## Implementation Decisions

### Localization Scope

Add roadmap copy to the existing `practice.json` namespace in English, German, French, and Italian.

### Documentation Scope

Add roadmap-specific docs under `docs/practice/` so future subject/topic expansion can follow the same rules.
</decisions>

<code_context>
## Existing Code Insights

- Practice UI already uses `useTranslation('practice')`.
- Documentation for Practice lives under `docs/practice/`.
- QA checklists live under both `docs/practice/` and `docs/qa/`; this milestone requested the roadmap checklist under `docs/practice/`.
</code_context>

<specifics>
## Specific Ideas

- Add `roadmap.*` locale keys for title, current lesson, locked hint, continue, review, start, available, completed, progress, and Learning Chat support copy.
- Add docs for UI principles, status rules, mobile layout, demo data, and QA checklist.
</specifics>

<deferred>
## Deferred Ideas

Formal external student comprehension testing is deferred to Phase 36.
</deferred>
