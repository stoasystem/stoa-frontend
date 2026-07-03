# Phase 233: Home V2 Design System Extension - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss; builds on Phase 232

<domain>
## Phase Boundary

Define Home V2 typography, color, spacing, grid, surface, CTA, and section rhythm rules before implementation. This phase documents design rules only and does not add packages, fonts, CSS, or React components.

</domain>

<decisions>
## Implementation Decisions

### Typography
- Typography is role-based: display, heading, body, navigation, CTA, caption, and product evidence.
- Do not force all text into one font; unify within role categories.
- Large display text must support German and French line breaks without viewport-scaled font sizes.
- Body copy must prioritize parent readability over decorative type.

### Color
- Extend existing STOA signals with paper, charcoal, burgundy, sage/moss, muted gold, and cool neutral product evidence.
- Avoid one-note beige, dominant purple/blue gradients, generic tech blue, and full-page burgundy.
- Use paper as breathing room, not brand monotony.
- Use gold only as a small accent.

### Spacing And Layout
- Use editorial macro whitespace and asymmetric rhythm on desktop.
- Avoid symmetrical generic three-column feature grids as the main structure.
- Collapse asymmetry to single-column below tablet widths.
- Keep first viewport focused while still hinting at the next section.

### Surfaces And CTA
- Use double-bezel architecture for major image/product/evidence surfaces.
- Do not wrap page sections inside floating cards or nest cards.
- Primary CTA uses pill plus nested trailing arrow circle where appropriate.
- Secondary actions must not compete with `Start learning`.

### the agent's Discretion
The agent may define exact token names as descriptive design guidance; implementation token naming is deferred.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing brand signals include burgundy, charcoal, warm neutrals, and editorial typography from prior design milestones.

### Established Patterns
- Current app surfaces separate public, auth, and role app styling. Home V2 should be public-only.

### Integration Points
- Rules are captured in `docs/home/home-v2-visual-direction.md` for later CSS/component implementation.

</code_context>

<specifics>
## Specific Ideas

The user corrected earlier font interpretation: body text should be consistent with body text, buttons with buttons, inputs with inputs, and so on. Role-based consistency is the requirement.

</specifics>

<deferred>
## Deferred Ideas

Exact font package installation, CSS variable names, and implementation tokens remain deferred to implementation planning.

</deferred>
