# Phase 236: Source Policy And Licensing Screen - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss

<domain>
## Phase Boundary

Define Home V2 source hierarchy, source-specific licensing rules, candidate-risk checks, and AI-use boundaries. This phase does not download, purchase, generate, commit, or insert final image assets.

</domain>

<decisions>
## Implementation Decisions

### Source Hierarchy
- Real licensed photography is the default for Home V2.
- Pexels is the first-pass free source for discovery and candidate evaluation.
- iStock is a paid stock source and must be approval-gated before purchase or final use.
- Magnific is treated as stock/enhancement workflow support, not as the default AI generator.

### Licensing Screen
- Every candidate needs source URL, license type, free/paid status, creator/source name when available, and permitted-use notes.
- Identifiable people and private property need explicit model/property-release risk notes.
- Candidate imagery must not imply endorsement by people, families, schools, or brands.
- Watermarked stock is comp/testing only and must not ship in public pages.

### AI Boundary
- AI-generated people, families, and children are not acceptable as default Hero imagery.
- AI enhancement/upscaling can be considered later only when the source asset is approved and metadata records the enhancement.
- AI generation may be used only as a last-resort exception for non-identifiable support imagery.
- Any AI involvement must be recorded in the asset metadata ledger.

### the agent's Discretion
The agent may define practical source categories and approval language as long as the default remains real licensed imagery over AI generation.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs/home/home-v2-image-asset-strategy.md` exists as the main strategy document.
- `.planning/research/home-v2-image-sources.md` records source notes.

### Established Patterns
- Home V2 work remains a separate planning/design track until explicit implementation.
- Planning milestones use docs plus phase CONTEXT/PLAN/SUMMARY/VERIFICATION artifacts.

### Integration Points
- Output feeds later asset shortlist and implementation milestones.

</code_context>

<specifics>
## Specific Ideas

The user supplied Magnific, Pexels, and iStock and explicitly asked to avoid AI-generated imagery as much as possible.

</specifics>

<deferred>
## Deferred Ideas

Final purchases, downloads, binary commits, and image insertion remain deferred.

</deferred>
