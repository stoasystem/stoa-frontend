# Phase 238: Asset Metadata, Storage, And Optimization Strategy - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss

<domain>
## Phase Boundary

Define the metadata ledger, future storage namespace, naming convention, crop/optimization expectations, and shortlist process for Home V2 assets. This phase does not commit binary image files.

</domain>

<decisions>
## Implementation Decisions

### Metadata
- Every candidate needs a ledger row before download, purchase, or implementation.
- Metadata must track source, URL, license, creator/source, free/paid status, release risk, AI status, crop notes, score, approval, download/purchase status, and future local path.
- AI generated vs AI enhanced vs non-AI stock must be explicitly recorded.
- Metadata remains useful even after local file conversion.

### Storage And Naming
- Future committed assets should live under `public/img/home-v2/`.
- Filenames should include section, role, source, and source/candidate ID.
- Source downloads should not be committed without approval and optimization.
- The asset ledger should live in docs/planning, not component code.

### Crop And Optimization
- Hero needs desktop and mobile crop notes before implementation.
- Future images need stable aspect-ratio wrappers and responsive image behavior.
- Optimization should preserve visual quality and source traceability.
- Alt text intent should be drafted in handoff but finalized during implementation.

### the agent's Discretion
The agent may define practical examples for ledger rows and filenames without committing actual assets.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing public asset conventions can be extended later, but this phase remains docs-only.

### Established Patterns
- Repository hygiene forbids accidental generated/binary churn unless explicitly intended.

### Integration Points
- Output feeds later implementation and asset insertion phases.

</code_context>

<specifics>
## Specific Ideas

Final assets should not be downloaded or committed until metadata, source approval, and optimization expectations are clear.

</specifics>

<deferred>
## Deferred Ideas

Actual image conversion, `srcset`, component props, and screenshot QA remain future implementation work.

</deferred>
