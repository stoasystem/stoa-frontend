# Phase 235: Responsive, Accessibility, And Implementation Handoff - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss; closes v2.7

<domain>
## Phase Boundary

Close the visual direction milestone by documenting responsive, accessibility, localization, performance, QA, and implementation handoff rules. This phase does not implement or test a browser-rendered Home V2 page because no Home V2 components exist in this milestone.

</domain>

<decisions>
## Implementation Decisions

### Responsive
- Desktop asymmetry must collapse to single-column below tablet widths.
- Mobile removes rotations, negative overlaps, and complex Z-axis tension.
- Fixed-format visual elements need stable aspect ratios.
- First viewport should show the parent promise and still hint at the next section.

### Accessibility
- Contrast must work on paper, sage, charcoal, and image-adjacent surfaces.
- CTA tap targets and dimensions must stay stable.
- Motion must respect reduced-motion settings.
- Image overlays must not be necessary for text legibility.

### Localization
- English, German, French, and Italian text lengths must be considered before implementation.
- German and French should use deliberate line breaks rather than smaller fonts.
- CTA/nav labels must fit without viewport-scaled type.
- Body copy should remain parent-readable in all four languages.

### Handoff
- Later implementation should use `src/pages/home-v2/`, `src/components/home-v2/`, and `homeV2` namespace conventions from v2.6.
- The current `/` route remains unchanged until explicit switch approval.
- Future milestones handle image production, animation implementation, copywriting, localization files, React build, and screenshot QA.
- Documentation verification is the correct quality gate for v2.7.

### the agent's Discretion
The agent may mark the milestone complete once requirements, roadmap, phase artifacts, audit, and archive documents are consistent.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing i18n and route architecture will matter in later implementation, but this phase does not edit source code.

### Established Patterns
- Recent planning milestones close by updating requirements, roadmap, state, milestone audit, and archive files.

### Integration Points
- Output closes v2.7 and prepares future milestones for image strategy, animation, copy, localization, implementation, and QA.

</code_context>

<specifics>
## Specific Ideas

This milestone should answer whether the visual design part is done. Completion means design direction is finished; it does not mean the page has been built.

</specifics>

<deferred>
## Deferred Ideas

Home V2 route/component implementation, visual screenshots, final assets, copy JSON, and homepage replacement remain deferred.

</deferred>
