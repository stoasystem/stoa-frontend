# Phase 248: Parent Confidence Audit And Copy Contract - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit the current `HomeV2ParentConfidence` section and lock the parent-facing emotional promise before visual or code changes.
</domain>

<decisions>
## Implementation Decisions

### Copy Contract
- Parent Confidence must express parental relief: parents can stay close without taking over homework.
- Remove dashboard-like language, stacked feature pills, and supervision-heavy wording.
- Keep copy short, warm, and non-technical across EN/DE/FR/IT.
- Use one quiet parent-readable note as proof, not a list of product capabilities.

### the agent's Discretion
The exact title and note phrasing can be chosen by the implementation as long as it preserves calm proximity and avoids monitoring/control language.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `HomeV2ParentConfidence.tsx` owns the section.
- `HomeV2VisualFrame` already provides the double-bezel visual shell.
- `HomeV2Reveal` provides IntersectionObserver-based reveal motion.

### Established Patterns
- Home V2 uses scoped CSS variables and classes in `src/styles/home-v2-premium.css`.
- Four-language copy lives in `src/i18n/locales/*/homeV2.json`.

### Integration Points
- `/home-v2` route composes this section through `HomeV2Page.tsx`.
</code_context>

<specifics>
## Specific Ideas

The section should feel like a quiet weekly progress note at home, not a parent dashboard.
</specifics>

<deferred>
## Deferred Ideas

Final paid/commissioned photography and full homepage copy pass remain outside v6.1.
</deferred>
