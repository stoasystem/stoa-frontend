# Phase 257: Home V2 Full-Page Visual QA - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit `/home-v2` as one complete Swiss-parent homepage, not as isolated Hero, Learning Thread, Parent Confidence, Trust, and CTA blocks. The top acceptance standard is: a Swiss middle-to-upper-income parent can scan the page on mobile for 30 seconds and perceive a calm, credible, visually refined education product rather than an AI tool page.

This phase does not replace `/`, does not download new assets, and does not implement visual fixes. It produces severity-ranked findings that drive Phase 258 and Phase 259.
</domain>

<decisions>
## Implementation Decisions

- Treat v6.3 as near-public-quality readiness work, not just a documentation QA pass.
- Start with screenshots and rendered inspection before touching CSS or component code.
- Use the high-end visual direction as the evaluation lens: Editorial Luxury, cinematic scroll, refined whitespace, double-bezel depth, restrained warm motion, and anti-AI-tool visual discipline.
- EN/DE are currently runtime-supported languages. FR/IT `homeV2.json` files exist but are not currently wired into `supportedLanguages` or `i18n` resources, so Phase 257 should record FR/IT as static locale checks unless runtime support changes in a later phase.
</decisions>

<code_context>
## Existing Code Insights

- `/home-v2` is rendered by `src/pages/home-v2/HomeV2Page.tsx`.
- Sections live under `src/components/home-v2/`.
- Premium scoped styling lives in `src/styles/home-v2-premium.css`.
- Current preview assets live under `img/home-v2/preview/`.
- Existing candidates live under `img/home-v2/candidates/`.
- Existing focused test: `tests/e2e/home-v2.spec.ts`.
</code_context>

<specifics>
## Specific Ideas

Audit categories:

- Full-page first impression and section rhythm.
- Hero image and mobile dominance.
- Learning Thread legibility, alternation, and breathing-light restraint.
- Parent Confidence image/proof-note fit.
- Trust warmth, privacy-by-restraint, and fine-line principle rhythm.
- Final CTA close-out quality.
- Nav/Login/Start learning visibility and usability.
- EN/DE rendered fit; FR/IT static copy-length/tone risk.
- Reduced-motion and performance red flags.
</specifics>

<deferred>
## Deferred Ideas

- New asset search/download belongs to Phase 258.
- Code and CSS fixes belong to Phase 259.
- Motion direction and implementation belong to Phase 260.
- Switch-over decision and final readiness report belong to Phase 261.
</deferred>
