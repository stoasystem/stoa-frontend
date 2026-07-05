# Phase 260: Cinematic Motion Direction And Implementation - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Define Home V2's cinematic motion direction and implement only restrained, performance-safe polish. Motion should add life and materiality, not visual noise.
</domain>

<decisions>
## Implementation Decisions

- Apple WWDC/product pages are composition and motion references only.
- Motion must never hide content as a dependency.
- Avoid scans, particles, heavy Lottie, and continuous scroll handlers.
- Use transform/opacity and respect reduced motion.
</decisions>

<code_context>
## Existing Code Insights

- Learning Thread already has progress and breathing-light mechanics.
- Parent and Trust markers already have soft breathing.
- Phase 259 made reveal content visible by default to remove hidden-content risk.
</code_context>

<specifics>
## Specific Ideas

- Write a motion direction document.
- Add a small material light breath to the Final CTA deep panel.
- Keep Phase 260 implementation minimal so the page remains restrained.
</specifics>

<deferred>
## Deferred Ideas

- Complex scroll timelines.
- New animation dependencies.
- Keynote-like hero sequence.
</deferred>
