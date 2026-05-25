# Phase 101: Responsive Typography and Multilingual Fit Pass - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Final localized copy needs targeted responsive safeguards across P0 components and viewports. This phase may tune component classes and scoped CSS, but must not perform a broad visual redesign.
</domain>

<decisions>
## Implementation Decisions

- Prefer wrapping, `min-w-0`, responsive gaps, and stable card/button dimensions over truncation.
- Keep changes scoped to high-risk P0 components.
- Verify with typecheck and local browser inspection where possible.
</decisions>

<code_context>
## Existing Code Insights

High-risk components:

- `HomeHero`
- `MarketingLayout`
- `PlanCard`
- `FeatureComparison`
- `PricingFAQ`
- `TeacherRequestInlineAction`
</code_context>

<specifics>
## Specific Ideas

- Make marketing nav and CTA buttons wrap cleanly.
- Make plan-card titles, feature text, and CTAs wrap without overflow.
- Add `min-w-0` to nested flex/grid text containers.
- Ensure chat teacher request action has enough wrapping room.
</specifics>

<deferred>
## Deferred Ideas

Formal copy-review matrix, visual QA docs, README updates, and final build closure are deferred to Phase 102.
</deferred>
