# Phase 262: Final Photography Acceptance Contract - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Define what counts as acceptable final Hero and Parent Confidence photography for a Swiss-parent-facing high-end education homepage. This phase creates the source-search contract; it does not download or implement images.
</domain>

<decisions>
## Implementation Decisions

- Hero/Parent identifiable people imagery should be real licensed photography, not AI-generated faces.
- AI remains allowed for non-identifiable detail imagery, but that is not the main need for v6.4.
- Current preview images are allowed to remain if free-source search does not beat them.
- Paid/commissioned sourcing is acceptable as a recommendation, but not purchased in v6.4.
</decisions>

<code_context>
## Existing Code Insights

- Hero image is used in `src/components/home-v2/HomeV2Hero.tsx`.
- Parent image is used in `src/components/home-v2/HomeV2ParentConfidence.tsx`.
- Current preview images live in `img/home-v2/preview/`.
- v6.3 found Hero and Parent imagery preview-safe but not final-public strong.
</code_context>

<specifics>
## Specific Ideas

- Hero needs a credible Swiss/European family-learning moment.
- Parent needs clear parent progress-awareness without hovering, monitoring, or stock-commercial tone.
- Both images must crop cleanly into current Home V2 frames.
</specifics>

<deferred>
## Deferred Ideas

- New image downloads: Phase 263.
- Crop sheets: Phase 264.
- Implementation: Phase 265.
</deferred>
