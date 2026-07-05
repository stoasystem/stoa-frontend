# Home V2 v6.3 Motion Direction

**Date:** 2026-07-06
**Scope:** `/home-v2`

## Motion Thesis

Home V2 motion should feel like a quiet product story being revealed, not a website template animating sections. The reference is Apple-like restraint and cinematic keynote pacing, adapted to Swiss family education.

The page should feel alive through light, shadow, and gradual emphasis. It should not feel like AI, SaaS, or a dashboard.

## Reference Principles

Use Apple WWDC/product launch material for principles only:

- Chapter-like scroll rhythm.
- A single idea per section.
- Large image and sparse text.
- Material revealed through light rather than decoration.
- Details appear with a sense of weight and calm.
- Text marks meaning; it does not over-explain.

Do not copy Apple assets, logos, product screenshots, exact frames, or page layouts.

## STOA Adaptation

STOA's emotional tone is:

- Warm, not cold-tech.
- Quietly confident, not promotional.
- Parent-aware, not surveillance-oriented.
- Teacher-backed, not teacher-replacing.
- Cinematic, but never theatrical.

## Implementation Rules

- Content must remain visible if JavaScript, IntersectionObserver, or animation fails.
- Motion is progressive enhancement, not a content gate.
- Use transform and opacity only.
- Avoid continuous `scroll` event handlers.
- Respect `prefers-reduced-motion`.
- Keep animation durations slow enough to feel material, but not sluggish.
- Do not use scanning sweeps, particles, decorative orbs, or heavy Lottie stacks in v6.3.

## Current Implemented Motion

- Learning Thread line and nodes gradually communicate progress.
- Active node and spark use soft breathing light.
- Parent and Trust proof markers use subtle glow.
- Final CTA deep panel now has a very light material breath through `home-v2-final-light-breathe`.

## Future Motion Candidates

Only consider in later phases if needed:

- CSS `view()` timeline for section entry, with visible-by-default fallback.
- A more cinematic Hero image/proof reveal.
- A lightweight line-drawing accent for Learning Thread, implemented in CSS/SVG without a new library.
- Non-face AI-generated light/texture assets if they improve materiality and are labelled.
