# Phase 178: Homepage Practice Entry UI and Preview Components - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>

## Phase Boundary

Homepage users should quickly understand that Practice is a short learning entry that leads to hints, Learning Chat, teacher support, and parent visibility.

This phase owns the homepage Practice entry component split and preview UI. It must not add new Practice lessons, expand curriculum, rebuild Practice internals, add game economy mechanics, or copy Duolingo visual/brand language.

</domain>

<decisions>

## Implementation Decisions

### the agent's Discretion

Use the Phase 33 research summary and roadmap success criteria to implement a restrained, premium Practice entry. "Fun" should mean concrete, approachable, and motivating through visible progress and short-session clarity.

### UI Direction

- Keep the section after Hero.
- Use `PracticeEntryCard` for copy and CTA.
- Use `HomePracticePreview` for equation path preview, short challenge preview, and connected outcomes.
- Keep Learning Chat, Professional Teacher Support, and Parent Report visible in the same section.

</decisions>

<code_context>

## Existing Code Insights

- `HomePracticeEntry` already exists and is rendered after `HomeHero`.
- `HomePracticeToChatFlow` already renders the Practice -> Hint -> Learning Chat -> Teacher Support -> Parent Report sequence.
- Existing STOA theme classes include warm grey section background, premium primary button, card borders, and subtle shadows.
- `HomePage` currently keeps `HomePracticeEntry` before `HomeLearningFlow`.

</code_context>

<specifics>

## Specific Ideas

- Extract `PracticeEntryCard`.
- Add `HomePracticePreview`.
- Keep `HomePracticeToChatFlow` as the explanatory path component inside the preview.
- Add preview topics for one-step equations, quadratic basics, and linear systems.
- Avoid "Play now", XP, streaks, hearts, gems, leaderboards, and Duolingo-facing user copy.

</specifics>

<deferred>

## Deferred Ideas

- Four-language mobile/overflow QA belongs to Phase 179.
- Documentation and README handoff belong to Phase 180.

</deferred>
