# Phase 234: Section Composition, Imagery, And Motion Blueprint - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss; builds on Phases 232-233

<domain>
## Phase Boundary

Translate the Home V2 IA into section-level composition, image art direction, CTA/navigation treatment, and motion choreography. This phase does not source images, generate assets, write animation code, or implement the Home V2 route.

</domain>

<decisions>
## Implementation Decisions

### Section Composition
- Use five sections: Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, Final CTA.
- Hero uses editorial split with parent promise and a double-bezel family/homework visual.
- Learning Thread uses a cinematic sequence, not a flat feature row.
- Parent Confidence shows patterns and reassurance, not surveillance.

### Imagery
- Hero imagery should show an actual family/homework learning moment.
- Product proof should show learning progression and teacher-backed support as evidence.
- Trust imagery should be restrained and institutional, not badge-heavy.
- Final image selection, licensing, generation, and insertion are deferred.

### CTA And Navigation
- Primary CTA remains `Start learning`.
- Trial quota semantics remain supporting journey information, not the hero hook.
- Public nav may become a detached/floating treatment later if compatible with layout constraints.
- Secondary actions stay quiet.

### Motion
- Motion should feel heavy, calm, and crafted.
- Use transform and opacity with custom cubic-bezier timing.
- Avoid continuous scroll listeners, layout-triggering animation, large scrolling blur, and generic easing.
- Reduced-motion mode must preserve content order and comprehension.

### the agent's Discretion
The agent may specify exact choreography sequence and timing ranges as design guidance, not final code.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- No final image assets are selected in this phase.

### Established Patterns
- Home V2 remains a future preview namespace from v2.6; current `/` remains unchanged.

### Integration Points
- This blueprint feeds later image strategy, animation design, copywriting, localization, and implementation milestones.

</code_context>

<specifics>
## Specific Ideas

The homepage should avoid stiff "try once" wording; `Start learning` is the preferred natural CTA direction.

</specifics>

<deferred>
## Deferred Ideas

Image sourcing/generation, GSAP or framework animation implementation, and browser screenshot QA are deferred until components exist.

</deferred>
