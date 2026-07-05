# Phase 254: Trust Visual Structure Redesign - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Define the Trust/Assurance visual structure as an image-led editorial assurance section instead of a feature-card grid.
</domain>

<decisions>
## Implementation Decisions

### Structure
- Desktop keeps the premium editorial split: image left, copy and principles right.
- Narrow and mobile place copy/principles before the image so the image does not dominate the first view.
- Principle rows use fine dividers, small numbering, and restrained text rhythm rather than cards.
- Keep the image in the existing double-bezel frame with a small caption pill.

### Motion
- Reuse `HomeV2Reveal` and add only a subtle caption-marker breathing light.
- Avoid scanning, sweeping, rotating, or large decorative effects.

### the agent's Discretion
Exact frame height and spacing can be adjusted after screenshots if mobile density or image dominance appears.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `HomeV2VisualFrame` provides the nested surface.
- `home-v2-premium.css` already contains parent note and learning-thread motion rules to mirror cautiously.

### Established Patterns
- Home V2 uses CSS variables and scoped classes for section-specific styling.

### Integration Points
- The section remains in `HomeV2Page` between Parent Confidence and Final CTA.
</code_context>

<specifics>
## Specific Ideas

The section should feel more like a precise editorial assurance panel than a SaaS feature grid.
</specifics>

<deferred>
## Deferred Ideas

Full-page Home V2 motion choreography remains deferred.
</deferred>
