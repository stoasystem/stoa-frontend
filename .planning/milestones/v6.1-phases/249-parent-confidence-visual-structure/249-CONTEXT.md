# Phase 249: Parent Confidence Visual Structure - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Define the new Parent Confidence visual structure: a warm family image plus one restrained progress note.
</domain>

<decisions>
## Implementation Decisions

### Visual Structure
- Use the existing family-learning image candidate for this prototype pass.
- Keep the image inside the existing double-bezel `HomeV2VisualFrame`.
- Replace stacked pills with one paper-like note positioned over the image.
- Add only a subtle breathing light on the note marker; avoid scan effects.

### Responsive Behavior
- Desktop may use editorial split: copy beside image.
- Tablet and mobile stack vertically.
- Mobile image stays constrained and must not dominate the viewport.

### the agent's Discretion
Exact note placement can vary by viewport if it prevents overlap and preserves image readability.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `HomeV2VisualFrame` for nested shell.
- `father-son-laptop-preview.jpg` for the current parent/family visual.

### Established Patterns
- Home V2 avoids large decorative gradients and uses restrained radial light only inside surfaces.
- Motion should use transform/opacity and custom cubic-bezier timing.

### Integration Points
- Scoped CSS additions belong in `home-v2-premium.css`.
</code_context>

<specifics>
## Specific Ideas

The proof surface should read like a small weekly note placed on a desk or family image, not a system notification.
</specifics>

<deferred>
## Deferred Ideas

Paid or commissioned Swiss family imagery remains deferred.
</deferred>
