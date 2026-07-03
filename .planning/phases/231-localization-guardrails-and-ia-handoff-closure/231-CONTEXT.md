# Phase 231: Localization Guardrails and IA Handoff Closure - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Document multilingual IA risks, German layout constraints, and implementation handoff requirements for later design/build milestones.

</domain>

<decisions>
## Implementation Decisions

- English, German, French, and Italian copy need native structure, not literal translation.
- German hero and CTA copy should use compact phrases to protect layout.
- French and Italian need copy-length and tone checks before implementation.
- Later milestones should consume this IA for visual direction, imagery, animation, copywriting, localization, implementation, and QA.

</decisions>

<code_context>
## Existing Code Insights

The frontend already supports four-language i18n and has prior locale-specific copy/layout quality gates.

</code_context>

<specifics>
## Specific Ideas

Close v2.6 with a self-contained IA baseline and phase verification artifacts.

</specifics>

<deferred>
## Deferred Ideas

Native translation review and browser layout checks remain deferred until real Home V2 copy and components exist.

</deferred>
