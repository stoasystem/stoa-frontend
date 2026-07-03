# Phase 237: Section Asset Briefs And Search Taxonomy - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss

<domain>
## Phase Boundary

Define Home V2 section-specific asset briefs, search taxonomy, candidate scoring, and rejection criteria. This phase does not pick final assets or create implementation files.

</domain>

<decisions>
## Implementation Decisions

### Section Briefs
- Hero needs real family/home-study imagery with parent nearby but not controlling.
- Learning Thread needs evidence of progression rather than a flat feature-card metaphor.
- Parent Confidence should show reassurance and patterns, not surveillance.
- Swiss Trust Layer should use restrained institutional cues and avoid badge wallpaper.

### Search Taxonomy
- Search should cover family homework, parent-child studying, European home learning, teacher support, and calm study materials.
- German, French, and Italian query variants should support locale-aware source searching later.
- Search terms should avoid AI, robot, chatbot, guaranteed grades, and surveillance cues.
- Candidate search should start with Pexels, then escalate to iStock or Magnific stock if quality is insufficient.

### Candidate Scoring
- Candidates are scored for authenticity, Swiss-parent fit, learning relevance, crop flexibility, diversity/age fit, brand fit, and risk level.
- Hero requires strong authenticity, risk, crop flexibility, and brand-fit scores.
- Supporting sections may use detail/environment imagery but still need clear source and risk metadata.
- Reject candidates that look AI-generated, staged, negative, surveillance-like, or outcome-guaranteeing.

### the agent's Discretion
The agent may refine query wording and scoring labels as long as section roles stay aligned with v2.6 IA and v2.7 visual direction.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs/home/home-v2-information-architecture.md` defines the five Home V2 sections.
- `docs/home/home-v2-visual-direction.md` defines image art direction and section composition.

### Established Patterns
- Home V2 must preserve Swiss-parent-first homepage positioning.

### Integration Points
- Output feeds later image search and candidate shortlist work.

</code_context>

<specifics>
## Specific Ideas

The Hero should avoid stocky smiles and AI-looking faces/hands; it needs a credible home-study learning moment.

</specifics>

<deferred>
## Deferred Ideas

Actual search, candidate URL capture, and final shortlist approval remain later execution work.

</deferred>
