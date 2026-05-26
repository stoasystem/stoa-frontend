# Phase 170: Four-Language Copy, Demo Script, QA, README, and Build Closure - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete four-language copy, docs, demo script, QA checklist, README, and build/browser verification.
</domain>

<decisions>
## Implementation Decisions

### Localization
- Add core Practice-as-entry copy in EN/DE/FR/IT.
- Keep German labels concise.

### Documentation
- Add IA, Practice rules, demo script, QA checklist, and README handoff.

### the agent's Discretion
Use focused docs and existing README style.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/i18n/locales/*`.
- README route and phase sections.

### Established Patterns
- Phase docs under `docs/`.
- Verification via `npm run build` and browser smoke.

### Integration Points
- README and `docs/qa`.
</code_context>

<specifics>
## Specific Ideas

Close the milestone with build and browser smoke evidence.
</specifics>

<deferred>
## Deferred Ideas

External user testing belongs to Phase 32.
</deferred>
