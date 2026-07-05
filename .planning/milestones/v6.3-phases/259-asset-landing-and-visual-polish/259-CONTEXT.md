# Phase 259: Asset Landing And Visual Polish - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement high-confidence v6.3 visual improvements in `/home-v2` only. This phase should not force a weaker image replacement. It should fix known visual robustness issues and make current preview assets more polished while preserving the five-section IA.
</domain>

<decisions>
## Implementation Decisions

- Do not replace Hero or Parent imagery with lower-quality free alternatives.
- Make reveal behavior robust before adding more motion.
- Treat Parent image as preview-safe but not final-public; use CSS treatment as an interim polish.
- Add scroll-margin to sections that can be targeted by nav/QA scroll behavior.
</decisions>

<code_context>
## Existing Code Insights

- Reveal behavior is centralized in `src/components/home-v2/HomeV2Reveal.tsx` and `src/styles/home-v2-premium.css`.
- Section spacing and image treatment are mostly in scoped Home V2 components and CSS.
- Phase 257 evidence showed full-page screenshots had blank middle sections before reveal triggers.
</code_context>

<specifics>
## Specific Ideas

- Keep reveal content visible by default, preserving robustness for screenshots and failed/delayed observers.
- Keep Phase 260 responsible for a more refined motion model.
- Add `scroll-mt` to Learning Thread and Final CTA to reduce sticky nav overlap risk.
- Desaturate and soften Parent Confidence image to reduce stock-commercial feel.
</specifics>

<deferred>
## Deferred Ideas

- Paid/commissioned image replacement.
- New AI-generated image insertion.
- Heavy motion choreography.
</deferred>
