# Phase 100: P0 Locale Copy Rewrite and Terminology Cleanup - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

P0 STOA surfaces need natural English, German, French, and Italian copy plus user-visible terminology cleanup. This phase should not change product logic, backend contracts, route behavior, or payment mechanics.
</domain>

<decisions>
## Implementation Decisions

- Rewrite visible P0 locale JSON copy directly.
- Add localized plan-display keys and map billing plan IDs to locale copy in `PlanCard`.
- Keep internal API/data fields intact unless they leak as rendered copy.
- Replace visible `Bot` icon naming in components to avoid terminology-audit false positives without changing behavior.
</decisions>

<code_context>
## Existing Code Insights

- Homepage copy lives in `src/i18n/locales/{en,de,fr,it}/home.json`.
- Chat, auth, parent, tutor, pricing, billing, and support locale files already exist.
- `PlanCard` renders `BillingPlan` English fields directly.
- `src/data/phase11MockData.ts` includes English plan features that can appear in pricing/billing.
</code_context>

<specifics>
## Specific Ideas

- Apply the approved Phase 17 hero titles and CTAs.
- Use `titleLines` for the German hero.
- Calm parent report copy and make tutor copy professional.
- Remove aggressive sales and technical checkout wording.
- Map pricing/billing plan display text through locale files.
</specifics>

<deferred>
## Deferred Ideas

Viewport-based layout evidence and final QA documents are deferred to Phases 101 and 102.
</deferred>
