# Phase 252: Trust Art Direction And Asset Decision - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Lock the Trust/Assurance image direction before layout implementation.
</domain>

<decisions>
## Implementation Decisions

### Art Direction
- Use one warm, close learning-detail image rather than a feature collage or compliance motif.
- Prefer the existing `study-desk-writing-preview.jpg` placeholder for v6.2 because it is quiet, intimate, non-endorsement-heavy, and not a tutoring pose.
- Avoid images that imply parent supervision, live observation, surveillance, or direct family endorsement.
- Treat the selected image as prototype-safe only; final public use still benefits from paid or commissioned Swiss/European education photography.

### the agent's Discretion
Final crop and overlay placement can be adjusted during implementation as long as the image remains restrained and does not dominate narrow screens.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `img/home-v2/preview/study-desk-writing-preview.jpg`
- `HomeV2VisualFrame` for double-bezel image framing.
- `HomeV2Reveal` for viewport reveal motion.

### Established Patterns
- Home V2 images are imported through `new URL(..., import.meta.url).href`.
- Scoped visual rules live in `src/styles/home-v2-premium.css`.

### Integration Points
- `HomeV2TrustLayer.tsx` owns the section implementation.
</code_context>

<specifics>
## Specific Ideas

The image should feel like a quiet learning signal, not proof of supervision.
</specifics>

<deferred>
## Deferred Ideas

Final paid or commissioned Trust/Assurance photography remains deferred.
</deferred>
