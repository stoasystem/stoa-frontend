# Phase 240: Search Source Screen And Candidate Pool - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Autonomous execution

<domain>
## Phase Boundary

Search candidate image sources for Home V2, apply v2.8 source and license rules, and assemble a candidate pool for the five Home V2 sections.
</domain>

<decisions>
## Implementation Decisions

- Download suitable free candidates when source and license metadata are clear.
- Keep iStock paid assets approval-gated and do not download watermarked comps as final-ready assets.
- Keep Magnific source/API use deferred because it mixes stock and AI creative tooling.
- Preserve current `/`, React code, and localization.
</decisions>

<code_context>
## Existing Code Insights

Existing root-level `img/` assets are used by the current homepage. New Home V2 candidates should live in `img/home-v2/candidates/pexels/` to keep them auditable and separate.
</code_context>

<specifics>
## Specific Ideas

Use Pexels first for family homework, parent child studying, teacher support, and worksheet/detail candidates. Record source, creator/vendor, download URL, and license URL.
</specifics>

<deferred>
## Deferred Ideas

iStock purchase, Magnific account/API sourcing, final crop variants, React implementation, and screenshot QA remain future scope.
</deferred>
