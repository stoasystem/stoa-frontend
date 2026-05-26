# Phase 166: Homepage Practice Entry and Learning Funnel Presentation - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Add homepage Practice introduction and a restrained Practice -> Hint -> Learning Chat -> Teacher Support -> Parent Report flow.
</domain>

<decisions>
## Implementation Decisions

### Visual Direction
- Use STOA's existing premium editorial style.
- Avoid cartoon, game, shop, gems, hearts, or loud reward styling.
- Place Practice after the hero so the hero remains about STOA's broader learning support.

### CTA Hierarchy
- Primary CTA remains Start learning.
- Secondary CTA is See how practice works.

### the agent's Discretion
Use compact cards and route-flow components to avoid overpowering the homepage.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `HomeHero`, `HomeLearningFlow`, `HomeTeacherFallback`, and `HomeParentVisibility`.

### Established Patterns
- Homepage uses localized JSON under `src/i18n/locales/*/home.json`.
- Public components use burgundy, warm neutrals, and editorial headings.

### Integration Points
- `src/pages/home/HomePage.tsx`.
</code_context>

<specifics>
## Specific Ideas

Add `HomePracticeEntry`, `HomePracticeToChatFlow`, and `HomeLearningJourney`.
</specifics>

<deferred>
## Deferred Ideas

No standalone Practice marketing page in this phase.
</deferred>
